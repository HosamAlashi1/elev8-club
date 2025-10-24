import { ToastrsService } from './../../../services/toater.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ApiPortalService } from '../../../services/api.portal.service';
import { VoicesService } from 'src/app/core/services/voices.service';
import { Voice } from 'src/app/core/models/voice.model';
import { ProjectCreationMethod } from '../../pages/my-projects/models/project.model';
import * as AOS from 'aos';

@Component({
  selector: 'app-audio-setup-modal',
  templateUrl: './audio-setup-modal.component.html',
  styleUrls: ['./audio-setup-modal.component.css']
})
export class AudioSetupModalComponent implements OnInit, OnDestroy {
  // ========================================
  // 🔹 Form State
  // ========================================
  projectForm!: FormGroup;
  method: ProjectCreationMethod = 'AI';
  formSubmitted = false;

  // ========================================
  // 🔹 Voices State
  // ========================================
  voices: Voice[] = [];
  isLoadingVoices: boolean = true;
  selectedVoice: Voice | null = null;

  // ========================================
  // 🔹 File Upload State
  // ========================================
  selectedFile: File | null = null;
  fileName: string = '';
  isDragOver: boolean = false;
  errorMessage = '';
  
  // File Upload Config
  acceptedFormats = '.doc,.docx';
  maxFileSize = 50 * 1024 * 1024; // 50MB

  // ========================================
  // 🔹 UI State
  // ========================================
  isLoading: boolean = false;

  // ========================================
  // 🔹 Audio Player State
  // ========================================
  currentPlayingAudio: HTMLAudioElement | null = null;
  currentPlayingVoiceKey: string | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private http: HttpClient,
    private apiService: ApiPortalService,
    private router: Router,
    private toastr: ToastrsService,
    private voicesService: VoicesService
  ) {}

  ngOnInit(): void {
    this.initForm();

    // تحميل الأصوات من الـ API (مع كاش ذكي)
    this.loadVoices();

    // تهيئة AOS للأنيميشن
    AOS.init({
      duration: 600,
      easing: 'ease-out-cubic',
      once: true,
      offset: 50
    });
  }

  // ========================================
  // 🔸 Initialize Reactive Form
  // ========================================
  private initForm(): void {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  // ========================================
  // 🔸 Load Voices from API
  // ========================================
  private loadVoices(): void {
    this.isLoadingVoices = true;
    this.voicesService.getVoices().subscribe({
      next: (voices) => {
        this.voices = voices;
        this.isLoadingVoices = false;
        console.log(` Loaded ${voices.length} voices from API`);
      },
      error: (error) => {
        console.error(' Failed to load voices:', error);
        this.isLoadingVoices = false;
        this.toastr.showError('Failed to load voices. Please try again.');
      }
    });
  }

  // ========================================
  // 🔸 Toggle Creation Method
  // ========================================
  setMethod(method: ProjectCreationMethod): void {
    this.method = method;
    this.selectedVoice = null;
    this.selectedFile = null;
    this.fileName = '';
    this.errorMessage = '';
    this.formSubmitted = false;
    
    // إيقاف أي صوت يتم تشغيله
    this.stopCurrentAudio();
  }

  // ========== Voice Selection ==========
  selectVoice(voice: Voice): void {
    this.selectedVoice = voice;
  }

  isVoiceSelected(voice: Voice): boolean {
    return this.selectedVoice?.key === voice.key;
  }

  /**
   * حساب الـ delay للأنيميشن بطريقة ذكية
   * - أول 12 عنصر: delay تدريجي (0-880ms)
   * - بعد كده: delay ثابت (900ms) عشان ما يطولش الانتظار
   */
  getVoiceCardDelay(index: number): number {
    const maxStaggerItems = 12; // أول 12 عنصر بس يكون فيهم stagger
    const delayIncrement = 80; // 80ms بين كل عنصر
    const maxDelay = 900; // أقصى delay

    if (index < maxStaggerItems) {
      return index * delayIncrement;
    }
    return maxDelay;
  }

  // التحقق إذا الصوت يتم تشغيله حالياً
  isVoicePlaying(voice: Voice): boolean {
    return !!(this.currentPlayingVoiceKey === voice.key && 
           this.currentPlayingAudio && 
           !this.currentPlayingAudio.paused);
  }

  playSample(voice: Voice, event: Event): void {
    event.stopPropagation();

    // إذا الصوت نفسه يشتغل، أوقفه
    if (this.isVoicePlaying(voice)) {
      this.stopCurrentAudio();
      return;
    }

    // إيقاف أي صوت آخر
    this.stopCurrentAudio();

    // تشغيل العينة الجديدة
    this.currentPlayingAudio = new Audio(voice.sample);
    this.currentPlayingVoiceKey = voice.key;
    
    this.currentPlayingAudio.play();

    // عند انتهاء الصوت، إعادة تعيين الحالة
    this.currentPlayingAudio.onended = () => {
      this.currentPlayingVoiceKey = null;
      this.currentPlayingAudio = null;
    };
  }

  // دالة لإيقاف الصوت الحالي
  private stopCurrentAudio(): void {
    if (this.currentPlayingAudio) {
      this.currentPlayingAudio.pause();
      this.currentPlayingAudio.currentTime = 0;
      this.currentPlayingAudio = null;
    }
    this.currentPlayingVoiceKey = null;
  }

  // ========================================
  // 🔸 Voice Image Fallback Handler
  // ========================================
  onVoiceImageError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;
    const fallback = 'assets/img/blank.png';
    // Prevent infinite loop if fallback also fails
    if (img.getAttribute('data-fallback-applied') === 'true') {
      return;
    }
    img.setAttribute('src', fallback);
    img.setAttribute('data-fallback-applied', 'true');
  }

  // ========== File Upload ==========
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  private handleFile(file: File): void {
    this.errorMessage = '';

    // Validate file size
    if (file.size > this.maxFileSize) {
      this.errorMessage = 'File size must be less than 50MB';
      this.toastr.showError(this.errorMessage);
      return;
    }

    // Validate file type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = this.acceptedFormats.split(',');
    
    if (!allowedExtensions.includes(extension)) {
      this.errorMessage = `Invalid file type. Allowed: ${this.acceptedFormats}`;
      this.toastr.showError('Please upload a Word document (.doc, .docx) file');
      return;
    }

    this.selectedFile = file;
    this.fileName = file.name;
  }

  removeFile(): void {
    this.selectedFile = null;
    this.fileName = '';
    this.errorMessage = '';
  }

  // ========================================
  // 🔸 Format File Size
  // ========================================
  getFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ========================================
  // 🔸 Get File Icon Class
  // ========================================
  getFileIcon(): string {
    if (!this.selectedFile) return 'bi-file-earmark';
    
    const ext = this.selectedFile.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'bi-file-earmark-pdf';
      case 'doc':
      case 'docx': return 'bi-file-earmark-word';
      default: return 'bi-file-earmark';
    }
  }

  // ========================================
  // 🔸 Check if Should Show Validation Error
  // ========================================
  shouldShowError(fieldName: string): boolean {
    const field = this.projectForm.get(fieldName);
    return this.formSubmitted && !!field?.invalid;
  }

  // ========================================
  // 🔸 Check if Submit Should Be Disabled
  // ========================================
  isSubmitDisabled(): boolean {
    // Form must be valid
    if (this.projectForm.invalid) return true;
    
    // If method is AI, voice and file are required
    if (this.method === 'AI' && (!this.selectedVoice || !this.selectedFile)) {
      return true;
    }
    
    // Cannot submit while already submitting
    if (this.isLoading) return true;
    
    return false;
  }

  // ========== Create Project ==========
  createAudioProject(): void {
    this.formSubmitted = true;

    if (this.isSubmitDisabled()) {
      // Show appropriate warning
      if (this.projectForm.invalid) {
        this.toastr.showWarning('Please enter a valid project name');
      } else if (this.method === 'AI' && !this.selectedVoice) {
        this.toastr.showWarning('Please select a voice for your audiobook');
      } else if (this.method === 'AI' && !this.selectedFile) {
        this.toastr.showWarning('Please upload your formatted book file');
      }
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // إعداد البيانات للإرسال: سنستخدم FormData لدعم رفع الملف مع الحقول الأخرى
    const url = this.apiService.projects.create;
    const name = this.projectForm.value.name.trim();
    const type = this.method === 'AI' ? 1 : 2; // 1=AI, 2=Manual (قابلة للتعديل حسب الـ API)
    const creationMethod = this.method; // 'AI' | 'MANUAL'

    const formData = new FormData();
    formData.append('name', name);
    formData.append('type', String(type));
    formData.append('creation_method', creationMethod);

    if (this.method === 'AI') {
      if (this.selectedVoice) {
        formData.append('voice_key', String(this.selectedVoice.key));
      }
      if (this.selectedFile) {
        formData.append('file', this.selectedFile, this.selectedFile.name);
      }
    }

    console.log('📤 Creating project with:', { name, type, creationMethod, voice_key: this.selectedVoice?.key, file: this.selectedFile?.name });

    this.http.post<any>(url, formData, {
      withCredentials: true
    }).subscribe({
      next: (response: any) => {
        this.isLoading = false;

        if (response?.success) {
          // const projectId = response.data.id;

          this.toastr.showSuccess('Your audio project has been created successfully!');
          
          // إغلاق المودال مع إرجاع نجاح
          this.activeModal.close(true);

          // التوجيه إلى صفحة المشروع
          // this.router.navigate(['/audio-portal/my-projects', projectId]);
        } else {
          this.errorMessage = response?.msg || 'Failed to create audio project';
          this.toastr.showError(this.errorMessage);
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error creating audio project:', error);
        this.errorMessage = error?.error?.msg || 'An error occurred while creating the project';
        this.toastr.showError(this.errorMessage);
      }
    });
  }

  // ========================================
  // 🔸 Close Modal
  // ========================================
  close(): void {
    this.activeModal.dismiss();
  }

  // ========== Cleanup ==========
  ngOnDestroy(): void {
    // إيقاف أي صوت قيد التشغيل
    if (this.currentPlayingAudio) {
      this.currentPlayingAudio.pause();
      this.currentPlayingAudio = null;
    }
  }
}

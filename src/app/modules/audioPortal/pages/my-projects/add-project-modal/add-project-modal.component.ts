import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { ApiPortalService } from 'src/app/modules/services/api.portal.service';
import { ProjectCreationMethod, AddProjectResponse } from '../models/project.model';

@Component({
  selector: 'app-add-project-modal',
  templateUrl: './add-project-modal.component.html',
  styleUrls: ['./add-project-modal.component.css']
})
export class AddProjectModalComponent implements OnInit {

  // ========================================
  // 🔹 Form State
  // ========================================
  projectForm!: FormGroup;
  method: ProjectCreationMethod = 'AI';
  selectedFile?: File;

  // ========================================
  // 🔹 UI State
  // ========================================
  isSubmitting = false;
  isDragging = false;
  errorMessage = '';
  formSubmitted = false; // 🆕 Track if form was submitted

  // ========================================
  // 🔹 File Upload Config
  // ========================================
  acceptedFormats = '.pdf,.doc,.docx'; //  Only PDF and Word
  maxFileSize = 50 * 1024 * 1024; // 50MB

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private http: HttpClient,
    private apiPortal: ApiPortalService
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  // ========================================
  // 🔸 Initialize Reactive Form
  // ========================================
  private initForm(): void {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      isbn: ['', [Validators.required, Validators.pattern(/^[0-9\-]{10,20}$/)]],
      voice_key: ['', Validators.required]
    });
  }

  // ========================================
  // 🔸 Toggle Creation Method
  // ========================================
  setMethod(method: ProjectCreationMethod): void {
    this.method = method;
    this.selectedFile = undefined;
    this.errorMessage = '';
    this.formSubmitted = false; // 🆕 Reset submission state
  }

  // ========================================
  // 🔸 Drag & Drop Handlers
  // ========================================
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  // ========================================
  // 🔸 File Input Handler
  // ========================================
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  // ========================================
  // 🔸 Validate & Store File
  // ========================================
  private handleFile(file: File): void {
    this.errorMessage = '';

    // Validate file size
    if (file.size > this.maxFileSize) {
      this.errorMessage = 'File size must be less than 50MB';
      return;
    }

    // Validate file type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = this.acceptedFormats.split(',');

    if (!allowedExtensions.includes(extension)) {
      this.errorMessage = `Invalid file type. Allowed: ${this.acceptedFormats}`;
      return;
    }

    this.selectedFile = file;
  }

  // ========================================
  // 🔸 Remove Selected File
  // ========================================
  removeFile(): void {
    this.selectedFile = undefined;
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

    // If method is AI, file is required
    if (this.method === 'AI' && !this.selectedFile) return true;

    // Cannot submit while already submitting
    if (this.isSubmitting) return true;

    return false;
  }

  // ========================================
  // 🔸 Submit Project
  // ========================================
  onSubmit(): void {
    this.formSubmitted = true; // 🆕 Mark form as submitted

    if (this.isSubmitDisabled()) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    // Build FormData
    const formData = new FormData();
    formData.append('name', this.projectForm.value.name.trim());

    // Add file only if method is AI and file exists
    if (this.method === 'AI' && this.selectedFile) {
      formData.append('file', this.selectedFile, this.selectedFile.name);
    }

    // Send POST request
    const url = this.apiPortal.projects.create;

    this.http.post<AddProjectResponse>(url, formData, {
      withCredentials: true
    }).subscribe({
      next: (response) => {
        if (response.status) {
          // Close modal with success flag
          this.activeModal.close(true);
        } else {
          this.errorMessage = response.message || 'Failed to create project';
          this.isSubmitting = false;
        }
      },
      error: (error) => {
        console.error('Failed to create project:', error);
        this.errorMessage = error.response?.message || 'An error occurred. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  // ========================================
  // 🔸 Close Modal
  // ========================================
  close(): void {
    this.activeModal.dismiss();
  }
}

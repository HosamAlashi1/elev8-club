import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { VoicesService } from 'src/app/core/services/voices.service';
import { Voice } from 'src/app/core/models/voice.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-voice-selection-modal',
  templateUrl: './voice-selection-modal.component.html',
  styleUrls: ['./voice-selection-modal.component.css']
})
export class VoiceSelectionModalComponent implements OnInit, OnDestroy {

  // ========================================
  // 🔹 Inputs
  // ========================================
  @Input() entityType: 'project' | 'chapter' | 'paragraph' = 'paragraph';
  @Input() defaultVoiceKey?: string; // Pre-selected voice key from entity

  // ========================================
  // 🔹 State
  // ========================================
  voices: Voice[] = [];
  isLoadingVoices: boolean = true;
  selectedVoice: Voice | null = null;
  isLoading: boolean = false;

  @Input() defaultFormat: 'mp3' | 'wav' = 'mp3';   // اختياري: فورمات افتراضي من الأب
  voiceFormats: Array<'mp3' | 'wav'> = ['mp3', 'wav'];
  selectedFormat: 'mp3' | 'wav' = 'mp3';


  // ========================================
  // 🔹 Audio Player State
  // ========================================
  currentPlayingAudio: HTMLAudioElement | null = null;
  currentPlayingVoiceKey: string | null = null;

  // ========================================
  // 🔹 Computed
  // ========================================
  get entityTypeLabel(): string {
    switch (this.entityType) {
      case 'project': return 'Project Voice';
      case 'chapter': return 'Chapter Voice';
      case 'paragraph': return 'Paragraph Voice';
      default: return 'Voice';
    }
  }

  constructor(
    public activeModal: NgbActiveModal,
    private voicesService: VoicesService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.selectedFormat = this.defaultFormat || 'mp3';
    this.loadVoices();
  }

  ngOnDestroy(): void {
    // Stop any playing audio
    this.stopCurrentAudio();
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

        // Pre-select voice if defaultVoiceKey is provided
        if (this.defaultVoiceKey) {
          const defaultVoice = voices.find(v => v.key === this.defaultVoiceKey);
          if (defaultVoice) {
            this.selectedVoice = defaultVoice;
          }
        }

        console.log(` Loaded ${voices.length} voices, default: ${this.defaultVoiceKey}`);
      },
      error: (error) => {
        console.error(' Failed to load voices:', error);
        this.isLoadingVoices = false;
        this.toastr.error('Failed to load voices. Please try again.');
      }
    });
  }

  // ========================================
  // 🔸 Voice Selection
  // ========================================
  selectVoice(voice: Voice): void {
    this.selectedVoice = voice;
  }

  isVoiceSelected(voice: Voice): boolean {
    return this.selectedVoice?.key === voice.key;
  }

  // ========================================
  // 🔸 Voice Sample Playback
  // ========================================
  isVoicePlaying(voice: Voice): boolean {
    return !!(this.currentPlayingVoiceKey === voice.key &&
      this.currentPlayingAudio &&
      !this.currentPlayingAudio.paused);
  }

  playSample(voice: Voice, event: Event): void {
    event.stopPropagation();

    // If same voice is playing, stop it
    if (this.isVoicePlaying(voice)) {
      this.stopCurrentAudio();
      return;
    }

    // Stop any other playing audio
    this.stopCurrentAudio();

    // Play new sample
    this.currentPlayingAudio = new Audio(voice.sample);
    this.currentPlayingVoiceKey = voice.key;

    this.currentPlayingAudio.play();

    // Reset state when audio ends
    this.currentPlayingAudio.onended = () => {
      this.currentPlayingVoiceKey = null;
      this.currentPlayingAudio = null;
    };
  }

  private stopCurrentAudio(): void {
    if (this.currentPlayingAudio) {
      this.currentPlayingAudio.pause();
      this.currentPlayingAudio.currentTime = 0;
      this.currentPlayingAudio = null;
    }
    this.currentPlayingVoiceKey = null;
  }

  // ========================================
  // 🔸 Image Error Handler
  // ========================================
  onVoiceImageError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;
    const fallback = 'assets/img/blank.png';
    if (img.getAttribute('data-fallback-applied') === 'true') return;
    img.setAttribute('src', fallback);
    img.setAttribute('data-fallback-applied', 'true');
  }

  // ========================================
  // 🔸 Confirm & Close
  // ========================================
  confirm(): void {
    if (!this.selectedVoice) {
      this.toastr.warning('Please select a voice');
      return;
    }

    // رجّع key + format بدل string فقط
    this.activeModal.close({
      key: this.selectedVoice.key,
      format: this.selectedFormat
    });
  }

  close(): void {
    this.activeModal.dismiss();
  }
}

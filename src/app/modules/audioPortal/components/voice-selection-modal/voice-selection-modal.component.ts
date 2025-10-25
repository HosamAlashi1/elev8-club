import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { VoicesService } from 'src/app/core/services/voices.service';
import { Voice } from 'src/app/core/models/voice.model';
import { ToastrService } from 'ngx-toastr';


export interface VoiceSelectionResult {
  key: string;
  silences?: {
    paragraph?: number;
    chapterTitle?: number;
    chapter?: number;
  };
}

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

  // 👇 افتراضيات تُمرّر من الأب (لو متوفّرة)
  @Input() defaultParagraphSilence: number = 1;
  @Input() defaultChapterTitleSilence: number = 2;
  @Input() defaultChapterSilence: number = 3;

  readonly silenceOptions: number[] = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5];

  // القيم المختارة
  selectedParagraphSilence: number = 1;
  selectedChapterTitleSilence: number = 2;
  selectedChapterSilence: number = 3;

  // مشغل العيّنة
  currentPlayingAudio: HTMLAudioElement | null = null;
  currentPlayingVoiceKey: string | null = null;

  voiceFormats: Array<'mp3' | 'wav'> = ['mp3', 'wav'];
  selectedFormat: 'mp3' | 'wav' = 'mp3';

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
    this.selectedParagraphSilence = this.defaultParagraphSilence ?? 1;
    this.selectedChapterTitleSilence = this.defaultChapterTitleSilence ?? 2;
    this.selectedChapterSilence = this.defaultChapterSilence ?? 3;

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

    // جهّز السايلنس حسب نوع الكيان
    const silences: VoiceSelectionResult['silences'] = {};
    if (this.entityType === 'project') {
      silences.paragraph = this.selectedParagraphSilence;
      silences.chapterTitle = this.selectedChapterTitleSilence;
      silences.chapter = this.selectedChapterSilence;
    } else if (this.entityType === 'chapter') {
      silences.paragraph = this.selectedParagraphSilence;
      silences.chapterTitle = this.selectedChapterTitleSilence;
      // لا نرسل chapter
    } // paragraph: لا شيء

    const payload: VoiceSelectionResult = {
      key: this.selectedVoice.key,
      silences: Object.keys(silences).length ? silences : undefined
    };

    this.activeModal.close(payload);
  }

  close(): void {
    this.activeModal.dismiss();
  }
}

import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProjectsClientService } from '../../../services/projects-client.service';
import { NoteItem, UserType } from '../../../models/project-details.model';

@Component({
  selector: 'app-notes-tab',
  templateUrl: './notes-tab.component.html',
  styleUrls: ['./notes-tab.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotesTabComponent implements OnChanges, OnDestroy {
  
  @Input() chapterId!: number;

  // ========================================
  // 🔹 State
  // ========================================
  notes: NoteItem[] = [];
  isLoading = true;

  // Composer
  newNoteText = '';
  isSubmittingNew = false;

  private destroy$ = new Subject<void>();

  constructor(
    private projectsClient: ProjectsClientService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chapterId'] && this.chapterId) {
      this.loadNotes();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // 🔸 Load Notes
  // ========================================
  loadNotes(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    
    this.projectsClient.getChapterNotes(this.chapterId, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notes) => {
          this.notes = notes.map(n => ({ ...n, isEditing: false }));
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load notes:', error);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  // ========================================
  // 🔸 Add Note
  // ========================================
  onComposerKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      this.submitNewNote();
    }
  }

  submitNewNote(): void {
    if (!this.newNoteText.trim() || this.isSubmittingNew) return;

    this.isSubmittingNew = true;
    this.cdr.markForCheck();

    this.projectsClient.addNote(this.chapterId, this.newNoteText.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.newNoteText = '';
          this.loadNotes(); // Refresh list
          this.isSubmittingNew = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to add note:', error);
          this.isSubmittingNew = false;
          this.cdr.markForCheck();
        }
      });
  }

  // ========================================
  // 🔸 Edit Note (from child)
  // ========================================
  onNoteEdited(note: NoteItem): void {
    const index = this.notes.findIndex(n => n.id === note.id);
    if (index !== -1) {
      this.notes[index] = { ...note };
      this.cdr.markForCheck();
    }
  }

  // ========================================
  // 🔸 Delete Note (from child)
  // ========================================
  onNoteDeleted(noteId: number): void {
    this.notes = this.notes.filter(n => n.id !== noteId);
    this.cdr.markForCheck();
  }

  // ========================================
  // 🔸 User Type Helpers
  // ========================================
  getUserBadgeClass(userType: number): string {
    switch (userType) {
      case UserType.Admin: return 'badge-danger';
      case UserType.Author: return 'badge-primary';
      case UserType.Editor: return 'badge-warning';
      case UserType.Customer: return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }

  getUserTypeLabel(userType: number): string {
    switch (userType) {
      case UserType.Admin: return 'مدير';
      case UserType.Author: return 'مؤلف';
      case UserType.Editor: return 'محرر';
      case UserType.Customer: return 'عميل';
      default: return 'غير معروف';
    }
  }

  // ========================================
  // 🔸 Humanized Date
  // ========================================
  getHumanizedDate(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة${minutes > 10 ? '' : (minutes > 2 ? ' دقائق' : '')}`;
    if (hours < 24) return `منذ ${hours} ساعة${hours > 10 ? '' : (hours > 2 ? ' ساعات' : '')}`;
    if (days < 7) return `منذ ${days} يوم${days > 10 ? '' : (days > 2 ? ' أيام' : '')}`;
    
    return date.toLocaleDateString('ar-SA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // ========================================
  // 🔸 Track By
  // ========================================
  trackByNoteId(index: number, item: NoteItem): number {
    return item.id;
  }
}

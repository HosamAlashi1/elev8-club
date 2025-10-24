import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProjectsClientService } from '../../../../services/projects-client.service';
import { NoteItem, UserType } from '../../../../models/project-details.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeleteComponent } from 'src/app/modules/dash/shared/delete/delete.component';

@Component({
  selector: 'app-note-item',
  templateUrl: './note-item.component.html',
  styleUrls: ['./note-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoteItemComponent implements OnDestroy {

  @Input() note!: NoteItem;
  @Input() chapterId!: number;

  @Output() edited = new EventEmitter<NoteItem>();
  @Output() deleted = new EventEmitter<number>();

  // Edit state
  isEditing = false;
  editText = '';
  isSubmitting = false;

  private destroy$ = new Subject<void>();

  constructor(
    private projectsClient: ProjectsClientService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // 🔸 User Badge Helpers
  // ========================================
  getUserBadgeClass(): string {
    switch (this.note.user_type) {
      case UserType.Admin: return 'badge bg-danger';
      case UserType.Author: return 'badge bg-primary';
      case UserType.Editor: return 'badge bg-warning text-dark';
      case UserType.Customer: return 'badge bg-secondary';
      default: return 'badge bg-secondary';
    }
  }

  getUserTypeLabel(): string {
    switch (this.note.user_type) {
      case UserType.Admin: return 'Admin';
      case UserType.Author: return 'Author';
      case UserType.Editor: return 'Editor';
      case UserType.Customer: return 'Customer';
      default: return 'Unknown';
    }
  }

  // ========================================
  // 🔸 Humanized Date (English)
  // ========================================
  getHumanizedDate(): string {
    const date = new Date(this.note.insert_date);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getISODate(): string {
    return new Date(this.note.insert_date).toISOString();
  }

  // ========================================
  // 🔸 Inline Edit
  // ========================================
  startEdit(): void {
    this.isEditing = true;
    this.editText = this.note.text;
    this.cdr.markForCheck();

    setTimeout(() => {
      const textarea = document.querySelector(`#edit-note-${this.note.id}`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.select();
      }
    }, 100);
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editText = '';
    this.cdr.markForCheck();
  }

  submitEdit(): void {
    if (!this.editText.trim() || this.isSubmitting) return;

    this.isSubmitting = true;
    this.cdr.markForCheck();

    this.projectsClient.editNote(this.note.id, this.editText.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          // Update note text (handle both cases: data returned or null)
          if (updated) {
            this.note.text = updated.text;
          } else {
            this.note.text = this.editText.trim();
          }

          this.edited.emit(this.note);
          this.isEditing = false;
          this.isSubmitting = false;
          this.editText = '';
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to edit note:', error);
          this.isSubmitting = false;
          this.cdr.markForCheck();
        }
      });
  }

  // ========================================
  // 🔸 Delete with Modal
  // ========================================
  openDeleteModal(): void {
    const modalRef = this.modalService.open(DeleteComponent, {
      centered: true,
    });

    modalRef.componentInstance.title = 'Delete Note';
    modalRef.componentInstance.message = 'Are you sure you want to delete this note? This action cannot be undone.';
    modalRef.componentInstance.type = 'note';
    modalRef.componentInstance.id = this.note.id;
    modalRef.result.then(
      (confirmed) => {
        if (confirmed) {
          this.deleteNote();
        }
      },
      () => { } // Dismissed
    );
  }

  deleteNote(): void {
    this.projectsClient.deleteNote(this.note.id, this.chapterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleted.emit(this.note.id);
        },
        error: (error) => {
          console.error('Failed to delete note:', error);
        }
      });
  }
}

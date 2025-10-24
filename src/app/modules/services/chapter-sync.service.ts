import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface TitleChangedEvent {
  chapterId: number;
  newTitle: string;
  origin: 'paragraph' | 'sidebar';
}

@Injectable({ providedIn: 'root' })
export class ChapterSyncService {
  private titleChangedSub = new Subject<TitleChangedEvent>();
  readonly titleChanged$ = this.titleChangedSub.asObservable();

  emitTitleChanged(evt: TitleChangedEvent) {
    this.titleChangedSub.next(evt);
  }
}

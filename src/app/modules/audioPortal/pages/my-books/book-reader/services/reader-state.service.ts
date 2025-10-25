import { Injectable } from '@angular/core';

export interface ReaderPosition {
  chapterId: number;
  pageIndex: number;
  timestamp: number;
}

export interface ReaderSettings {
  fontSize: number;        // 12-24px
  lineHeight: number;      // 1.4-2.0
  theme: 'light' | 'sepia' | 'dark';
  soundEnabled: boolean;
  soundVolume: number;     // 0-1
  spreadMode: boolean;     // Two pages vs single
}

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 16,
  lineHeight: 1.65,
  theme: 'light',
  soundEnabled: true,
  soundVolume: 0.35,
  spreadMode: true
};

@Injectable({ providedIn: 'root' })
export class ReaderStateService {

  /**
   * Save last reading position for a book
   */
  savePosition(bookId: number, position: ReaderPosition): void {
    const key = `reader:${bookId}:position`;
    localStorage.setItem(key, JSON.stringify({
      ...position,
      timestamp: Date.now()
    }));
  }

  /**
   * Get last reading position for a book
   */
  getPosition(bookId: number): ReaderPosition | null {
    try {
      const key = `reader:${bookId}:position`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Save reader settings (global)
   */
  saveSettings(settings: Partial<ReaderSettings>): void {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem('reader:settings', JSON.stringify(updated));
  }

  /**
   * Get reader settings (global)
   */
  getSettings(): ReaderSettings {
    try {
      const data = localStorage.getItem('reader:settings');
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Reset settings to default
   */
  resetSettings(): void {
    localStorage.removeItem('reader:settings');
  }

  /**
   * Clear position for a book
   */
  clearPosition(bookId: number): void {
    localStorage.removeItem(`reader:${bookId}:position`);
  }

  /**
   * Get reading progress percentage
   */
  getProgress(bookId: number, totalPages: number): number {
    const position = this.getPosition(bookId);
    if (!position || totalPages === 0) return 0;
    return Math.round((position.pageIndex / totalPages) * 100);
  }
}

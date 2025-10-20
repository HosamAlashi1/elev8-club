/**
 * 🎵 Audio Utility Functions
 * Helper functions for audio handling across the application
 */

/**
 * Add cache busting parameter to audio URL
 * Prevents 304 Not Modified responses when audio is regenerated
 * 
 * @param url Original audio URL
 * @returns URL with timestamp parameter
 * 
 * @example
 * const url = 'https://example.com/audio.mp3';
 * const busted = addCacheBuster(url);
 * // Result: 'https://example.com/audio.mp3?_t=1729446123456'
 * 
 * @example With existing params
 * const url = 'https://example.com/audio.mp3?quality=high';
 * const busted = addCacheBuster(url);
 * // Result: 'https://example.com/audio.mp3?quality=high&_t=1729446123456'
 */
export function addCacheBuster(url: string | null | undefined): string {
  if (!url) return '';
  
  // Add timestamp to force fresh download
  const separator = url.includes('?') ? '&' : '?';
  const timestamp = Date.now();
  return `${url}${separator}_t=${timestamp}`;
}

/**
 * Download audio file with cache busting
 * 
 * @param url Audio file URL
 * @param filename Download filename
 * 
 * @example
 * downloadAudioFile('https://example.com/audio.mp3', 'Chapter_1.mp3');
 */
export function downloadAudioFile(url: string, filename: string): void {
  if (!url) return;
  
  const link = document.createElement('a');
  link.href = addCacheBuster(url);
  link.download = sanitizeFilename(filename);
  link.click();
}

/**
 * Sanitize filename for download
 * Replaces spaces and special characters
 * 
 * @param filename Original filename
 * @returns Sanitized filename
 * 
 * @example
 * sanitizeFilename('Chapter 1: Introduction');
 * // Result: 'Chapter_1_Introduction.mp3'
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace invalid filename characters
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim();
}

/**
 * Format duration in MM:SS or HH:MM:SS
 * 
 * @param seconds Duration in seconds
 * @returns Formatted time string
 * 
 * @example
 * formatDuration(125); // "2:05"
 * formatDuration(3665); // "1:01:05"
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get audio MIME type from URL
 * 
 * @param url Audio URL
 * @returns MIME type string
 */
export function getAudioMimeType(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'ogg':
      return 'audio/ogg';
    case 'm4a':
      return 'audio/mp4';
    case 'webm':
      return 'audio/webm';
    default:
      return 'audio/mpeg'; // Default to MP3
  }
}

/**
 * Check if browser supports audio format
 * 
 * @param mimeType MIME type to check
 * @returns true if supported
 */
export function isAudioFormatSupported(mimeType: string): boolean {
  const audio = document.createElement('audio');
  return audio.canPlayType(mimeType) !== '';
}

/**
 * Preload audio file
 * Useful for better UX before playing
 * 
 * @param url Audio URL
 * @returns Promise that resolves when loaded
 */
export function preloadAudio(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = 'auto';
    
    audio.addEventListener('canplaythrough', () => resolve(), { once: true });
    audio.addEventListener('error', (e) => reject(e), { once: true });
    
    audio.src = addCacheBuster(url);
  });
}

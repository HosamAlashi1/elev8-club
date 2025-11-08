import { Pipe, PipeTransform } from '@angular/core';
import { Observable, of, timer } from 'rxjs';
import { map, takeWhile, distinctUntilChanged } from 'rxjs/operators';

@Pipe({
  name: 'countdown',
  pure: true
})
export class CountdownPipe implements PipeTransform {
  transform(
    value: number | null | undefined,
    unit: 'seconds' | 'minutes' = 'minutes'
  ): Observable<string> {
    if (value == null || isNaN(value as number)) {
      return of('—');
    }

    const startSeconds = Math.max(
      0,
      Math.floor(unit === 'minutes' ? (value as number) * 60 : (value as number))
    );

    return timer(0, 1000).pipe(
      map(tick => this.format(Math.max(0, startSeconds - tick))),
      distinctUntilChanged(),
      // خلّيه يكمّل لآخر "0s" وبعدين يكمّلِت:
      takeWhile(str => str !== '0s', true)
    );
  }

  private format(totalSeconds: number): string {
    const days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;

    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 && days === 0) parts.push(`${seconds}s`);

    return parts.join(' ') || '0s';
  }
}

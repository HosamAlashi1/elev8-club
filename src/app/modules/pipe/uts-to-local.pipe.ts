import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'utcToLocal'
})
export class UtcToLocalPipe implements PipeTransform {
    transform(utcDate: string): string {
        if (!utcDate) return '';

        const date = new Date(utcDate);

        return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
    }
}
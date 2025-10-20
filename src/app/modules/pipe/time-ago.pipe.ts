import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
    name: 'timeAgo'
})
export class TimeAgoPipe implements PipeTransform {

    transform(value: any): string {
        if (!value) return '';

        const date = new Date(value);
        return moment(date).fromNow();
    }
}
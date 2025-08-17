import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'maxLength'
})
export class TextLengthPipe implements PipeTransform {

  transform(value: string, maxlength: number): string {

    if (value?.length > maxlength) {
      return value?.substring(0, maxlength) + "..";
    } else {
      return value;
    }
  }
}

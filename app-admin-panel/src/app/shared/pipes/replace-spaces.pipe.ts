import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replaceSpaces',
  standalone: false,
})
export class ReplaceSpacesPipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): string {
    return value.replace(/ /g, '_');
  }

}

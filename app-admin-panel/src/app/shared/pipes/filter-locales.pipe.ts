import { Pipe, PipeTransform } from "@angular/core";
import { ProjectLocale } from "src/app/shared/models/project";
@Pipe({
  name: 'filterLocales',
  pure: false,
  standalone: false,
})
export class FilterLocalesPipe implements PipeTransform {
  transform(locales: ProjectLocale[], term: string | undefined): any {
    if (!term || term === '') {
      return locales;
    }
    const loweredTerm = term.toLowerCase();
    return locales.filter(l => l.code.toLowerCase().includes(loweredTerm));
  }
}

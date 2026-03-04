import { Pipe, PipeTransform } from '@angular/core';
import { TranslateHelperService } from './translate-helper.service';

@Pipe({ name: 'localized', standalone: true })
export class LocalizedPipe implements PipeTransform {
  constructor(private helper: TranslateHelperService) {}

  transform(value?: string, lang?: string): string {
    return this.helper.toLocalizedText(value, lang);
  }
}

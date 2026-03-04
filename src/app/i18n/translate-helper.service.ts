import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class TranslateHelperService {
  constructor(private translate: TranslateService) {}

  toLocalizedText(raw?: string, lang?: string): string {
    const text = (raw ?? '').trim();
    if (!text) return '';

    const loweredRaw = text.toLowerCase();
    if (/(^|\s)(others)($|\s)/i.test(loweredRaw) || /其他/.test(text)) {
      try {
        const translated = this.translate.instant('products.others');
        if (translated && translated !== 'products.others') return translated;
      } catch {}
    }

    const current = (lang || this.translate.currentLang || this.translate.getDefaultLang() || 'en').toLowerCase();
    const sections = text.split(/\r?\n|\|\|\|\||\|\|/).map(s => s.trim()).filter(Boolean);

    if (current.startsWith('en')) {
      return this.extractEnglish(sections) || text;
    }

    return this.extractChinese(sections) || text;
  }

  extractEnglish(sections: string[]): string {
    return sections
      .map(part =>
        part
          .replace(/[\u4e00-\u9fff]/g, ' ')
          .replace(/[，。！？；：、“”‘’（）【】《》、]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      )
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  extractChinese(sections: string[]): string {
    return sections
      .map(part =>
        part
          .replace(/[A-Za-z]/g, ' ')
          .replace(/[0-9]/g, ' ')
          .replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      )
      .filter(Boolean)
      .join(' ')
      .trim();
  }
}

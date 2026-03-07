import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  constructor(private http: HttpClient, private translate: TranslateService) {}

  ngOnInit(): void {
    try {
      const stored = (localStorage.getItem('yingfu_lang') || '').toString().toLowerCase();
      let initial = stored;
      if (!initial) {
        try {
          const nav = (window && (navigator as any)) || null;
          const lang = (nav?.language || (nav?.languages && nav.languages[0]) || '').toString().toLowerCase();
          if (lang && lang.startsWith('zh')) initial = 'zh';
          else initial = 'en';
        } catch {
          initial = 'zh';
        }
      }

      this.translate.setDefaultLang(initial);
      this.translate.use(initial);

      ['zh', 'en'].forEach(lang => {
        this.http
          .get(`/assets/i18n/${lang}.json?cb=${Date.now()}`)
          .subscribe({
            next: (data) => this.translate.setTranslation(lang, data as any, true),
            error: () => undefined,
          });
      });
    } catch {

    }
  }
}

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

import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProductListComponent } from './product-list/product-list.component';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ProductListComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  constructor(private http: HttpClient, private translate: TranslateService) {}

  ngOnInit(): void {
    // For GitHub Pages / CDN caching: force-reload translation JSON on startup by
    // fetching with a cache-busting query param and setting translations explicitly.
    // This ensures deployed zh/en JSON updates are picked up by clients.
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
      // ignore
    }
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHelperService } from '../i18n/translate-helper.service';
import { GoogleSheetService, ProductWithCategoryName } from '../google-sheet.service';
import { AboutStoryComponent } from '../about-story/about-story.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, AboutStoryComponent, SidebarComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})

export class ProductListComponent implements OnInit, OnDestroy {
  products: ProductWithCategoryName[] = [];
  searchTerm = '';
  currentLang: 'zh' | 'en' = 'zh';
  currentYear = new Date().getFullYear();
  bannerProduct: ProductWithCategoryName | null = null;
  showIntro = true;
  selectedCategory = '';
  private readonly introAutoHideMs = 10000;
  private introTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly bannerRotateIntervalMs = 5000;
  private readonly introSeenStorageKey = 'yingfu_intro_seen';
  private bannerRotateTimer: ReturnType<typeof setInterval> | null = null;

  private detectBrowserLanguage(): 'zh' | 'en' {
    try {
      const nav = (window && (navigator as any)) || null;
      const lang = (nav?.language || (nav?.languages && nav.languages[0]) || '').toString().toLowerCase();

      if (!lang) {
        return 'en';
      }

      if (lang.startsWith('zh')) {
        return 'zh';
      }

      if (lang.startsWith('en')) {
        return 'en';
      }

      return 'en';
    } catch {
      return 'en';
    }
  }

  constructor(
    private sheetService: GoogleSheetService,
    private translate: TranslateService,
    private th: TranslateHelperService
  ) {}

  ngOnInit(): void {

    const detected = this.detectBrowserLanguage();
    this.currentLang = detected;
    this.translate.setDefaultLang(detected);
    this.translate.use(detected);

    this.showIntro = true;
    this.startIntroAutoHide();

    this.startBannerRotation();

    this.sheetService.getProductsWithCategoryName().subscribe(data => {
      this.products = (data || []).filter(p => (p.name ?? '').trim() && (p.description ?? '').trim());
      this.setRandomBannerProduct();
    });
  }

  get categories(): { name: string; count: number }[] {
    const map = new Map<string, number>();
    this.products.forEach(p => {
      const name = this.normalizeCategory(p.categoryName);
      map.set(name, (map.get(name) || 0) + 1);
    });

    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }

  selectCategory(name: string): void {
    if (this.selectedCategory === name) {
      this.selectedCategory = '';
    } else {
      this.selectedCategory = name;
    }
  }

  ngOnDestroy(): void {
    if (this.bannerRotateTimer) {
      clearInterval(this.bannerRotateTimer);
      this.bannerRotateTimer = null;
    }
    if (this.introTimer) {
      clearTimeout(this.introTimer);
      this.introTimer = null;
    }
  }

  changeLanguage(lang: 'zh' | 'en'): void {
    if (this.currentLang === lang) {
      return;
    }

    this.currentLang = lang;
    this.translate.use(lang);
  }

  enterSite(): void {
    this.clearIntroTimer();
    this.showIntro = false;
    this.markIntroSeen();
  }

  private startIntroAutoHide(): void {
    this.clearIntroTimer();
    try {
      this.introTimer = setTimeout(() => {
        this.showIntro = false;
        this.markIntroSeen();
        this.introTimer = null;
      }, this.introAutoHideMs);
    } catch {
      this.introTimer = null;
    }
  }

  private clearIntroTimer(): void {
    if (this.introTimer) {
      clearTimeout(this.introTimer);
      this.introTimer = null;
    }
  }

  onSearch(value: string): void {
    this.searchTerm = value ?? '';
  }

  bannerBackground(): string {
    const imageUrl = this.bannerProduct?.imageUrl?.trim();

    if (!imageUrl) {
      return 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)';
    }

    return `linear-gradient(rgba(127, 29, 29, 0.6), rgba(185, 28, 28, 0.45)), url('${imageUrl}')`;
  }

  itemBackground(imageUrl?: string): string {
    const url = imageUrl?.trim();

    if (!url) {
      return 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
    }

    return `linear-gradient(rgba(17, 24, 39, 0.15), rgba(17, 24, 39, 0.15)), url('${url}')`;
  }

  localizedName(name?: string): string {
    return this.th.toLocalizedText(name);
  }

  localizedDescription(description?: string): string {
    return this.th.toLocalizedText(description);
  }

  private startBannerRotation(): void {
    if (this.bannerRotateTimer) {
      return;
    }

    this.bannerRotateTimer = setInterval(() => {
      this.setRandomBannerProduct();
    }, this.bannerRotateIntervalMs);
  }

  private setRandomBannerProduct(): void {
    const candidates = this.products.filter((item) => (item.name ?? '').trim() && (item.description ?? '').trim());

    if (!candidates.length) {
      this.bannerProduct = null;
      return;
    }

    const previousId = this.bannerProduct?.id;

    if (candidates.length === 1) {
      this.bannerProduct = candidates[0];
      return;
    }

    const pool = candidates.filter((item) => item.id !== previousId);
    const randomIndex = Math.floor(Math.random() * pool.length);
    this.bannerProduct = pool[randomIndex];
  }

  private markIntroSeen(): void {
    try {
      localStorage.setItem(this.introSeenStorageKey, '1');
    } catch {
      return;
    }
  }

  private normalizeCategory(raw?: string): string {
    const s = (raw ?? '').trim();
    if (!s) return 'Others';

    if (/\b(others)\b/i.test(s) || /其他/.test(s) || /其他\s*Others?/i.test(s)) {
      return 'Others';
    }

    return s;
  }

  get filteredProducts(): ProductWithCategoryName[] {
    const keyword = this.searchTerm.trim().toLowerCase();
    const namedProducts = this.products.filter((item) => (item.name ?? '').trim() && (item.description ?? '').trim());
    const filterByKeywordAndCategory = (list: ProductWithCategoryName[]) => {
      let out = list;
      if (this.selectedCategory) {
        out = out.filter(p => this.normalizeCategory(p.categoryName) === this.selectedCategory);
      }

      if (!keyword) return out;

      return out.filter((item) => {
        const searchableText = [item.name, item.description, item.categoryName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(keyword);
      });
    };
    
    const sorted = [...namedProducts].sort((a, b) => {
      const aTop = a.topSale ? 1 : 0;
      const bTop = b.topSale ? 1 : 0;
      return bTop - aTop;
    });

    return filterByKeywordAndCategory(sorted);
  }
}
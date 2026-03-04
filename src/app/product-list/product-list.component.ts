import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GoogleSheetService, ProductWithCategoryName } from '../google-sheet.service';
import { AboutStoryComponent } from '../about-story/about-story.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, AboutStoryComponent],
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
    private translate: TranslateService
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
      this.products = data;
      this.setRandomBannerProduct();
    });
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
    return this.localizeMixedText(name);
  }

  localizedDescription(description?: string): string {
    return this.localizeMixedText(description);
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
    const candidates = this.products.filter((item) => item.name?.trim());

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

  private localizeMixedText(value?: string): string {
    const text = (value ?? '').trim();

    if (!text) {
      return '';
    }

    const sections = text
      .split(/\r?\n|\|\|\|\||\|\|/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (this.currentLang === 'en') {
      const englishText = sections
        .map((part) =>
          part
            .replace(/[\u4e00-\u9fff]/g, ' ')
            .replace(/[，。！？；：、“”‘’（）【】《》、]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        )
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      return englishText || text;
    }

    const chineseText = sections
      .map((part) =>
        part
          .replace(/[A-Za-z]/g, ' ')
          .replace(/[0-9]/g, ' ')
          .replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      )
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return chineseText || text;
  }

  private shouldShowIntro(): boolean {
    try {
      return localStorage.getItem(this.introSeenStorageKey) !== '1';
    } catch {
      return false;
    }
  }

  private markIntroSeen(): void {
    try {
      localStorage.setItem(this.introSeenStorageKey, '1');
    } catch {
      return;
    }
  }

  get filteredProducts(): ProductWithCategoryName[] {
    const keyword = this.searchTerm.trim().toLowerCase();
    const namedProducts = this.products.filter((item) => item.name?.trim());

    const filterByKeyword = (list: ProductWithCategoryName[]) => {
      if (!keyword) return list;
      return list.filter((item) => {
        const searchableText = [item.name, item.description, item.categoryName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(keyword);
      });
    };

    // Ensure topSale items appear first while preserving relative order otherwise
    const sorted = [...namedProducts].sort((a, b) => {
      const aTop = a.topSale ? 1 : 0;
      const bTop = b.topSale ? 1 : 0;
      return bTop - aTop;
    });

    return filterByKeyword(sorted);
  }
}
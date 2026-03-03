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

  private readonly bannerRotateIntervalMs = 7000;
  private bannerRotateTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private sheetService: GoogleSheetService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.translate.setDefaultLang('zh');
    this.translate.use(this.currentLang);

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
  }

  changeLanguage(lang: 'zh' | 'en'): void {
    if (this.currentLang === lang) {
      return;
    }

    this.currentLang = lang;
    this.translate.use(lang);
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

  get filteredProducts(): ProductWithCategoryName[] {
    const keyword = this.searchTerm.trim().toLowerCase();
    const namedProducts = this.products.filter((item) => item.name?.trim());

    if (!keyword) {
      return namedProducts;
    }

    return namedProducts.filter((item) => {
      const searchableText = [item.name, item.description, item.categoryName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }
}
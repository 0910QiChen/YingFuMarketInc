import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GoogleSheetService, ProductWithCategoryName } from '../google-sheet.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent implements OnInit {
  products: ProductWithCategoryName[] = [];
  searchTerm = '';
  currentLang: 'zh' | 'en' = 'zh';

  constructor(
    private sheetService: GoogleSheetService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.translate.setDefaultLang('zh');
    this.translate.use(this.currentLang);

    this.sheetService.getProductsWithCategoryName().subscribe(data => {
      this.products = data;
    });
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
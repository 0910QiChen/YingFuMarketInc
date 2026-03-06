import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { GoogleSheetService, ProductWithCategoryName } from '../google-sheet.service';
import { TranslateHelperService } from '../i18n/translate-helper.service';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {
  product: ProductWithCategoryName | null = null;

  constructor(
    private route: ActivatedRoute,
    private sheetService: GoogleSheetService,
    private th: TranslateHelperService
    , private title: Title
    , private meta: Meta
    , @Inject(DOCUMENT) private doc: Document
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!id) {
      this.product = null;
      return;
    }

    try {
      sessionStorage.setItem('yingfu_last_view', 'detail');
    } catch {}

    this.sheetService.getProductsWithCategoryName().subscribe(list => {
      this.product = list.find(p => p.id === id) ?? null;
      if (this.product) {
        this.applySeoForProduct(this.product);
      }
    });
  }

  localizedName(raw?: string): string {
    return this.th.toLocalizedText(raw);
  }

  localizedDescription(raw?: string): string {
    return this.th.toLocalizedText(raw);
  }

  private applySeoForProduct(p: ProductWithCategoryName) {
    const name = this.localizedName(p.name);
    const description = this.localizedDescription(p.tagline || p.benefits || p.storageTips || '');

    // Title and meta description
    this.title.setTitle(`${name} — 盈福参茸行 | Ying Fu Market Inc.`);
    if (description) {
      this.meta.updateTag({ name: 'description', content: description });
    }

    // Canonical link
    const canonicalId = 'canonical-link';
    let existing = this.doc.head.querySelector(`link[rel='canonical']#${canonicalId}`) as HTMLLinkElement | null;
    if (existing) {
      existing.href = `https://www.yingfumarketinc.com/products/${p.id}`;
    } else {
      const link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('id', canonicalId);
      link.setAttribute('href', `https://www.yingfumarketinc.com/products/${p.id}`);
      this.doc.head.appendChild(link);
    }

    // Remove previous product LD script if exists
    const prev = this.doc.getElementById('ld-product');
    if (prev) prev.remove();

    // Product JSON-LD
    const ld: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: name,
      description: description || this.localizedDescription(p.tagline || p.benefits || p.storageTips || p.description),
    };
    if (p.imageUrl) ld.image = [p.imageUrl];
    if (p.price && p.price > 0) {
      ld.offers = {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: p.price,
        availability: 'https://schema.org/InStock',
        url: `https://www.yingfumarketinc.com/products/${p.id}`,
      };
    }

    const script = this.doc.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'ld-product';
    script.text = JSON.stringify(ld);
    this.doc.head.appendChild(script);
  }
}


import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { GoogleSheetService, ProductWithCategoryName } from '../google-sheet.service';
import { TranslateHelperService } from '../i18n/translate-helper.service';

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
    });
  }

  localizedName(raw?: string): string {
    return this.th.toLocalizedText(raw);
  }

  localizedDescription(raw?: string): string {
    return this.th.toLocalizedText(raw);
  }
}


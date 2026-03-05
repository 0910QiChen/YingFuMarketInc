import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category: number;
  topSale: boolean;

  // Extended fields for product detail page.
  // These map to additional columns in the Google Sheet, in order.
  tagline?: string;
  origin?: string;
  harvestSeason?: string;
  processingMethod?: string;
  benefits?: string;
  preparation?: string;
  recipe1Title?: string;
  recipe1Steps?: string;
  recipe2Title?: string;
  recipe2Steps?: string;
  storageTips?: string;
  bundleSuggestions?: string;
}

export interface Category {
  id: number;
  name: string;
}

export type ProductWithCategoryName = Product & { categoryName: string };

@Injectable({ providedIn: 'root' })
export class GoogleSheetService {
  private apiKey = environment.googleSheets.apiKey;
  private spreadsheetId = environment.googleSheets.spreadsheetId;

  private productsRange = 'Products!A2:P1000';
  private categoriesRange = 'Categories!A2:B1000';

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.productsRange}?key=${this.apiKey}`;

    return this.http.get<any>(url).pipe(
      map(res => {
        const rows: string[][] = res.values || [];
        return rows.map(row => ({
          id: Number(row[0] ?? 0),
          name: row[1] ?? '',
          price: Number(row[2] ?? 0),
          description: row[3] ?? '',
          imageUrl: row[4] ?? '',
          category: Number(row[5] ?? 0),
          topSale: (row[6] ?? '').toString().toLowerCase() === 'true',

          // Detail columns (all optional; safe if some are missing)
          tagline: row[7] ?? '',
          origin: row[8] ?? '',
          harvestSeason: row[9] ?? '',
          processingMethod: row[10] ?? '',
          benefits: row[11] ?? '',
          preparation: row[12] ?? '',
          recipe1Title: row[13] ?? '',
          recipe1Steps: row[14] ?? '',
          recipe2Title: row[15] ?? '',
          recipe2Steps: row[16] ?? '',
          storageTips: row[17] ?? '',
          bundleSuggestions: row[18] ?? '',
        }));
      })
    );
  }

  getCategories(): Observable<Category[]> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.categoriesRange}?key=${this.apiKey}`;

    return this.http.get<any>(url).pipe(
      map(res => {
        const rows: string[][] = res.values || [];
        return rows.map(row => ({
          id: Number(row[0] ?? 0),
          name: row[1] ?? '',
        }));
      })
    );
  }

  getProductsWithCategoryName(): Observable<ProductWithCategoryName[]> {
    return forkJoin({
      products: this.getProducts(),
      categories: this.getCategories(),
    }).pipe(
      map(({ products, categories }) => {
        const categoryMap = new Map<number, string>();
        categories.forEach(c => categoryMap.set(c.id, c.name));

        return products.map(product => ({
          ...product,
          categoryName: categoryMap.get(product.category) ?? '',
        }));
      })
    );
  }
}
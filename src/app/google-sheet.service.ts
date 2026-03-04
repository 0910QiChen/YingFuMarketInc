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

  private productsRange = 'Products!A2:G1000';
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
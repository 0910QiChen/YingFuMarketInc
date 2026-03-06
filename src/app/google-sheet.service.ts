import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category: number;
  topSale: boolean;
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

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<any>('/data/sheets.json').pipe(
      map(res => (res && res.products) || [])
    );
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<any>('/data/sheets.json').pipe(
      map(res => (res && res.categories) || [])
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
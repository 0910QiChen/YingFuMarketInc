import { Routes } from '@angular/router';
import { ProductListComponent } from './product-list/product-list.component';

export const routes: Routes = [
  {
    path: '',
    component: ProductListComponent,
  },
  // 例如：单独的 /products 路由（可选）
  // {
  //   path: 'products',
  //   component: ProductListComponent,
  // },
];

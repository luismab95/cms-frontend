import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { PagesDetailComponent } from './detail/detail.component';
import { PagesComponent } from './pages.component';
import { InventoryService } from './pages.service';

export default [
    {
        path: '',
        component: PagesComponent,
        resolve: {
            brands: () => inject(InventoryService).getBrands(),
            categories: () => inject(InventoryService).getCategories(),
            products: () => inject(InventoryService).getProducts(),
            tags: () => inject(InventoryService).getTags(),
            vendors: () => inject(InventoryService).getVendors(),
        },
    },
    {
        path: 'detail',
        component: PagesDetailComponent,
    },
] as Routes;

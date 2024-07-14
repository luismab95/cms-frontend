import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { TemplatesDetailComponent } from './detail/detail.component';
import { TemplatesComponent } from './templates.component';
import { InventoryService } from './templates.service';

export default [
    {
        path: '',
        component: TemplatesComponent,
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
        component: TemplatesDetailComponent,
    },
] as Routes;

import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { MicroSitiesDetailComponent } from './detail/detail.component';
import { MicrositieComponent } from './micrositie.component';
import { InventoryService } from './micrositie.service';

export default [
    {
        path: '',
        component: MicrositieComponent,
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
        component: MicroSitiesDetailComponent,
    },
] as Routes;

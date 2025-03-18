import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { FileManagerService } from './file-manager.service';
import { FileManagerListComponent } from './list.component';

export default [
    {
        path: '',
        component: FileManagerListComponent,
        resolve: {
            files: () =>
                inject(FileManagerService).getFiles({
                    page: 1,
                    limit: 20,
                    search: null,
                    status: true,
                }),
        },
    },
] as Routes;

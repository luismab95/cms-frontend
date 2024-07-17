import { ComponentType } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

@Injectable({ providedIn: 'root' })
export class ModalService {
    private readonly _dialog = inject(MatDialog);

    openModal<CT, T>(componentRef: ComponentType<CT>, data?: T): void {
        this._dialog.open(componentRef, {
            data,
            width: '560px',
            height: '100%',
            disableClose: true,
            hasBackdrop: true,
            position: {
                top: '0%',
                right: '0%',
            },
            autoFocus: false,
        });
    }

    closeModal(): void {
        this._dialog.closeAll();
    }
}

import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation,
    inject,
    signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { PermissionComponent } from 'app/shared/components/permission/permission.component';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { Subject, takeUntil } from 'rxjs';
import { ParametersCompanyComponent } from './company/company.component';
import { ParametersEmailComponent } from './email/email.component';
import { ParametersLogosComponent } from './logos/logos.component';
import { ParameterI } from './parameter.interface';
import { ParameterService } from './parameter.service';
import { ParametersSecurityComponent } from './security/security.component';
import { ParametersWebComponent } from './web/web.component';

@Component({
    selector: 'parameters',
    templateUrl: './parameters.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatSidenavModule,
        MatButtonModule,
        MatIconModule,
        NgClass,
        ParametersLogosComponent,
        ParametersEmailComponent,
        ParametersSecurityComponent,
        ParametersCompanyComponent,
        ParametersWebComponent,
        PermissionComponent,
    ],
})
export class ParametersComponent implements OnInit, OnDestroy {
    @ViewChild('drawer') drawer: MatDrawer;
    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = true;
    panels: any[] = [];
    parameters = signal<ParameterI[]>([]);
    selectedPanel: string = 'company';
    permission = PermissionCode;

    private _parameterService = inject(ParameterService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseMediaWatcherService: FuseMediaWatcherService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Setup available panels
        this.panels = [
            {
                id: 'company',
                icon: 'heroicons_outline:building-office',
                title: 'Compañía',
                description: 'Gestiona la información de tu compañia.',
            },
            {
                id: 'images',
                icon: 'heroicons_outline:photo',
                title: 'Imágenes',
                description: 'Gestiona las imágenes de la aplicación.',
            },
            {
                id: 'email',
                icon: 'heroicons_outline:envelope',
                title: 'Correo electrónico',
                description:
                    'Administra las creedenciales para el envio de correos electrónicos.',
            },
            {
                id: 'security',
                icon: 'heroicons_outline:shield-check',
                title: 'Seguridad',
                description:
                    'Administra los parámetros de seguridad de tu aplicación.',
            },
            {
                id: 'web',
                icon: 'heroicons_outline:window',
                title: 'Web',
                description: 'Gestiona el diseño de tu aplicación.',
            },
        ];

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                // Set the drawerMode and drawerOpened
                if (matchingAliases.includes('lg')) {
                    this.drawerMode = 'side';
                    this.drawerOpened = true;
                } else {
                    this.drawerMode = 'over';
                    this.drawerOpened = false;
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        //Get parameters
        this.getAllParameters();
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get parameters
     */
    getAllParameters() {
        this._parameterService.getAll().subscribe({
            next: (res) => {
                this.parameters.set(res.message);
                // Mark for check
                this._changeDetectorRef.markForCheck();
            },
        });
    }

    /**
     * Navigate to the panel
     *
     * @param panel
     */
    goToPanel(panel: string): void {
        this.selectedPanel = panel;

        // Close the drawer on 'over' mode
        if (this.drawerMode === 'over') {
            this.drawer.close();
        }
    }

    /**
     * Get the details of the panel
     *
     * @param id
     */
    getPanelInfo(id: string): any {
        return this.panels.find((panel) => panel.id === id);
    }

    /**
     * Valid render permission
     */
    validPermission(code: string) {
        return validAction(code);
    }
}

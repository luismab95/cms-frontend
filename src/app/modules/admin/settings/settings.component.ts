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
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { UserService } from 'app/core/user/user.service';
import { UserI } from 'app/core/user/user.types';
import { PermissionComponent } from 'app/shared/components/permission/permission.component';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { Subject, takeUntil } from 'rxjs';
import { SettingsAccountComponent } from './account/account.component';
import { SettingsSecurityComponent } from './security/security.component';

@Component({
    selector: 'settings',
    templateUrl: './settings.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatSidenavModule,
        MatButtonModule,
        MatIconModule,
        NgClass,
        SettingsAccountComponent,
        SettingsSecurityComponent,
        // SettingsNotificationsComponent,
        PermissionComponent,
    ],
})
export class SettingsComponent implements OnInit, OnDestroy {
    @ViewChild('drawer') drawer: MatDrawer;
    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = true;
    panels: any[] = [];
    selectedPanel: string = 'account';
    user: UserI;
    permission = PermissionCode;

    private _userService = inject(UserService);
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
        // Subscribe to user changes
        this._userService.userLogin$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((userLogin: UserI) => {
                this.user = userLogin;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Setup available panels
        this.panels = [
            {
                id: 'account',
                icon: 'heroicons_outline:user-circle',
                title: 'Cuenta',
                description:
                    'Administra tu perfil público e información privada',
            },
            {
                id: 'security',
                icon: 'heroicons_outline:lock-closed',
                title: 'Seguridad',
                description:
                    'Administre su contraseña y preferencias de verificación en dos pasos',
            },
            // {
            //     id: 'notifications',
            //     icon: 'heroicons_outline:bell',
            //     title: 'Notificaciones',
            //     description:
            //         'Administra cuándo recibirás notificaciones en qué canales',
            // },
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

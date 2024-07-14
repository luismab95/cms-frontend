import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { Subject, takeUntil } from 'rxjs';
import { ParametersCompanyComponent } from './company/company.component';
import { ParametersEmailComponent } from './email/email.component';
import { ParametersLogosComponent } from './logos/logos.component';
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
    ],
})
export class ParametersComponent implements OnInit, OnDestroy {
    @ViewChild('drawer') drawer: MatDrawer;
    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = true;
    panels: any[] = [];
    selectedPanel: string = 'company';
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
                title: 'Company',
                description:
                    'Manage your public profile and private information',
            },
            {
                id: 'logos',
                icon: 'heroicons_outline:photo',
                title: 'Logos',
                description:
                    'Manage your password and 2-step verification preferences',
            },
            {
                id: 'email',
                icon: 'heroicons_outline:envelope',
                title: 'Email',
                description: "Manage when you'll be notified on which channels",
            },
            {
                id: 'security',
                icon: 'heroicons_outline:shield-check',
                title: 'Security',
                description: "Manage when you'll be notified on which channels",
            },
            {
                id: 'web',
                icon: 'heroicons_outline:window',
                title: 'Web',
                description: "Manage when you'll be notified on which channels",
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
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}

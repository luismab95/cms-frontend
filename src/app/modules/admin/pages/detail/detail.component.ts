import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation,
    signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { Subject, takeUntil } from 'rxjs';
import { MicrosityService } from '../../microsities/micrositie.service';
import { MicrositieI } from '../../microsities/micrositie.types';
import { PageService } from '../pages.service';
import { PageI } from '../pages.types';
import { PagesDrawerComponent } from './drawer/drawer.component';
import { PagesInformationComponent } from './information/information.component';
import { PagesLangugesComponent } from './languages/languages.component';

@Component({
    selector: 'pages-detail',
    templateUrl: './detail.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatSidenavModule,
        MatButtonModule,
        MatIconModule,
        NgClass,
        PagesInformationComponent,
        PagesLangugesComponent,
        PagesDrawerComponent,
    ],
})
export class PagesDetailComponent implements OnInit, OnDestroy {
    @ViewChild('drawer') drawer: MatDrawer;
    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = true;
    panels: any[] = [];
    selectedPanel: string = 'information';
    page = signal<PageI>(null);
    micrositie = signal<MicrositieI>(null);

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _pageService: PageService,
        private _microsityService: MicrosityService,
        private _router: Router
    ) {
        this._microsityService.micrositie$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((micrositie) => {
                // Update the templates
                this.micrositie.set(micrositie);
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

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
                id: 'information',
                icon: 'heroicons_outline:information-circle',
                title: 'Información',
                description: 'Gestiona la información de tu página.',
            },
        ];

        this._pageService.page$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((page) => {
                // Update the template
                this.page.set(page);

                if (page && this.panels.length === 1) {
                    this.panels.push({
                        id: 'languages',
                        icon: 'heroicons_outline:language',
                        title: 'Seo',
                        description:
                            'Administra la información de los meta tags de página en los diferentes idiomas del sitio.',
                    });
                    this.panels.push({
                        id: 'drawer',
                        icon: 'heroicons_outline:paint-brush',
                        title: 'Personalizar',
                        description: 'Personaliza el contenido de tu página.',
                    });
                }
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

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
     * Ir atras
     *
     */
    goToBack() {
        if (this.micrositie()) {
            this._router.navigateByUrl('/admin/modules/microsities/detail', {
                state: { id: this.micrositie().id },
            });
        } else {
            this._router.navigateByUrl('/admin/modules/pages');
        }
    }
}

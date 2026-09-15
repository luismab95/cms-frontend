import { Component, inject, OnDestroy, OnInit, signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MicrosityService } from 'app/core/services/micrositie.service';
import { PageService } from 'app/core/services/pages.service';
import { UserService } from 'app/core/services/user.service';
import { DrawerComponent } from 'app/shared/components/drawer/drawer';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { DrawerI } from 'app/shared/interfaces/drawer.interface';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { PagesInformationComponent } from './information/information';
import { PagesLangugesComponent } from './languages/languages';
import { Subject } from 'rxjs';

@Component({
  selector: 'pages-detail',
  templateUrl: './detail.html',
  imports: [
    DrawerComponent,
    PermissionComponent,
    PagesInformationComponent,
    PagesLangugesComponent,
    // PagesDrawerComponent,
  ],
})
export class PagesDetail implements OnInit, OnDestroy {
  permission = PermissionCode;
  panels = signal<DrawerI[]>([
    {
      id: 'information',
      icon: 'fa-solid fa-circle-info',
      title: 'Información',
      description: 'Gestiona la información de tu página.',
    },
  ]);
  selectedPanel = signal<string>('');

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _pageService = inject(PageService);
  private readonly _microsityService = inject(MicrosityService);
  private readonly _router = inject(Router);

  readonly page = toSignal(this._pageService.page$, {
    initialValue: null,
  });
  readonly micrositie = toSignal(this._microsityService.micrositie$, { initialValue: null });

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const page = this.page();
      if (page != null && this.panels().length === 1) {
        this.panels.update((prev) => [
          ...prev,
          {
            id: 'languages',
            icon: 'fa-solid fa-language',
            title: 'Seo',
            description:
              'Administra la información de los meta tags de página en los diferentes idiomas del sitio.',
          },
          {
            id: 'drawer',
            icon: 'fa-solid fa-paintbrush',
            title: 'Personalizar',
            description: 'Personaliza el contenido de tu página.',
          },
        ]);
      }
    });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    this.selectedPanel.set(this.panels()[0].id);
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
    this.selectedPanel.set(panel);
  }

  /**
   * Valid render permission
   */
  validPermission(code: string) {
    return validAction(code);
  }

  /**
   * Go to back
   */
  goToBack() {
    if (this.micrositie()) {
      this._router.navigateByUrl('/admin/content/microsities/detail', {
        state: { id: this.micrositie()?.id },
      });
    } else {
      this._router.navigateByUrl('/admin/content/pages');
    }
  }
}

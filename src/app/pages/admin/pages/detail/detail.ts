import { Component, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { PageService, MicrosityService } from '@core/services';
import { DrawerComponent, PermissionComponent } from '@shared/components';
import { DrawerI } from '@shared/interfaces';
import { PermissionCode, validAction } from '@shared/utils';
import { PagesInformationComponent } from './information/information';
import { PagesLangugesComponent } from './languages/languages';

@Component({
  selector: 'pages-detail',
  templateUrl: './detail.html',
  imports: [
    DrawerComponent,
    PermissionComponent,
    PagesInformationComponent,
    PagesLangugesComponent,
  ],
})
export class PagesDetail {
  panels = signal<DrawerI[]>([
    {
      id: 'information',
      icon: 'fa-solid fa-circle-info',
      title: 'Información',
      description: 'Gestiona la información de tu página.',
    },
  ]);
  selectedPanel = signal<string>('information');

  private readonly _pageService = inject(PageService);
  private readonly _microsityService = inject(MicrosityService);
  private readonly _router = inject(Router);

  readonly permission = PermissionCode;
  readonly page = this._pageService.page;
  readonly micrositie = this._microsityService.micrositie;

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const page = this.page();
      if (page && this.panels().length === 1) {
        this.panels.update((prev) => [
          ...prev,
          {
            id: 'languages',
            icon: 'fa-solid fa-language',
            title: 'Seo',
            description:
              'Administra la información de los meta tags de página en los diferentes idiomas del sitio.',
          },
        ]);
      }
    });
  }

  /**
   * Navigate to the panel
   * @param panel
   */
  goToPanel(panel: string): void {
    this.selectedPanel.set(panel);
  }

  /**
   * Valid render permission
   * @returns
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
        state: { micrositieId: this.micrositie()?.id },
      });
    } else {
      this._router.navigateByUrl('/admin/content/pages');
    }
  }
}

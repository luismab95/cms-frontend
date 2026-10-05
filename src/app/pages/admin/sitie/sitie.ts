import { Component, inject, signal } from '@angular/core';
import { SitieService } from '@core/services';
import { DrawerComponent, PermissionComponent, TitleHeaderComponent } from '@shared/components';
import { DrawerI } from '@shared/interfaces';
import { PermissionCode, validAction } from '@shared/utils';
import { SitieInformationComponent } from './information/information';
import { SitieLanguagesComponent } from './languages/languages';

@Component({
  selector: 'sitie',
  templateUrl: './sitie.html',
  imports: [
    DrawerComponent,
    SitieInformationComponent,
    SitieLanguagesComponent,
    PermissionComponent,
    TitleHeaderComponent,
  ],
})
export class Sitie {
  panels = signal<DrawerI[]>([]);
  selectedPanel = signal<string>('');

  private readonly _sitieService = inject(SitieService);

  readonly sitie = this._sitieService.sitie;

  readonly permission = PermissionCode;

  /**
   * Constructor
   */
  constructor() {
    this.panels.set([
      {
        id: 'information',
        icon: 'fa-solid fa-circle-info',
        title: 'Información',
        description: 'Gestiona la información general del sitio.',
      },
      {
        id: 'languages',
        icon: 'fa-solid fa-flag',
        title: 'Idiomas',
        description: 'Gestiona los idiomas disponibles del sitio.',
      },
    ]);

    this.selectedPanel.set(this.panels()[0].id);
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
}

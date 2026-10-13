import { Component, signal, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { MicrosityService } from '@core/services';
import {
  DrawerComponent,
  PermissionComponent,
  RolesPermissionsComponent,
} from '@shared/components';
import { DrawerI } from '@shared/interfaces';
import { PermissionCode, validAction } from '@shared/utils';
import { MicrositieInformationComponent } from './information/information';
import { PagesList } from '../../pages/list';

@Component({
  selector: 'microsities-detail',
  templateUrl: './detail.html',
  imports: [
    DrawerComponent,
    PermissionComponent,
    PagesList,
    RolesPermissionsComponent,
    RolesPermissionsComponent,
    MicrositieInformationComponent,
  ],
})
export class MicrositiesDetail {
  panels = signal<DrawerI[]>([
    {
      id: 'information',
      icon: 'fa-solid fa-circle-info',
      title: 'Información',
      description: 'Gestiona la información de tu micrositio.',
    },
  ]);
  selectedPanel = signal<string>('');

  private readonly _microsityService = inject(MicrosityService);
  private readonly _router = inject(Router);

  readonly permission = PermissionCode;
  readonly micrositie = this._microsityService.micrositie;

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const micrositie = this.micrositie();
      if (micrositie && this.panels().length === 1) {
        this.panels.update((prev) => [
          ...prev,
          {
            id: 'pages',
            icon: 'fa-solid fa-file-fragment',
            title: 'Páginas',
            description: 'Gestiona las páginas de tu micrositio.',
          },
          {
            id: 'roles',
            icon: 'fa-solid fa-user-shield',
            title: 'Roles & Permisos',
            description:
              'Asigna los usuarios autorizados al micrositio, según su función designada (Revisores, Editores o Diseñadores).',
          },
        ]);
      }
      this.selectedPanel.set(this.panels()[0].id);
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
    this._router.navigateByUrl('/admin/content/microsities');
  }
}

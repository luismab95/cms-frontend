import { Component, signal, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { MicrosityService } from '@core/services';
import { DrawerComponent, PermissionComponent } from '@shared/components';
import { DrawerI } from '@shared/interfaces';
import { PermissionCode, validAction } from '@shared/utils';
import { PagesList } from '../../pages/list';
import { MicrositieInformationComponent } from './information/information';

@Component({
  selector: 'microsities-detail',
  templateUrl: './detail.html',
  imports: [DrawerComponent, PermissionComponent, MicrositieInformationComponent, PagesList],
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

import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ParameterService } from '@core/services';
import { DrawerComponent, PermissionComponent, TitleHeaderComponent } from '@shared/components';
import { DrawerI } from '@shared/interfaces';
import { PermissionCode, validAction } from '@shared/utils';
import { ParametersCompanyComponent } from './company/company';
import { ParametersEmailComponent } from './email/email';
import { ParametersLogosComponent } from './logos/logos';
import { ParametersSecurityComponent } from './security/security';

@Component({
  selector: 'parameters',
  templateUrl: './parameters.html',
  imports: [
    ParametersLogosComponent,
    ParametersEmailComponent,
    ParametersSecurityComponent,
    ParametersCompanyComponent,
    PermissionComponent,
    DrawerComponent,
    TitleHeaderComponent,
  ],
})
export class Parameters {
  panels = signal<DrawerI[]>([]);
  selectedPanel = signal<string>('');

  private readonly _parameterService = inject(ParameterService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly permission = PermissionCode;
  readonly parameters = this._parameterService.parameters;

  /**
   * Constructor
   */
  constructor() {
    this.panels.set([
      {
        id: 'company',
        icon: 'fa-solid fa-building',
        title: 'Compañía',
        description: 'Gestiona la información de tu compañia.',
      },
      {
        id: 'images',
        icon: 'fa-solid fa-images',
        title: 'Imágenes',
        description: 'Gestiona las imágenes de la aplicación.',
      },
      {
        id: 'email',
        icon: 'fa-solid fa-envelope',
        title: 'Correo electrónico',
        description: 'Administra las creedenciales para el envio de correos electrónicos.',
      },
      {
        id: 'security',
        icon: 'fa-solid fa-shield-halved',
        title: 'Seguridad',
        description: 'Administra los parámetros de seguridad de tu aplicación.',
      },
    ]);

    this.selectedPanel.set(this.panels()[0].id);
    this.getAllParameters();
  }

  /**
   * Get parameters
   */
  getAllParameters() {
    this._parameterService.getAll().pipe(takeUntilDestroyed(this._destroyRef)).subscribe();
  }

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
}

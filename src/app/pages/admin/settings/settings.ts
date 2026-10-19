import { Component, inject, signal } from '@angular/core';
import { UserService } from '@core/services';
import { PermissionComponent, DrawerComponent, TitleHeaderComponent } from '@shared/components';
import { DrawerI } from '@shared/interfaces';
import { PermissionCode, validAction } from '@shared/utils';
import { SettingsAccountComponent } from './account/account';
import { SettingsSecurityComponent } from './security/security';

@Component({
  selector: 'settings',
  templateUrl: './settings.html',
  imports: [
    PermissionComponent,
    DrawerComponent,
    SettingsAccountComponent,
    SettingsSecurityComponent,
    TitleHeaderComponent,
  ],
})
export class Settings {
  panels = signal<DrawerI[]>([]);
  selectedPanel = signal<string>('');

  private readonly _userService = inject(UserService);

  readonly permission = PermissionCode;
  readonly user = this._userService.userLogin;

  /**
   * Constructor
   */
  constructor() {
    this.panels.set([
      {
        id: 'account',
        icon: 'fa-solid fa-circle-user',
        title: 'Cuenta',
        description: 'Administra tu perfil público e información privada',
      },
      {
        id: 'security',
        icon: 'fa-solid fa-user-shield',
        title: 'Seguridad',
        description: 'Administre su contraseña y preferencias de verificación en dos pasos',
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

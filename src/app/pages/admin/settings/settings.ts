import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService } from 'app/core/services/user.service';
import { DrawerComponent } from 'app/shared/components/drawer/drawer';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { DrawerI } from 'app/shared/interfaces/drawer.interface';
import { TitleHeaderComponent } from 'app/shared/components/title-header/title-header';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { SettingsAccountComponent } from './account/account';
import { SettingsSecurityComponent } from './security/security';
import { Subject } from 'rxjs';

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
export class Settings implements OnInit, OnDestroy {
  permission = PermissionCode;
  panels = signal<DrawerI[]>([]);
  selectedPanel = signal<string>('');

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _userService = inject(UserService);

  readonly user = toSignal(this._userService.userLogin$, {
    initialValue: null,
  });

  /**
   * Constructor
   */
  constructor() {}

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Setup available panels
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
}

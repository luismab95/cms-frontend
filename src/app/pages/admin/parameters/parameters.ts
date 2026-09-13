import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { ParametersCompanyComponent } from './company/company';
import { DrawerI } from 'app/shared/interfaces/drawer.interface';
import { ParameterService } from 'app/core/services/parameter.service';
import { DrawerComponent } from 'app/shared/components/drawer/drawer';
import { ParametersEmailComponent } from './email/email';
import { ParametersSecurityComponent } from './security/security';
import { ParametersLogosComponent } from './logos/logos';
import { Subject, takeUntil } from 'rxjs';

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
  ],
})
export class Parameters implements OnInit, OnDestroy {
  permission = PermissionCode;
  panels = signal<DrawerI[]>([]);
  selectedPanel = signal<string>('');

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _parameterService = inject(ParameterService);

  readonly parameters = toSignal(this._parameterService.parameters$, { initialValue: [] });

  /**
   * Constructor
   */
  constructor() {
    //Get parameters
    this.getAllParameters();
  }

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
   * Get parameters
   */
  getAllParameters() {
    this._parameterService.getAll().pipe(takeUntil(this._unsubscribeAll)).subscribe();
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

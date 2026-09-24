import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TemplateService } from 'app/core/services/templates.service';
import { DrawerComponent } from 'app/shared/components/drawer/drawer';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { DrawerI } from 'app/shared/interfaces/drawer.interface';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { TemplatesInformationComponent } from './information/information';
import { Subject } from 'rxjs';

@Component({
  selector: 'templates-detail',
  templateUrl: './detail.html',
  imports: [DrawerComponent, PermissionComponent, TemplatesInformationComponent],
})
export class TemplatesDetail implements OnInit, OnDestroy {
  permission = PermissionCode;
  panels = signal<DrawerI[]>([
    {
      id: 'information',
      icon: 'fa-solid fa-circle-info',
      title: 'Información',
      description: 'Gestiona la información de tu plantilla.',
    },
  ]);
  selectedPanel = signal<string>('');

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _templateService = inject(TemplateService);
  private readonly _router = inject(Router);

  readonly template = toSignal(this._templateService.template$, {
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
    this._router.navigateByUrl('/admin/content/templates');
  }
}

import { Component, inject, OnDestroy, OnInit, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MicrosityService } from 'app/core/services/micrositie.service';
import { DrawerComponent } from 'app/shared/components/drawer/drawer';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { DrawerI } from 'app/shared/interfaces/drawer.interface';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { MicrositieInformationComponent } from './information/information';
import { PagesList } from '../../pages/list';
import { Subject } from 'rxjs';

@Component({
  selector: 'microsities-detail',
  templateUrl: './detail.html',
  imports: [DrawerComponent, PermissionComponent, MicrositieInformationComponent, PagesList],
})
export class MicrositiesDetail implements OnInit, OnDestroy {
  permission = PermissionCode;
  panels = signal<DrawerI[]>([
    {
      id: 'information',
      icon: 'fa-solid fa-circle-info',
      title: 'Información',
      description: 'Gestiona la información de tu micrositio.',
    },
  ]);
  selectedPanel = signal<string>('');

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _microsityService = inject(MicrosityService);
  private readonly _router = inject(Router);

  readonly micrositie = toSignal(this._microsityService.micrositie$, { initialValue: null });

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const micrositie = this.micrositie();
      if (micrositie != null && this.panels().length === 1) {
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

    // this._microsityService.micrositie = null!;
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
    this._router.navigateByUrl('/admin/content/microsities');
  }
}

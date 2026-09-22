import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SitieService } from 'app/core/services/sitie.service';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { DrawerI } from 'app/shared/interfaces/drawer.interface';
import { DrawerComponent } from 'app/shared/components/drawer/drawer';
import { SitieInformationComponent } from './information/information';
import { SitieLanguagesComponent } from './languages/languages';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { Subject } from 'rxjs';
import { TitleHeaderComponent } from 'app/shared/components/title-header/title-header';

@Component({
  selector: 'sitie',
  templateUrl: './sitie.html',
  imports: [
    DrawerComponent,
    SitieInformationComponent,
    SitieLanguagesComponent,
    PermissionComponent,
    TitleHeaderComponent
  ],
})
export class Sitie implements OnInit, OnDestroy {
  permission = PermissionCode;
  panels = signal<DrawerI[]>([]);
  selectedPanel = signal<string>('');

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _sitieService = inject(SitieService);

  readonly sitie = toSignal(this._sitieService.sitie$, {
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

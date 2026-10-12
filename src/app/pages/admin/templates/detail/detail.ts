import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TemplateService } from '@core/services';
import { DrawerComponent, PermissionComponent } from '@shared/components';
import { DrawerI } from '@shared/interfaces';
import { PermissionCode, validAction } from '@shared/utils';
import { TemplatesInformationComponent } from './information/information';

@Component({
  selector: 'templates-detail',
  templateUrl: './detail.html',
  imports: [DrawerComponent, PermissionComponent, TemplatesInformationComponent],
})
export class TemplatesDetail {
  panels = signal<DrawerI[]>([
    {
      id: 'information',
      icon: 'fa-solid fa-circle-info',
      title: 'Información',
      description: 'Gestiona la información de tu plantilla.',
    },
  ]);
  selectedPanel = signal<string>('');
  
  private readonly _templateService = inject(TemplateService);
  private readonly _router = inject(Router);
  
  readonly permission = PermissionCode;
  readonly template = this._templateService.template;

  /**
   * Constructor
   */
  constructor() {
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

  /**
   * Go to back
   */
  goToBack() {
    this._router.navigateByUrl('/admin/content/templates');
  }
}

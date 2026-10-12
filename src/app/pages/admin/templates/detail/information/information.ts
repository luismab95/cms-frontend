import {
  AfterViewInit,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { form, FormField, maxLength, required, submit } from '@angular/forms/signals';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { TemplateI } from '@core/interfaces';
import { TemplateService, SitieService, DynamicStyleService } from '@core/services';
import { PermissionComponent, GridComponent } from '@shared/components';
import { PermissionCode, createPageConfig, validAction, hasErrorFormField } from '@shared/utils';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'templates-information',
  templateUrl: './information.html',
  imports: [PermissionComponent, GridComponent, FormField, NgClass],
})
export class TemplatesInformationComponent implements AfterViewInit {
  private readonly previewContainer =
    viewChild.required<ElementRef<HTMLElement>>('previewContainer');

  previewScale = signal<number>(1);
  templateModel = signal<TemplateI>({
    name: '',
    description: '',
    status: false,
  });

  templateForm = form(this.templateModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Nombre es obligatorio.' });
    required(schemaPath.description, { message: 'Descripción es obligatorio.' });
    maxLength(schemaPath.description, 255, {
      message: 'Descripción no puede superar los 255 caracteres.',
    });
  });

  private readonly _templateService = inject(TemplateService);
  private readonly _sitieService = inject(SitieService);
  private readonly _dynamicStyleService = inject(DynamicStyleService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _router = inject(Router);

  readonly permission = PermissionCode;
  readonly hasError = hasErrorFormField;
  readonly template = this._templateService.template;
  readonly sitie = this._sitieService.sitie;

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const template = this.template();
      if (!template) return;
      this.templateModel.set(template);
      untracked(() => {
        this.loadTemplate(template);
      });
    });
  }

  /**
   * AfterViewInit
   */
  ngAfterViewInit(): void {
    const element = this.previewContainer().nativeElement;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      this.previewScale.set(width / 1440);
    });
    observer.observe(element);
  }

  /**
   * Go to Canvas
   */
  goToCanvas(): void {
    this._router.navigateByUrl('/admin/content/templates/canvas', {
      state: {
        id: this.template() === null ? 0 : this.template()!.id,
      },
    });
  }

  /**
   * Save event
   * @param event
   */
  async save(event: SubmitEvent): Promise<void> {
    if (this.template()) {
      await this.update(event);
    } else {
      await this.create(event);
    }
  }

  /**
   * Add page
   * @param event
   * @returns
   */
  async create(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault();
      await submit(this.templateForm, async (field) => {
        const newHeaderConfig = createPageConfig('header');
        const newFooterConfig = createPageConfig('footer');

        const newTemplate = {
          ...field().value(),
          data: {
            header: {
              css: newHeaderConfig.css,
              config: newHeaderConfig.config,
              data: [],
            },
            footer: {
              css: newFooterConfig.css,
              config: newFooterConfig.config,
              data: [],
            },
          },
        };

        delete newTemplate.status;
        await firstValueFrom(
          this._templateService.create(newTemplate).pipe(takeUntilDestroyed(this._destroyRef)),
        );
        this._toastrService.success('La plantilla se creó correctamente.', 'Plantilla creada');
        this._router.navigateByUrl('/admin/content/templates');
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || 'No fue posible crear la plantilla.',
        'Error al crear',
      );
    }
  }

  /**
   * Update page
   * @param event
   * @returns
   */
  async update(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault();
      await submit(this.templateForm, async (field) => {
        const template = this.template();
        if (!template) return;

        const updateTemplate = {
          ...field().value(),
          data: template.data,
        };

        await firstValueFrom(
          this._templateService
            .update(template.id!, updateTemplate)
            .pipe(takeUntilDestroyed(this._destroyRef)),
        );
        this._toastrService.success(
          'La informacion de la plantilla se actualizó correctamente.',
          'Plantilla actualizada',
        );
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || 'No fue posible actualizar la información de la plantilla.',
        'Error al actualizar',
      );
    }
  }

  /**
   * Cancel changes
   */
  cancel(): void {
    const template = this.template();
    if (!template) return;

    this.templateModel.set(template);
  }

  /**
   * Valid Permission
   * @param code
   * @returns
   */
  validPermission(code: string): boolean {
    return validAction(code);
  }

  /**
   * Load template
   * @param template
   */
  loadTemplate(template: TemplateI) {
    this._dynamicStyleService.remove('preview-template');
    const css = ` ${template.data?.header.css ?? ''} ${template.data?.footer.css ?? ''}`;
    this._dynamicStyleService.set('preview-template', css);
    this._templateService.template.set(template);
  }
}

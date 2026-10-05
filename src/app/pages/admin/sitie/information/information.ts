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
import { form, FormField, maxLength, pattern, required, submit } from '@angular/forms/signals';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { SitieI, TemplateI } from '@core/interfaces';
import { DynamicStyleService, SitieService, TemplateService } from '@core/services';
import { PermissionComponent, GridComponent } from '@shared/components';
import { TooltipDirective } from '@shared/directives';
import { hasErrorFormField, PermissionCode, validAction } from '@shared/utils';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'sitie-information',
  templateUrl: './information.html',
  imports: [PermissionComponent, GridComponent, TooltipDirective, FormField, NgClass],
})
export class SitieInformationComponent implements AfterViewInit {
  private readonly previewContainer =
    viewChild.required<ElementRef<HTMLElement>>('previewContainer');

  previewScale = signal<number>(1);
  selectedTemplate = signal<number>(0);
  sitieModel = signal<SitieI>({
    name: '',
    domain: '',
    description: '',
    status: false,
    maintenance: false,
    templateId: 0,
  });

  sitieForm = form(this.sitieModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Nombre es obligatorio.' });
    required(schemaPath.domain, { message: 'Dominio es obligatorio.' });
    pattern(schemaPath.domain, /^https?:\/\/[a-zA-Z0-9.-]+(:\d+)?(\/.*)?$/, {
      message: 'Dominio debe ser una URL válida.',
    });
    required(schemaPath.description, { message: 'Descripción es obligatorio.' });
    maxLength(schemaPath.description, 255, {
      message: 'Descripción no puede superar los 255 caracteres.',
    });
    required(schemaPath.templateId, { message: 'Plantilla es obligatorio.' });
  });

  private readonly _sitieService = inject(SitieService);
  private readonly _templateService = inject(TemplateService);
  private readonly _dynamicStyleService = inject(DynamicStyleService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly permission = PermissionCode;
  readonly hasError = hasErrorFormField;
  readonly sitie = this._sitieService.sitie;
  readonly templates = this._templateService.templates;

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const sitie = this.sitie();
      if (!sitie) return;
      this.sitieModel.set(sitie);
      untracked(() => {
        const index = this.templates().records.findIndex(
          (template) => template.id === sitie.templateId,
        );
        this.selectedTemplate.set(index);
        const findTemplate = this.currentTemplate;
        if (!findTemplate) return;
        this.loadTemplate(findTemplate);
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
   * Go to Sitie
   */
  visit(): void {
    const domain = this.sitie()?.domain;
    if (domain) window.open(domain, '_blank');
  }

  /**
   * Save Changes
   * @returns
   */
  async save(event: SubmitEvent): Promise<void> {
    try {
      const sitie = this.sitie();
      if (!sitie) return;

      event.preventDefault();
      await submit(this.sitieForm, async (field) => {
        await firstValueFrom(
          this._sitieService
            .update(sitie.id!, field().value())
            .pipe(takeUntilDestroyed(this._destroyRef)),
        );
        this._toastrService.success('El sitio se actualizó correctamente.', 'Sitio actualizado');
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || 'No fue posible actualizar la configuración del sitio.',
        'Error al actualizar',
      );
    }
  }

  /**
   * Cancel changes
   */
  cancel(): void {
    const sitie = this.sitie();
    if (!sitie) return;

    this.sitieModel.set(sitie);
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
   * next carousel
   */
  next(): void {
    this.selectedTemplate.update((index) =>
      index === this.templates().records.length - 1 ? 0 : index + 1,
    );
    const template = this.currentTemplate;
    if (!template) return;
    this.loadTemplate(template);
  }

  /**
   * previous carousel
   */
  previous(): void {
    this.selectedTemplate.update((index) =>
      index === 0 ? this.templates().records.length - 1 : index - 1,
    );
    const template = this.currentTemplate;
    if (!template) return;

    this.loadTemplate(template);
  }

  /**
   * Change template
   * @param id
   * @returns
   */
  selectTemplate(id: number): void {
    this.selectedTemplate.set(id);
    const template = this.currentTemplate;
    if (template === null) return;
    this.loadTemplate(template);
  }

  /**
   * Get index of current template
   */
  get currentTemplate(): TemplateI {
    return this.templates().records[this.selectedTemplate()] ?? null;
  }

  /**
   * Change template in sitie
   * @param templateId
   * @param event
   */
  onSelectTemplate(templateId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (!checked) return;

    this.sitieModel.update((prev) => ({ ...prev, templateId }));
    const template = this.templates().records.find((template) => template.id === templateId)!;
    if (!template) return;

    this.loadTemplate(template);
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

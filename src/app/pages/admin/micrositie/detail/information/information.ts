import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { form, required, maxLength, submit, FormField, disabled } from '@angular/forms/signals';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { MicrositieI, TemplateI } from '@core/interfaces';
import {
  SitieService,
  MicrosityService,
  TemplateService,
  DynamicStyleService,
} from '@core/services';
import { GridComponent } from '@shared/components';
import { TooltipDirective } from '@shared/directives';
import { PermissionCode, hasErrorFormField, validAction } from '@shared/utils';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'microsities-information',
  templateUrl: './information.html',
  imports: [GridComponent, TooltipDirective, NgClass, FormField],
})
export class MicrositieInformationComponent implements AfterViewInit {
  private readonly previewContainer =
    viewChild.required<ElementRef<HTMLElement>>('previewContainer');

  previewScale = signal<number>(1);
  selectedTemplate = signal<number>(0);
  micrositieModel = signal<MicrositieI>({
    name: '',
    description: '',
    status: false,
    templateId: 0,
    sitieId: 0,
  });

  micrositieForm = form(this.micrositieModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Nombre es obligatorio.' });
    required(schemaPath.description, { message: 'Descripción es obligatorio.' });
    maxLength(schemaPath.description, 255, {
      message: 'Descripción no puede superar los 255 caracteres.',
    });
    required(schemaPath.sitieId, { message: 'Sitio es obligatorio.' });
    required(schemaPath.templateId, { message: 'Plantilla es obligatorio.' });
    disabled(schemaPath, {
      when: () => !this.validPermission(this.permission.editMicrosite),
    });
  });

  private readonly _sitieService = inject(SitieService);
  private readonly _microsityService = inject(MicrosityService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _domSanitizer = inject(DomSanitizer);
  private readonly _templateService = inject(TemplateService);
  private readonly _dynamicStyleService = inject(DynamicStyleService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _router = inject(Router);

  readonly permission = PermissionCode;
  readonly hasError = hasErrorFormField;
  readonly sitie = this._sitieService.sitie;
  readonly micrositie = this._microsityService.micrositie;
  readonly templates = this._templateService.templates;

  readonly previewDefaultPage = computed(() => {
    const micrositie = this.micrositie();
    return this._domSanitizer.bypassSecurityTrustResourceUrl(
      `${this.sitie()?.domain}/preview/${micrositie?.path}`,
    );
  });

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const micrositie = this.micrositie();
      untracked(() => {
        if (!micrositie) {
          this.micrositieModel.update((prev) => ({
            ...prev,
            templateId: this.templates().records[0].id!,
          }));
          const findTemplate = this.currentTemplate;
          if (!findTemplate) return;
          this.loadTemplate(findTemplate);
          return;
        }
        this.micrositieModel.set(micrositie);
        const index = this.templates().records.findIndex(
          (template) => template.id === micrositie.templateId,
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
    const domain = `${this.sitie()?.domain}/${this.micrositie()?.path}`;
    window.open(domain, '_blank');
  }

  /**
   * Save event
   * @param event
   */
  async save(event: SubmitEvent): Promise<void> {
    if (this.micrositie()) {
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
      await submit(this.micrositieForm, async (field) => {
        const sitie = this.sitie();
        if (!sitie) return;
        const newMicrositie = { ...field().value(), sitieId: sitie.id! };
        await firstValueFrom(
          this._microsityService.create(newMicrositie).pipe(takeUntilDestroyed(this._destroyRef)),
        );
        this._toastrService.success('El micrositio se creó correctamente.', 'Micrositio creado');
        this._router.navigateByUrl('/admin/content/microsities');
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || 'No fue posible crear el micrositio.',
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
      await submit(this.micrositieForm, async (field) => {
        const micrositie = this.micrositie();
        if (!micrositie) return;

        const updateMicrositie = { ...field().value() };
        delete updateMicrositie.path;
        (delete updateMicrositie.pathPage,
          await firstValueFrom(
            this._microsityService
              .update(micrositie.id!, updateMicrositie)
              .pipe(takeUntilDestroyed(this._destroyRef)),
          ));
        this._toastrService.success(
          'La informacion del micrositio se actualizó correctamente.',
          'Micrositio actualizado',
        );
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || 'No fue posible actualizar la informacion del micrositio.',
        'Error al actualizar',
      );
    }
  }

  /**
   * Cancel changes
   */
  cancel(): void {
    const micrositie = this.micrositie();
    if (!micrositie) return;

    this.micrositieModel.set(micrositie);
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
    if (!template) return;
    this.loadTemplate(template);
  }

  /**
   * Get index of current template
   * @returns
   */
  get currentTemplate(): TemplateI {
    return this.templates().records[this.selectedTemplate()] ?? null;
  }

  /**
   * Change template for micrositie
   * @param templateId
   * @param event
   */
  onSelectTemplate(templateId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.micrositieModel.update((prev) => ({ ...prev, templateId }));
      const template = this.templates().records.find((template) => template.id === templateId)!;
      if (!template) return;
      this.loadTemplate(template);
    }
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

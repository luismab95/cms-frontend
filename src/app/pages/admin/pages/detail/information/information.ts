import { NgClass } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { disabled, form, FormField, pattern, required, submit } from '@angular/forms/signals';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { PageI } from '@core/interfaces';
import { SitieService, PageService, MicrosityService } from '@core/services';
import { PermissionCode, createPageConfig, hasErrorFormField, validAction } from '@shared/utils';
import { firstValueFrom } from 'rxjs';
import { TooltipDirective } from '@shared/directives';

@Component({
  selector: 'pages-information',
  templateUrl: './information.html',
  imports: [NgClass, FormField, TooltipDirective],
})
export class PagesInformationComponent {
  pageModel = signal<PageI>({
    name: '',
    path: '',
    status: false,
  });

  pageForm = form(this.pageModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Nombre es obligatorio.' });
    required(schemaPath.path, { message: 'Ruta es obligatorio.' });
    pattern(schemaPath.path, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: 'Ruta no válida.',
    });
    disabled(schemaPath, {
      when: () => !this.validPermission(this.permission.editPage),
    });
  });

  private readonly _sitieService = inject(SitieService);
  private readonly _pageService = inject(PageService);
  private readonly _microsityService = inject(MicrosityService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _domSanitizer = inject(DomSanitizer);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  readonly permission = PermissionCode;
  readonly hasError = hasErrorFormField;
  readonly sitie = this._sitieService.sitie;
  readonly micrositie = this._microsityService.micrositie;
  readonly page = this._pageService.page;

  readonly previewPage = computed(() => {
    const page = this.page();
    const micrositie = this.micrositie();

    const url = !micrositie
      ? `${this.sitie()?.domain}/preview/${page?.path}`
      : `${this.sitie()!.domain}/preview/${micrositie.path}/`;

    return this._domSanitizer.bypassSecurityTrustResourceUrl(url);
  });

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const page = this.page();
      if (!page) return;
      untracked(() => {
        this.pageModel.set(page);
      });
    });
  }

  /**
   * Go to Sitie
   */
  visit(): void {
    const page = this.page();
    const micrositie = this.micrositie();

    const url = !micrositie
      ? `${this.sitie()?.domain}/${page?.path}`
      : `${this.sitie()!.domain}/${micrositie.path}/`;
    window.open(url, '_blank');
  }

  /**
   * Go to Canvas
   */
  goToCanvas(): void {
    this._router.navigateByUrl('/admin/content/pages/canvas', {
      state: {
        id: this.page() === null ? 0 : this.page()!.id!,
        micrositieId: this.micrositie() !== null ? this.micrositie()!.id! : 0,
      },
    });
  }

  /**
   * Get domain
   * @returns
   */
  getDomain() {
    if (this.micrositie() !== null) {
      const micrositiePath = this.micrositie()?.path!.split('/')[0];
      return `${this.sitie()!.domain}/preview/${micrositiePath}/`;
    }
    return `${this.sitie()!.domain}/preview/`;
  }

  /**
   * Remove preview in path
   * @returns
   */
  removePreviewPath() {
    return this.getDomain().replace('/preview', '');
  }

  /**
   * Save event
   * @param event
   */
  async save(event: SubmitEvent): Promise<void> {
    if (this.page()) {
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
      await submit(this.pageForm, async (field) => {
        const newPageConfig = createPageConfig('page');
        const { name, path } = field().value();
        const newPage = {
          name,
          path,
          data: {
            body: {
              css: newPageConfig.css,
              config: newPageConfig.config,
              data: [],
            },
          },
        } as PageI;

        const micrositie = this.micrositie();
        if (micrositie) {
          newPage.micrositieId = micrositie.id;
        }

        await firstValueFrom(
          this._pageService.create(newPage).pipe(takeUntilDestroyed(this._destroyRef)),
        );
        this._toastrService.success('La página se creó correctamente.', 'Página creada');
        this.goToBack();
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || 'No fue posible crear la página.',
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
      await submit(this.pageForm, async (field) => {
        const page = this.page();
        if (!page) return;

        const { name, path, status } = field().value();
        const updatePage = { name, path, status } as PageI;
        await firstValueFrom(
          this._pageService.update(page.id!, updatePage).pipe(takeUntilDestroyed(this._destroyRef)),
        );
        this._toastrService.success(
          'La informacion de la página se actualizó correctamente.',
          'Página actualizada',
        );
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || 'No fue posible actualizar la informacion de la página.',
        'Error al actualizar',
      );
    }
  }

  /**
   * Cancel changes
   */
  cancel(): void {
    const page = this.page();
    if (!page) return;

    this.pageModel.set(page);
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
   * Go to back
   */
  goToBack() {
    if (this.micrositie()) {
      this._router.navigateByUrl('/admin/content/microsities/detail', {
        state: { micrositieId: this.micrositie()?.id },
      });
    } else {
      this._router.navigateByUrl('/admin/content/pages');
    }
  }
}

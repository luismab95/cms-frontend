import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe, formatNumber, NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { DomSanitizer } from '@angular/platform-browser';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import {
  ApexOptionsI,
  weekVisit,
  yearVisit,
  distributionOrigen,
  Top10PagesI,
} from '@core/interfaces';
import {
  NotificationsService,
  ParameterService,
  SitieService,
  HomeService,
  UserService,
} from '@core/services';
import { PermissionComponent } from '@shared/components';
import { TooltipDirective } from '@shared/directives';
import { PermissionCode, validAction, findParameter } from '@shared/utils';
import { forkJoin } from 'rxjs';
@Component({
  selector: 'home',
  templateUrl: './home.html',
  imports: [
    RouterLink,
    ClipboardModule,
    NgApexchartsModule,
    PermissionComponent,
    DecimalPipe,
    TooltipDirective,
    NgClass,
  ],
})
export class Home {
  weekVisitButton = signal<'lastWeek' | 'thisWeek'>('thisWeek');
  yearVisitButton = signal<'lastYear' | 'thisYear'>('thisYear');
  visitButton = signal<'year' | 'week'>('week');

  private readonly _notificationsService = inject(NotificationsService);
  private readonly _parameterService = inject(ParameterService);
  private readonly _sitieService = inject(SitieService);
  private readonly _homeService = inject(HomeService);
  private readonly _userService = inject(UserService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _domSanitizer = inject(DomSanitizer);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  readonly permission = PermissionCode;
  readonly formatNumberUtil = formatNumber;

  readonly parameters = this._parameterService.publicParameters;
  readonly user = this._userService.userLogin;
  readonly countElements = this._homeService.countElements;
  readonly dataServiceWeek = this._homeService.weekVisit;
  readonly dataServiceYear = this._homeService.yearVisit;
  readonly visitVsPages = this._homeService.visitVsPages;
  readonly dataServiceTop10 = this._homeService.top10Pages;
  readonly notifications = this._notificationsService.notifications;
  readonly sitie = this._sitieService.sitie;

  readonly top3Pages = computed(() => {
    return [...this.dataServiceTop10()]
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 3)
      .map((item) => ({
        ...item,
        safePreviewPath: this._domSanitizer.bypassSecurityTrustResourceUrl(
          `${this.getDomain()}/${item.lang}/preview${item.path}`,
        ),
      }));
  });
  readonly top10Pages = computed(() => {
    return [...this.dataServiceTop10()]
      .sort((a, b) => b.visits - a.visits)
      .map((item) => ({
        ...item,
        url: `${this.getDomain()}/${item.lang}${item.path}`,
      }));
  });
  readonly unreadNotify = computed(() => this.notifications().length);
  readonly weekVisit = computed<ApexOptionsI>(() => {
    const data = this.dataServiceWeek();
    return data ? weekVisit(data) : {};
  });
  readonly yearVisit = computed<ApexOptionsI>(() => {
    const data = this.dataServiceYear();
    return data ? yearVisit(data) : {};
  });
  readonly distributionOrigen = computed<ApexOptions>(() => {
    const data = this.visitVsPages();
    return data ? distributionOrigen(data) : {};
  });
  readonly totalVisitWeek = computed(() => {
    const dataServiceWeek = this.dataServiceWeek()!['thisWeek'];
    const total = dataServiceWeek.micrositie + dataServiceWeek.page + dataServiceWeek.sitie;
    return total > 0 ? total : 1;
  });

  /**
   * Validate permission
   * @param code
   * @returns
   */
  validPermission(code: string): boolean {
    return validAction(code);
  }

  /**
   * Copy url to clipboard
   */
  copyEvent(): void {
    this._toastrService.info('URL copiada al portapapeles', 'Aviso');
  }

  /**
   * Get company parameters
   * @param code
   * @returns
   */
  getCompanyInfo(code: string) {
    return findParameter(code, this.parameters()!);
  }

  /**
   * Go To canvas
   */
  goToCanvas(page: Top10PagesI) {
    this._router.navigateByUrl('/admin/content/pages/canvas', {
      state: {
        id: page.pageId,
        micrositieId: page.micrositieId === null ? 0 : page.micrositieId,
      },
    });
  }

  /**
   * Get only domain
   */
  getDomain() {
    const url = new URL(this.sitie()?.domain!);
    return url.origin;
  }

  /**
   * Refresh data in dashboard
   */
  refreshData() {
    forkJoin({
      top10: this._homeService.getTop10Pages(),
      weekVisit: this._homeService.getWeekVisit(),
      yearVisit: this._homeService.getYearVisit(),
      visitVsPages: this._homeService.getVisitVsPages(),
      countElements: this._homeService.getCountElements(),
    })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe();
  }
}

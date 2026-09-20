import { DomSanitizer } from '@angular/platform-browser';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { DecimalPipe, NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import {
  ApexOptionsI,
  distributionOrigen,
  Top10PagesI,
  weekVisit,
  yearVisit,
  YearVisitDataI,
} from 'app/core/interfaces/home.interface';
import { HomeService } from 'app/core/services/home.service';
import { UserService } from 'app/core/services/user.service';
import { NotificationsService } from 'app/core/services/notifications.service';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { ParameterService } from 'app/core/services/parameter.service';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { SitieService } from 'app/core/services/sitie.service';
import { formatNumber } from 'app/shared/utils/number.utils';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
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

  formatNumberUtil = formatNumber;

  private readonly _notificationsService = inject(NotificationsService);
  private readonly _parameterService = inject(ParameterService);
  private readonly _sitieService = inject(SitieService);
  private readonly _homeService = inject(HomeService);
  private readonly _userService = inject(UserService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _domSanitizer = inject(DomSanitizer);
  private readonly _router = inject(Router);

  readonly permission = PermissionCode;

  readonly parameters = toSignal(this._parameterService.parameter$, {
    initialValue: null,
  });

  readonly user = toSignal(this._userService.userLogin$, {
    initialValue: null,
  });
  readonly countElements = toSignal(this._homeService.countElements$, {
    initialValue: null,
  });
  readonly dataServiceWeek = toSignal(this._homeService.weekVisit$, {
    initialValue: null,
  });
  readonly dataServiceYear = toSignal(this._homeService.yearVisit$, {
    initialValue: null,
  });
  readonly visitVsPages = toSignal(this._homeService.visitVsPages$, {
    initialValue: null,
  });
  readonly dataServiceTop10 = toSignal(this._homeService.top10Pages$, {
    initialValue: [],
  });
  readonly notifications = toSignal(this._notificationsService.notifications$, {
    initialValue: [],
  });
  readonly sitie = toSignal(this._sitieService.sitie$, {
    initialValue: null,
  });

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

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------

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
    }).subscribe();
  }
}

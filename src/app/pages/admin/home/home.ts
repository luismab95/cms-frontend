import { DomSanitizer } from '@angular/platform-browser';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import {
  ApexOptionsI,
  distributionOrigen,
  weekVisit,
  yearVisit,
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

@Component({
  selector: 'home',
  templateUrl: './home.html',
  imports: [RouterLink, ClipboardModule, NgApexchartsModule, PermissionComponent],
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

  readonly permission = PermissionCode;

  // --------------------------------------------------------------------------
  // Signals
  // --------------------------------------------------------------------------

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

  readonly dataServiceTop10 = toSignal(this._homeService.top10Pages$, {
    initialValue: [],
  });

  readonly notifications = toSignal(this._notificationsService.notifications$, {
    initialValue: [],
  });

  readonly sitie = toSignal(this._sitieService.sitie$, {
    initialValue: null,
  });

  // --------------------------------------------------------------------------
  // Computed
  // --------------------------------------------------------------------------

  readonly top3Pages = computed(() => {
    return [...this.dataServiceTop10()]
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 3)
      .slice(0, 3)
      .map((item) => ({
        ...item,
        safePath: this.sanitizer.bypassSecurityTrustResourceUrl(item.path),
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
    const data = this.countElements();
    return data ? distributionOrigen(data) : {};
  });

  readonly totalVisitWeek = computed(() => {
    const dataServiceWeek = this.dataServiceWeek()!['thisWeek'];
    const total = dataServiceWeek.micrositie + dataServiceWeek.page + dataServiceWeek.sitie;
    return total > 0 ? total : 1;
  });

  constructor(private sanitizer: DomSanitizer) {}

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
}

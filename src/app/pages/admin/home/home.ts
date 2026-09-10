import { DomSanitizer } from '@angular/platform-browser';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import {
  ApexOptionsI,
  visitVsPages,
  weekVisit,
  yearVisit,
} from 'app/core/interfaces/home.interface';
import { HomeService } from 'app/core/services/home.service';
import { UserService } from 'app/core/services/user.service';
import { NotificationsService } from 'app/core/services/notifications.service';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { ToastrService } from '@iqx-limited/ngx-toastr';

@Component({
  selector: 'home',
  templateUrl: './home.html',
  imports: [RouterLink, ClipboardModule, NgApexchartsModule, PermissionComponent],
})
export class Home {
  weekVisitButton = signal<'lastWeek' | 'thisWeek'>('thisWeek');
  yearVisitButton = signal<'lastYear' | 'thisYear'>('thisYear');

  private readonly _notificationsService = inject(NotificationsService);
  private readonly _homeService = inject(HomeService);
  private readonly _userService = inject(UserService);
  private readonly _toastrService = inject(ToastrService);

  readonly permission = PermissionCode;

  // --------------------------------------------------------------------------
  // Signals
  // --------------------------------------------------------------------------

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

  readonly dataServiceVisitVsPages = toSignal(this._homeService.visitVsPages$, {
    initialValue: null,
  });

  readonly dataServiceTop10 = toSignal(this._homeService.top10Pages$, {
    initialValue: [],
  });

  readonly notifications = toSignal(this._notificationsService.notifications$, {
    initialValue: [],
  });

  // --------------------------------------------------------------------------
  // Computed
  // --------------------------------------------------------------------------

  readonly top3Pages = computed(() =>
    [...this.dataServiceTop10()].sort((a, b) => b.visits - a.visits).slice(0, 3),
  );

  readonly unreadNotify = computed(() => this.notifications().length);

  readonly weekVisit = computed<ApexOptionsI>(() => {
    const data = this.dataServiceWeek();
    return data ? weekVisit(data) : {};
  });

  readonly yearVisit = computed<ApexOptionsI>(() => {
    const data = this.dataServiceYear();
    return data ? yearVisit(data) : {};
  });

  readonly visitiVsPageVisit = computed<ApexOptionsI>(() => {
    const data = this.dataServiceVisitVsPages();
    return data ? visitVsPages(data) : {};
  });

  readonly totalVisitWeek = computed(() => {
    const dataServiceWeek = this.dataServiceWeek()![this.weekVisitButton()];
    return dataServiceWeek.micrositie + dataServiceWeek.page + dataServiceWeek.sitie;
  });

  readonly top10PagesColumns: string[] = ['name', 'micrositie', 'lang', 'path', 'visits'];

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
   * Get path santizer
   * @param url 
   * @returns 
   */
  getPath(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

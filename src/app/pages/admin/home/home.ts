import { ClipboardModule } from '@angular/cdk/clipboard';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { ApexOptions } from 'ng-apexcharts';
import { Subject, takeUntil } from 'rxjs';
import {
  CountElementsI,
  Top10PagesI,
  visitVsPages,
  weekVisit,
  WeekVisitI,
  yearVisit,
  YearVisitI,
} from 'app/core/interfaces/home.interface';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { UserI } from 'app/core/interfaces/user.interface';
import { HomeService } from 'app/core/services/home.service';
import { UserService } from 'app/core/services/user.service';
import { NotificationsService } from 'app/core/services/notifications.service';

@Component({
  selector: 'home',
  templateUrl: './home.html',
  imports: [RouterLink, ClipboardModule],
})
export class Home implements OnInit, OnDestroy {
  user!: UserI;
  unreadNotify: number = 0;
  weekVisit: ApexOptions = {};
  yearVisit: ApexOptions = {};
  visitiVsPageVisit: ApexOptions = {};
  countElements!: CountElementsI;
  dataServiceWeek!: WeekVisitI;
  dataServiceYear!: YearVisitI;
  dataServiceVisitVsPages!: YearVisitI;
  dataServiceTop10!: Top10PagesI[];
  top10PagesColumns: string[] = ['name', 'micrositie', 'lang', 'path', 'visits'];
  permission = PermissionCode;

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private _notificationsService = inject(NotificationsService);
  private _homeService = inject(HomeService);
  private _userService = inject(UserService);
  private _toastrService = inject(ToastrService);

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
    // Subscribe to the user service
    this._userService.userLogin$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((userLogin: UserI) => {
        this.user = userLogin;
      });

    // Subscribe to the home service
    this._homeService.countElements$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((countElements) => {
        this.countElements = countElements;
      });

    this._homeService.weekVisit$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((weekVisitData) => {
        this.dataServiceWeek = weekVisitData;
        this.weekVisit = weekVisit(this.dataServiceWeek);
      });

    this._homeService.yearVisit$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((yearVisitData) => {
        this.dataServiceYear = yearVisitData;
        this.yearVisit = yearVisit(this.dataServiceYear);
      });

    this._homeService.top10Pages$.pipe(takeUntil(this._unsubscribeAll)).subscribe((top10Pages) => {
      this.dataServiceTop10 = top10Pages;
    });

    this._homeService.visitVsPages$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((visitVsPagesData) => {
        this.dataServiceVisitVsPages = visitVsPagesData;
        this.visitiVsPageVisit = visitVsPages(this.dataServiceVisitVsPages);
      });

    this._notificationsService.notifications$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((notifications) => {
        this.unreadNotify = notifications.length;
      });
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
   * Valid render permission
   */
  validPermission(code: string) {
    return validAction(code);
  }

  /**
   * Output copy event
   * @param event
   */
  copyEvent(event: true) {
    // Set the alert
    this._toastrService.info('Url Copiada.', 'Aviso');
  }
}

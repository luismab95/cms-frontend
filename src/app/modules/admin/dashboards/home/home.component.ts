import { ClipboardModule } from '@angular/cdk/clipboard';
import {
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { UserI } from 'app/core/user/user.types';
import { HomeService } from 'app/modules/admin/dashboards/home/home.service';
import { PermissionComponent } from 'app/shared/components/permission/permission.component';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { NotificationsService } from '../../../../shared/services/notifications.service';
import {
    CountElementsI,
    Top10PagesI,
    visitVsPages,
    weekVisit,
    WeekVisitI,
    yearVisit,
    YearVisitI,
} from './home.types';

@Component({
    selector: 'home',
    templateUrl: './home.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatIconModule,
        MatButtonModule,
        MatRippleModule,
        MatMenuModule,
        MatTabsModule,
        MatButtonToggleModule,
        NgApexchartsModule,
        MatTableModule,
        RouterLink,
        PermissionComponent,
        MatIconModule,
        ClipboardModule,
        MatTooltipModule,
    ],
})
export class HomeComponent implements OnInit, OnDestroy {
    user: UserI;
    unreadNotify: number = 0;
    weekVisit: ApexOptions = {};
    yearVisit: ApexOptions = {};
    visitiVsPageVisit: ApexOptions = {};
    countElements: CountElementsI;
    dataServiceWeek: WeekVisitI;
    dataServiceYear: YearVisitI;
    dataServiceVisitVsPages: YearVisitI;
    dataServiceTop10: Top10PagesI[];
    top10PagesColumns: string[] = [
        'name',
        'micrositie',
        'lang',
        'path',
        'visits',
    ];
    permission = PermissionCode;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _homeService: HomeService,
        private _userService: UserService,
        private _notificationsService: NotificationsService,
        private _toastrService: ToastrService
    ) {}

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

        this._homeService.top10Pages$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((top10Pages) => {
                this.dataServiceTop10 = top10Pages;
            });

        this._homeService.visitVsPages$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((visitVsPagesData) => {
                this.dataServiceVisitVsPages = visitVsPagesData;
                this.visitiVsPageVisit = visitVsPages(
                    this.dataServiceVisitVsPages
                );
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

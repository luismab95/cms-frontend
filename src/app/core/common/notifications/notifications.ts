import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NotifyI } from 'app/core/interfaces/notification.interface';
import { RoleI } from 'app/core/interfaces/user.interface';
import { NotificationsService } from 'app/core/services/notifications.service';
import { UserService } from 'app/core/services/user.service';
import { Subject, takeUntil, lastValueFrom } from 'rxjs';

@Component({
  selector: 'notifications-component',
  templateUrl: './notifications.html',
  imports: [RouterLink],
})
export class Notifications implements OnInit, OnDestroy {
  @ViewChild('notificationsOrigin') private _notificationsOrigin!: ElementRef<HTMLElement>;
  @ViewChild('notificationsPanel')
  private _notificationsPanel!: TemplateRef<any>;

  notifications!: NotifyI[];
  role!: RoleI;
  unreadCount: number = 0;

  private _overlayRef!: OverlayRef;
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private _changeDetectorRef = inject(ChangeDetectorRef);
  private _notificationsService = inject(NotificationsService);
  private _userService = inject(UserService);
  private _overlay = inject(Overlay);
  private _router = inject(Router);
  private _viewContainerRef = inject(ViewContainerRef);

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
    // Subscribe to notification changes
    this._notificationsService.notifications$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((notifications: NotifyI[]) => {
        // Load the notifications
        this.notifications = notifications;
        this.unreadCount = notifications.length;

        // Mark for check
        this._changeDetectorRef.markForCheck();
      });

    // Subscribe to user changes
    this._userService.role$.pipe(takeUntil(this._unsubscribeAll)).subscribe((role: RoleI) => {
      // Load the notifications
      this.role = role;
      this._notificationsService.joinRoom(this.role.id.toString());

      // Mark for check
      this._changeDetectorRef.markForCheck();
    });

    this._notificationsService.onNotification().subscribe((notification) => {
      this.notifications.unshift(notification);
      this.unreadCount++;
      this._changeDetectorRef.markForCheck();
    });
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();

    // Dispose the overlay
    if (this._overlayRef) {
      this._overlayRef.dispose();
    }
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Open the notifications panel
   */
  openPanel(): void {
    // Return if the notifications panel or its origin is not defined
    if (!this._notificationsPanel || !this._notificationsOrigin) {
      return;
    }

    // Create the overlay if it doesn't exist
    if (!this._overlayRef) {
      this._createOverlay();
    }

    // Attach the portal to the overlay
    this._overlayRef.attach(new TemplatePortal(this._notificationsPanel, this._viewContainerRef));
  }

  /**
   * Close the notifications panel
   */
  closePanel(): void {
    this._overlayRef.detach();
  }

  /**
   * Mark the notification as read and Go to the path
   */
  async goTo(notification: NotifyI) {
    await lastValueFrom(this._notificationsService.update(notification.id));

    // Close the panel
    this.closePanel();

    // Navigate to the path
    if (notification.metadata['micrositieId'] !== null) {
      this._router.navigateByUrl(notification.path, {
        state: {
          id: notification.metadata['id'],
          micrositieId: notification.metadata['micrositieId'],
        },
      });
    } else {
      this._router.navigateByUrl(notification.path, {
        state: { id: notification.metadata['id'] },
      });
    }
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Private methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Create the overlay
   */
  private _createOverlay(): void {
    // Create the overlay
    this._overlayRef = this._overlay.create({
      hasBackdrop: true,
      scrollStrategy: this._overlay.scrollStrategies.block(),
      positionStrategy: this._overlay
        .position()
        .flexibleConnectedTo(this._notificationsOrigin.nativeElement)
        .withLockedPosition(true)
        .withPush(true)
        .withPositions([
          {
            originX: 'start',
            originY: 'bottom',
            overlayX: 'start',
            overlayY: 'top',
          },
          {
            originX: 'start',
            originY: 'top',
            overlayX: 'start',
            overlayY: 'bottom',
          },
          {
            originX: 'end',
            originY: 'bottom',
            overlayX: 'end',
            overlayY: 'top',
          },
          {
            originX: 'end',
            originY: 'top',
            overlayX: 'end',
            overlayY: 'bottom',
          },
        ]),
    });

    // Detach the overlay from the portal on backdrop click
    this._overlayRef.backdropClick().subscribe(() => {
      this._overlayRef.detach();
    });
  }
}

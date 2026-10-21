import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { DatePipe, NgClass } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  TemplateRef,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NotifyI, PageReviewStatus } from '@core/interfaces';
import { NotificationsService, UserService } from '@core/services';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'notifications-component',
  templateUrl: './notifications.html',
  imports: [NgClass, DatePipe],
})
export class Notifications implements OnDestroy {
  private readonly notificationsOrigin =
    viewChild.required<ElementRef<HTMLElement>>('notificationsOrigin');
  private readonly notificationsPanel = viewChild.required<TemplateRef<any>>('notificationsPanel');

  unreadCount = signal<number>(0);
  filterStatus = signal<PageReviewStatus | null>(null);

  private _overlayRef!: OverlayRef;

  private _router = inject(Router);
  private _overlay = inject(Overlay);
  private _destroyRef = inject(DestroyRef);
  private _viewContainerRef = inject(ViewContainerRef);
  private _notificationsService = inject(NotificationsService);
  private _userService = inject(UserService);

  readonly onNotification = toSignal(this._notificationsService.onNotification());
  readonly notifications = this._notificationsService.notifications;
  readonly user = this._userService.userLogin;

  readonly totalPerStatusReview = computed(() => {
    const notifications = this.notifications();
    return {
      approved: notifications.filter((n) => n.metadata['statusReview'] === 'approved').length,
      pending: notifications.filter((n) => n.metadata['statusReview'] === 'pending').length,
      rejected: notifications.filter((n) => n.metadata['statusReview'] === 'rejected').length,
    };
  });
  readonly notificationsFilter = computed(() => {
    if (this.filterStatus() === null) return this.notifications();

    return this.notifications().filter((n) => n.metadata['statusReview'] === this.filterStatus());
  });

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const notifications = this.notifications();
      this.unreadCount.set(notifications.length);
    });

    effect(() => {
      const user = this.user();
      if (!user) return;
      this._notificationsService.joinRoom(user.id!.toString());
    });

    effect(() => {
      const newNotification = this.onNotification();
      const notifications = this.notifications();
      if (!newNotification) return;
      notifications.unshift(newNotification);
      this.notifications.set(notifications);
      this.unreadCount.update((prev) => prev++);
    });
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    if (this._overlayRef) {
      this._overlayRef.dispose();
    }
  }

  /**
   * Open the notifications panel
   */
  openPanel(): void {
    if (!this.notificationsPanel() || !this.notificationsOrigin()) return;
    if (!this._overlayRef) this._createOverlay();
    this._overlayRef.attach(new TemplatePortal(this.notificationsPanel(), this._viewContainerRef));
  }

  /**
   * Close the notifications panel
   */
  closePanel(): void {
    this._overlayRef.detach();
  }

  /**
   * Mark the notification as read and Go to the path
   * @param notification
   */
  async onNotificationAction(notification: NotifyI) {
    await lastValueFrom(this._notificationsService.update(notification.id));
    this.closePanel();

    const statusReview = notification.metadata['statusReview'] as PageReviewStatus;
    const micrositieId = notification.metadata['micrositieId'] as number | null;
    const pageId = notification.metadata['pageId'] as number;
    const pageIdReviewId = notification.metadata['pageIdReviewId'] as number;
    let path = '/admin/content/pages/canvas';
    let state: any = {
      id: pageId,
      micrositieId: micrositieId === null ? 0 : micrositieId,
    };

    if (statusReview === 'pending') {
      path = '/admin/content/review-pages/review';
      state = {
        id: pageIdReviewId,
      };
    }

    if (statusReview === 'approved') {
      path = '/admin/content/pages/detail';
    }

    this._router.navigateByUrl(path, {
      state,
    });
  }

  /**
   * Create the overlay
   */
  private _createOverlay(): void {
    this._overlayRef = this._overlay.create({
      hasBackdrop: true,
      backdropClass: 'bg-transparent',
      scrollStrategy: this._overlay.scrollStrategies.block(),
      positionStrategy: this._overlay
        .position()
        .flexibleConnectedTo(this.notificationsOrigin().nativeElement)
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

    this._overlayRef
      .backdropClick()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => {
        this._overlayRef.detach();
      });
  }

  /**
   * Filter per status review
   * @param status 
   */
  toggleStatusReview(status:PageReviewStatus | null){
    this.filterStatus.set(status);

  }
}

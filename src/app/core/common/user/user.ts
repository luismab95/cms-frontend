import { TemplatePortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import {
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
import { AuthService } from 'app/core/services/auth.service';
import { UserService } from 'app/core/services/user.service';
import { Subject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'user-component',
  templateUrl: './user.html',
  imports: [RouterLink],
})
export class User implements OnInit, OnDestroy {
  @ViewChild('userOrigin') private _userOrigin!: ElementRef<HTMLElement>;
  @ViewChild('userPanel')
  private _userPanel!: TemplateRef<any>;

  private _overlayRef!: OverlayRef;
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private _router = inject(Router);
  private _userService = inject(UserService);
  private _authService = inject(AuthService);
  private _overlay = inject(Overlay);
  private _viewContainerRef = inject(ViewContainerRef);

  readonly user = toSignal(this._userService.userLogin$, { initialValue: null });
  readonly role = toSignal(this._userService.role$, { initialValue: null });

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
    // Subscribe to user changes
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
   * Sign out
   */
  signOut(): void {
    const token = this._authService.accessToken;
    this._authService.signOut();
    this._authService.logout(token).subscribe({
      next: () => {
        this._router.navigate(['/auth/sign-out']);
      },
    });
  }

  /**
   * Open the notifications panel
   */
  openPanel(): void {
    // Return if the notifications panel or its origin is not defined
    if (!this._userPanel || !this._userOrigin) {
      return;
    }

    // Create the overlay if it doesn't exist
    if (!this._overlayRef) {
      this._createOverlay();
    }

    // Attach the portal to the overlay
    this._overlayRef.attach(new TemplatePortal(this._userPanel, this._viewContainerRef));
  }

  /**
   * Close the notifications panel
   */
  closePanel(): void {
    this._overlayRef.detach();
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
        .flexibleConnectedTo(this._userOrigin.nativeElement)
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

import { TemplatePortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  TemplateRef,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService, AuthService } from '@core/services';

@Component({
  selector: 'user-component',
  templateUrl: './user.html',
  imports: [RouterLink],
})
export class User implements OnDestroy {
  private readonly userOrigin = viewChild.required<ElementRef<HTMLElement>>('userOrigin');
  private readonly userPanel = viewChild.required<TemplateRef<any>>('userPanel');

  private _overlayRef!: OverlayRef;

  private readonly _router = inject(Router);
  private readonly _userService = inject(UserService);
  private readonly _authService = inject(AuthService);
  private readonly _overlay = inject(Overlay);
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private readonly _destroyRef = inject(DestroyRef);

  readonly user = this._userService.userLogin;
  readonly role = this._userService.role;

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    if (this._overlayRef) {
      this._overlayRef.dispose();
    }
  }

  /**
   * Sign out
   */
  signOut(): void {
    const token = this._authService.accessToken;
    this._authService.signOut();
    this._authService
      .logout(token)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this._router.navigate(['/auth/sign-out']);
        },
      });
  }

  /**
   * Open the notifications panel
   */
  openPanel(): void {
    if (!this.userPanel() || !this.userOrigin()) return;
    if (!this._overlayRef) this._createOverlay();
    this._overlayRef.attach(new TemplatePortal(this.userPanel(), this._viewContainerRef));
  }

  /**
   * Close the notifications panel
   */
  closePanel(): void {
    this._overlayRef.detach();
  }

  /**
   * Create the overlay
   */
  private _createOverlay(): void {
    this._overlayRef = this._overlay.create({
      hasBackdrop: true,
      scrollStrategy: this._overlay.scrollStrategies.block(),
      positionStrategy: this._overlay
        .position()
        .flexibleConnectedTo(this.userOrigin().nativeElement)
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
}

import { Component, computed, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InitializerService } from '@core/services';
import { InitializerComponent, LoadingBarComponent } from '@shared/components';
import { InactivityTimerService } from '@shared/services';
import AOS from 'aos';

AOS.init({
  disable: 'mobile',
});

@Component({
  imports: [RouterOutlet, LoadingBarComponent, InitializerComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:keypress', ['$event'])
  onActivity(_event: MouseEvent | KeyboardEvent): void {
    this._inactivityTimerService.activityDetected();
  }

  private readonly _inactivityTimerService = inject(InactivityTimerService);
  private readonly _initializerService = inject(InitializerService);

  readonly initializer = this._initializerService.initializer;

  readonly isInitializer = computed(() => {
    const initializer = this.initializer();
    if (initializer === undefined) return false;
    return initializer.status;
  });

  readonly isInitializerPwd = computed(() => {
    const isInitializer = this.isInitializer();
    if (!isInitializer) return false;
    return this.initializer()?.userPwd ?? false;
  });

  /**
   * Constructor
   */
  constructor() {}
}

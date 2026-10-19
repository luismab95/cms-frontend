import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingBarComponent } from '@shared/components';
import { InactivityTimerService } from '@shared/services';
import AOS from 'aos';

AOS.init({
  disable: 'mobile',
});

@Component({
  imports: [RouterOutlet, LoadingBarComponent],
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
  
  /**
   * Constructor
   */
  constructor(private _inactivityTimerService: InactivityTimerService) {}
}

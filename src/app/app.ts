import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InactivityTimerService } from './shared/services/inactivity.service';
import { LoaderComponent } from './shared/components/loader/loader';

@Component({
  imports: [RouterOutlet],
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

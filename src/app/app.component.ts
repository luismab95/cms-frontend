import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InactivityTimerService } from './shared/services/inactivity.service';
import { LoaderComponent } from './shared/components/loader/loader.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [RouterOutlet, LoaderComponent],
})
export class AppComponent {
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

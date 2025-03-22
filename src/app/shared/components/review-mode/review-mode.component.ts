import { Component, ViewEncapsulation } from '@angular/core';
import { FuseAlertComponent } from '@fuse/components/alert';

@Component({
    selector: 'review-mode',
    templateUrl: './review-mode.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [FuseAlertComponent],
})
export class ReviewModeComponent {
    /**
     * Constructor
     */
    constructor() {}

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------
}

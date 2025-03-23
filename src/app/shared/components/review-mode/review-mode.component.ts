import {
    Component,
    EventEmitter,
    Input,
    Output,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { FuseAlertComponent } from '@fuse/components/alert';

@Component({
    selector: 'review-mode',
    templateUrl: './review-mode.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [FuseAlertComponent, MatButtonModule],
})
export class ReviewModeComponent {
    @Input() lastChangeReject: boolean = false;
    @Input() comment: string = 'false';
    @Output() deleteChangeEvent: EventEmitter<boolean> =
        new EventEmitter<boolean>();

    /**
     * Constructor
     */
    constructor() {}

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Delete changes
     */
    deleteChanges() {
        this.deleteChangeEvent.emit(true);
    }
}

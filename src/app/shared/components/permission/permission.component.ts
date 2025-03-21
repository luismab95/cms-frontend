import { Component, Input, ViewEncapsulation } from '@angular/core';
import { FuseAlertComponent } from '@fuse/components/alert';

@Component({
    selector: 'permission',
    templateUrl: './permission.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [FuseAlertComponent],
})
export class PermissionComponent {
    @Input() show: boolean = true;

    /**
     * Constructor
     */
    constructor() {}

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------
}

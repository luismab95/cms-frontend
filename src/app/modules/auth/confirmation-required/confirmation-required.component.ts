import { Component, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { NgOtpInputModule } from 'ng-otp-input';

@Component({
    selector: 'auth-confirmation-required',
    templateUrl: './confirmation-required.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [RouterLink, NgOtpInputModule],
})
export class AuthConfirmationRequiredComponent {
    /**
     * Constructor
     */
    constructor() {}
}

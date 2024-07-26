import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { ParameterI } from 'app/modules/admin/parameters/parameter.interface';
import { findParameter, getLogo } from 'app/shared/utils/parameter.utils';

@Component({
    selector: 'auth',
    templateUrl: './auth.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [],
})
export class AuthComponent implements OnInit {
    @Input() parameters: ParameterI[] = [];

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
    ngOnInit(): void {}

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get value of auth background
     * @returns
     */
    getAuthBackground() {
        return getLogo('LOGO_AUTH_BACKGROUND', this.parameters);
    }

    /**
     * Get company parameters
     * @param code
     * @returns
     */
    getCompanyInfo(code: string) {
        return findParameter(code, this.parameters);
    }
}

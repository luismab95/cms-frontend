import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { ParameterI } from 'app/modules/admin/parameters/parameter.interface';
import { findParameter } from 'app/shared/utils/parameter.utils';
import {
    NgxOtpInputComponent,
    NgxOtpInputComponentOptions,
    NgxOtpStatus,
} from 'ngx-otp-input';

@Component({
    selector: 'otp',
    templateUrl: './otp.component.html',
    styles: `
        .ngx-otp-input-form {
            width: 100%;
            display: flex;
            justify-content: space-between;
        }
        .ngx-otp-input-box {
            min-width: 46px;
            min-height: 46px;
            border-radius: 6px !important;
        }
        .ngx-otp-input-failed {
            border-color: rgba(
                var(--fuse-warn-rgb),
                var(--tw-text-opacity)
            ) !important;
        }
    `,
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [NgxOtpInputComponent],
})
export class OtpComponent implements OnInit, OnChanges {
    @ViewChild('otpInput') ngxOtp: NgxOtpInputComponent | undefined;
    @Input() parameters: ParameterI[] = [];
    @Input() reset: boolean | undefined;
    @Input() hasError: boolean = false;
    @Output() otpEvent: EventEmitter<string> = new EventEmitter<string>();

    otpInputConfig: NgxOtpInputComponentOptions | undefined;
    patterNumber = new RegExp(/\d+/g);
    patterLetters = new RegExp(/\b[a-zA-Z]+\b/g);
    patterNumberLetters = new RegExp(/\b[a-zA-Z0-9]+\b/g);
    otpLong: string = '';
    otpType: string = '';
    status = NgxOtpStatus;

    /**
     * Constructor
     */
    constructor() {}

    /**
     * On init
     */
    ngOnInit(): void {
        // Get OTP parameters
        this.otpLong = findParameter('OTP_LONG', this.parameters).value;
        this.otpType = findParameter('OTP_TYPE', this.parameters).value;

        this.otpInputConfig = {
            otpLength: Number(this.otpLong),
        };

        switch (this.otpType) {
            case 'NUMBER':
                this.otpInputConfig['pattern'] = this.patterNumber;
                break;
            case 'LETTER':
                this.otpInputConfig['pattern'] = this.patterLetters;
                break;
            case 'COMBINED':
                this.otpInputConfig['pattern'] = this.patterNumberLetters;
                break;
        }
    }

    /**
     * On Changes
     * @param changes
     */
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['reset']?.currentValue == true) this.clear();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get value of OTP
     * @param otp
     */
    getOtp(otp: string) {
        this.otpEvent.emit(otp);
    }

    /**
     * Clear otp
     */
    clear() {
        if (this.ngxOtp !== undefined) this.ngxOtp.reset();
    }

    /**
     * Get status
     * @returns
     */
    getStatus() {
        return this.hasError ? 'failed' : 'success';
    }
}

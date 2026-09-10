import { Component, computed, input, OnInit, output, ViewChild } from '@angular/core';
import { ParameterI } from 'app/core/interfaces/parameter.interface';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { NgxOtpInputComponent } from 'ngx-otp-input';

@Component({
  selector: 'otp-component',
  templateUrl: './otp.html',
  imports: [NgxOtpInputComponent],
})
export class OtpComponent implements OnInit {
  @ViewChild('otpInput') ngxOtp: NgxOtpInputComponent | undefined;

  parameters = input.required<ParameterI[]>();
  hasError = input.required<boolean>();
  otpEvent = output<string>();

  otpInputConfig!: { otpLength: number; inputMode: string; autoFocus: boolean; regexp: RegExp };
  patterNumber = new RegExp(/\d+/g);
  patterLetters = new RegExp(/\b[a-zA-Z]+\b/g);
  patterNumberLetters = new RegExp(/\b[a-zA-Z0-9]+\b/g);
  otpLong: string = '';
  otpType: string = '';

  getStatus = computed(() => {
    const hasError = this.hasError();
    return hasError ? 'error' : 'success';
  });

  /**
   * Constructor
   */
  constructor() {}

  /**
   * On init
   */
  ngOnInit(): void {
    // Get OTP parameters
    this.otpLong = findParameter('OTP_LONG', this.parameters())?.value ?? '6';
    this.otpType = findParameter('OTP_TYPE', this.parameters())?.value ?? 'NUMBER';

    this.otpInputConfig = {
      otpLength: Number(this.otpLong),
      inputMode: 'text',
      autoFocus: true,
      regexp: this.patterNumber,
    };

    switch (this.otpType) {
      case 'NUMBER':
        this.otpInputConfig.regexp = this.patterNumber;
        break;
      case 'LETTER':
        this.otpInputConfig.regexp = this.patterLetters;
        break;
      case 'COMBINED':
        this.otpInputConfig.regexp = this.patterNumberLetters;
        break;
    }
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
}

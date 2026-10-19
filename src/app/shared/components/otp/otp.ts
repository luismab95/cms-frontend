import { Component, computed, input, OnInit, output, signal, viewChild } from '@angular/core';
import { ParameterI } from '@core/interfaces';
import { findParameter } from '@shared/utils';
import { NgxOtpInputComponent } from 'ngx-otp-input';

@Component({
  selector: 'otp-component',
  templateUrl: './otp.html',
  imports: [NgxOtpInputComponent],
})
export class OtpComponent implements OnInit {
  private readonly otpInput = viewChild.required<NgxOtpInputComponent>('otpInput');

  parameters = input.required<ParameterI[]>();
  hasError = input.required<boolean>();
  otpEvent = output<string>();

  otpInputConfig = signal<{
    otpLength: number;
    inputMode: string;
    autoFocus: boolean;
    regexp: RegExp;
  } | null>(null);
  patterNumber = new RegExp(/\d+/g);
  patterLetters = new RegExp(/\b[a-zA-Z]+\b/g);
  patterNumberLetters = new RegExp(/\b[a-zA-Z0-9]+\b/g);
  otpLong: string = '';
  otpType: string = '';

  readonly getStatus = computed(() => {
    const hasError = this.hasError();
    return hasError ? 'error' : 'success';
  });

  /**
   * On init
   */
  ngOnInit(): void {
    this.otpLong = findParameter('OTP_LONG', this.parameters())?.value ?? '6';
    this.otpType = findParameter('OTP_TYPE', this.parameters())?.value ?? 'NUMBER';
    this.otpInputConfig.set({
      otpLength: Number(this.otpLong),
      inputMode: 'text',
      autoFocus: true,
      regexp: this.patterNumber,
    });

    switch (this.otpType) {
      case 'NUMBER':
        this.otpInputConfig.update((prev) => ({ ...prev!, regexp: this.patterNumber }));
        break;
      case 'LETTER':
        this.otpInputConfig.update((prev) => ({ ...prev!, regexp: this.patterLetters }));
        break;
      case 'COMBINED':
        this.otpInputConfig.update((prev) => ({ ...prev!, regexp: this.patterNumberLetters }));
        break;
    }
  }

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
    if (!this.otpInput()) return;
    this.otpInput().reset();
  }
}

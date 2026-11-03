import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from '@shared/components';

@Component({
  selector: 'error-500',
  templateUrl: './error-500.html',
  imports: [RouterLink, ErrorComponent],
})
export class Error500 {}

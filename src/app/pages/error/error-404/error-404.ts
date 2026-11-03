import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from '@shared/components';

@Component({
  selector: 'error-404',
  templateUrl: './error-404.html',
  imports: [RouterLink, ErrorComponent],
})
export class Error404 {}

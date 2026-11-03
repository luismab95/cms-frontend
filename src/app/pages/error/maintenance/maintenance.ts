import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorComponent } from '@shared/components';

@Component({
  selector: 'maintenance',
  templateUrl: './maintenance.html',
  imports: [RouterLink, ErrorComponent],
})
export class Maintenance {}

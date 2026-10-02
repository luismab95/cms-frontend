import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingBarComponent } from '@shared/components';

@Component({
  selector: 'empty-layout',
  templateUrl: './empty.html',
  imports: [RouterOutlet, LoadingBarComponent],
})
export class EmptyLayout {}

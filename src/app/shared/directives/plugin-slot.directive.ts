import { Directive, ViewContainerRef, inject } from '@angular/core';

@Directive({
  selector: '[pluginSlot]',
})
export class PluginSlotDirective {
  readonly viewContainer = inject(ViewContainerRef);
}

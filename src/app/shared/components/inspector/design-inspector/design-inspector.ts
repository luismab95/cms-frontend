import { Component, effect, input, signal } from '@angular/core';
import { NgClass, TitleCasePipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EditorComponent } from 'ngx-monaco-editor-v2';
import {
  ResponsiveCssJsonI,
  DesignModeT,
  DeviceT,
  StateElementT,
  LayoutStylesI,
} from 'app/shared/interfaces/design.interface';
import { cssToJson } from 'app/shared/utils/grid.utils';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { DesignLayoutComponent } from 'app/shared/components/dynamic-form/layout/layout';

@Component({
  selector: 'design-inspector-component',
  templateUrl: './design-inspector.html',
  imports: [
    FormsModule,
    EditorComponent,
    TooltipDirective,
    ReactiveFormsModule,
    NgClass,
    TitleCasePipe,
    DesignLayoutComponent,
  ],
})
export class DesignInspectorComponent {
  css = input<string>('');
  editorOptions = {
    theme: 'vs',
    language: 'css',
    minimap: { enabled: false },
  };

  cssControl: FormControl = new FormControl();

  cssJson = signal<ResponsiveCssJsonI>({
    selector: '',
    mobile: { base: {}, states: {} },
    tablet: { base: {}, states: {} },
    desktop: { base: {}, states: {} },
  });

  designMode = signal<DesignModeT>('UI');
  designBreakpoint = signal<DeviceT>('mobile');
  stateElement = signal<StateElementT>('normal');

  readonly states: StateElementT[] = ['normal', ':hover', ':focus', ':active', ':disabled'];

  readonly layoutValue = signal<LayoutStylesI>({
    display: 'flex',
    width: 'auto',
    height: 'auto',
    minWidth: '120px',
    maxWidth: 'none',
    minHeight: '44px',
    maxHeight: 'none',
    boxSizing: 'border-box',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'stretch',
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 'auto',
    flex: '0 1 auto',
    alignSelf: 'auto',
    gap: '8px',
    rowGap: '8px',
    columnGap: '8px',
  });

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      {
        const css = this.css();
        this.cssControl.setValue(css);
        this.cssJson.set(cssToJson(css));
      }
    });
  }

  /**
   * toggle mode design
   * @param mode
   */
  toggleDesignMode(mode: DesignModeT) {
    this.designMode.set(mode);
  }

  /**
   * toggle design breakpoint
   * @param mode
   */
  toggleDesignBreakpoint(device: DeviceT) {
    this.designBreakpoint.set(device);
  }
}

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
  SpacingStylesI,
  TypographyStylesI,
  BackgroundStylesI,
  BorderStylesI,
  PositionStylesI,
  EffectsStylesI,
  OverflowStylesI,
  InteractionStylesI,
} from 'app/shared/interfaces/design.interface';
import { cssToJson } from 'app/shared/utils/grid.utils';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { DesignLayoutComponent } from 'app/shared/components/dynamic-form/layout/layout';
import { DesignSpacingComponent } from 'app/shared/components/dynamic-form/spacing/spacing';
import { DesignTypographyComponent } from 'app/shared/components/dynamic-form/typography/typography';
import { DesignBackgroundComponent } from 'app/shared/components/dynamic-form/background/background';
import { DesignBorderComponent } from 'app/shared/components/dynamic-form/border/border';
import { DesignPositionComponent } from 'app/shared/components/dynamic-form/position/position';
import { DesignEffectsComponent } from 'app/shared/components/dynamic-form/effect/effect';
import { DesignOverflowComponent } from 'app/shared/components/dynamic-form/overflow/overflow';
import { DesignInteractionComponent } from 'app/shared/components/dynamic-form/interaction/interaction';

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
    DesignSpacingComponent,
    DesignTypographyComponent,
    DesignBackgroundComponent,
    DesignBorderComponent,
    DesignPositionComponent,
    DesignPositionComponent,
    DesignEffectsComponent,
    DesignOverflowComponent,
    DesignInteractionComponent,
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

  readonly states: StateElementT[] = [
    'normal',
    ':hover',
    ':focus',
    ':active',
    ':disabled',
    ':visited',
  ];

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

  readonly designValue = signal<SpacingStylesI>({
    margin: '0',
    marginTop: '0',
    marginRight: '0',
    marginBottom: '0',
    marginLeft: '0',
    padding: '12px 24px',
    paddingTop: '12px',
    paddingRight: '24px',
    paddingBottom: '12px',
    paddingLeft: '24px',
  });

  readonly typographyValue = signal<TypographyStylesI>({
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '1.5',
    letterSpacing: '0',
    color: '#ffffff',
    textAlign: 'center',
    textTransform: 'uppercase',
    textDecoration: 'none',
    fontStyle: 'normal',
    whiteSpace: 'nowrap',
    wordBreak: 'normal',
    textOverflow: 'clip',
  });

  readonly backgroundValue = signal<BackgroundStylesI>({
    backgroundColor: '#6200ea',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'scroll',
    backgroundClip: 'border-box',
  });

  readonly borderValue = signal<BorderStylesI>({
    border: 'none',
    borderWidth: '0',
    borderStyle: 'none',
    borderColor: '#6200ea',
    borderTop: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    borderLeft: 'none',
    borderRadius: '50px',
    borderTopLeftRadius: '50px',
    borderTopRightRadius: '50px',
    borderBottomRightRadius: '50px',
    borderBottomLeftRadius: '50px',
  });

  readonly positionValue = signal<PositionStylesI>({
    position: 'relative',
    top: 'auto',
    right: 'auto',
    bottom: 'auto',
    left: 'auto',
    zIndex: '1',
  });

  readonly effectValue = signal<EffectsStylesI>({
    opacity: 1,
    boxShadow: 'none',
    transform: 'none',
    transition: 'all 0.3s ease',
    filter: 'none',
    backdropFilter: 'none',
  });

  readonly overflowValue = signal<OverflowStylesI>({
    overflow: 'visible',
    overflowX: 'visible',
    overflowY: 'visible',
  });

  readonly interactionValue = signal<InteractionStylesI>({
    cursor: 'pointer',
    pointerEvents: 'auto',
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

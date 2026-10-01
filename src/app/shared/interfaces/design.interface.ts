export type DeviceT = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveCssJsonI {
  selector: string;
  mobile: Record<string, string>;
  tablet: Record<string, string>;
  desktop: Record<string, string>;
  states: Partial<Record<StateElementT, Record<string, string>>>;
}

export type DesignModeT = 'UI' | 'CODE';
export type StateElementT = 'normal' | ':hover' | ':focus' | ':active' | ':disabled' | ':visited';
export type DesignSectionT =
  | 'layout'
  | 'spacing'
  | 'typography'
  | 'background'
  | 'border'
  | 'position'
  | 'effect'
  | 'overflow'
  | 'interaction';
export type DisplayT =
  | 'block'
  | 'inline'
  | 'inline-block'
  | 'flex'
  | 'inline-flex'
  | 'grid'
  | 'inline-grid'
  | 'none'
  | '';
export type FlexDirectionT = 'row' | 'row-reverse' | 'column' | 'column-reverse' | '';
export type FlexWrapT = 'nowrap' | 'wrap' | 'wrap-reverse' | '';
export type JustifyContentT =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'
  | 'stretch'
  | '';
export type AlignItemsT =
  'normal' | 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | '';
export type AlignContentT =
  | 'normal'
  | 'stretch'
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'
  | '';
export type AlignSelfT =
  'auto' | 'normal' | 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | '';
export type BoxSizingT = 'unset' | 'border-box' | 'content-box' | '';

export interface LayoutStylesI {
  display?: DisplayT;
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
  boxSizing?: BoxSizingT;
  flexDirection?: FlexDirectionT;
  flexWrap?: FlexWrapT;
  justifyContent?: JustifyContentT;
  alignItems?: AlignItemsT;
  alignContent?: AlignContentT;
  flexGrow?: string;
  flexShrink?: string;
  flexBasis?: string;
  flex?: string;
  alignSelf?: AlignSelfT;
  gap?: string;
  rowGap?: string;
  columnGap?: string;
}

export interface SpacingStylesI {
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
}

export type TextAlignT = 'left' | 'center' | 'right' | 'justify' | '';
export type TextTransformT = 'none' | 'uppercase' | 'lowercase' | 'capitalize' | '';
export type TextDecorationT = 'none' | 'underline' | 'overline' | 'line-through' | '';
export type FontStyleT = 'normal' | 'italic' | 'oblique' | '';
export type WhiteSpaceT = 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line' | '';
export type WordBreakT = 'normal' | 'break-all' | 'break-word' | '';
export type TextOverflowT = 'clip' | 'ellipsis' | '';
export type FontFamilyCategoryT =
  | 'sans-serif'
  | 'serif'
  | 'monospace'
  | 'display'
  | 'cursive';
export interface FontFamilyOptionI {
  label: string;
  value: string;
  category: FontFamilyCategoryT;
}
export interface TypographyStylesI {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  color?: string;
  textAlign?: TextAlignT;
  textTransform?: TextTransformT;
  textDecoration?: TextDecorationT;
  fontStyle?: FontStyleT;
  whiteSpace?: WhiteSpaceT;
  wordBreak?: WordBreakT;
  textOverflow?: TextOverflowT;
}

export type BackgroundSizeT = 'auto' | 'cover' | 'contain' | '';
export type BackgroundPositionT = 'left' | 'center' | 'right' | 'top' | 'bottom' | '';
export type BackgroundRepeatT = 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat' | '';
export type BackgroundAttachmentT = 'scroll' | 'fixed' | 'local' | '';
export type BackgroundClipT = 'border-box' | 'padding-box' | 'content-box' | '';
export interface BackgroundStylesI {
  backgroundColor?: string;
  backgroundSize?: BackgroundSizeT;
  backgroundPosition?: BackgroundPositionT;
  backgroundRepeat?: BackgroundRepeatT;
  backgroundAttachment?: BackgroundAttachmentT;
  backgroundClip?: BackgroundClipT;
}

export interface BorderStylesI {
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderTopLeftRadius?: string;
  borderTopRightRadius?: string;
  borderBottomRightRadius?: string;
  borderBottomLeftRadius?: string;
}
export type PositionT = 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky' | '';
export interface PositionStylesI {
  position?: PositionT;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: string;
}

export type BoxShadowT = 'none' | 'weak' | 'medium' | 'strong' | '';
export interface EffectsStylesI {
  opacity?: string;
  boxShadow?: BoxShadowT;
  transform?: string;
  transition?: string;
  filter?: string;
  backdropFilter?: string;
}

export type OverflowT = 'visible' | 'hidden' | 'scroll' | 'auto' | '';
export interface OverflowStylesI {
  overflow?: OverflowT;
  overflowX?: OverflowT;
  overflowY?: OverflowT;
}

export type CursorT =
  | 'auto'
  | 'default'
  | 'pointer'
  | 'move'
  | 'text'
  | 'wait'
  | 'help'
  | 'not-allowed'
  | 'grab'
  | 'grabbing'
  | 'crosshair'
  | 'zoom-in'
  | 'zoom-out'
  | '';
export type PointerEventsT = 'auto' | 'none' | '';

export interface InteractionStylesI {
  cursor?: CursorT;
  pointerEvents?: PointerEventsT;
}

export type CanvasNodeTypeT = 'container' | 'section' | 'row' | 'column' | 'element';
export type StyleCategoryT =
  | 'layout'
  | 'spacing'
  | 'typography'
  | 'background'
  | 'border'
  | 'position'
  | 'effects'
  | 'overflow'
  | 'interaction';
export type StylePermissionsT = Record<StyleCategoryT, boolean>;

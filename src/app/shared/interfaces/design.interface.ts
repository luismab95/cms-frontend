export type DeviceT = 'mobile' | 'tablet' | 'desktop';

export interface StyleConfigI {
  base: Record<string, string>;
  states: Record<string, Record<string, string>>;
}

export interface ResponsiveCssJsonI {
  selector: string;
  mobile: StyleConfigI;
  tablet: StyleConfigI;
  desktop: StyleConfigI;
}

export type DesignModeT = 'UI' | 'CODE';
export type StateElementT = 'normal' | ':hover' | ':focus' | ':active' | ':disabled' | ':visited';

export type DisplayT =
  'block' | 'inline' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'inline-grid' | 'none';
export type FlexDirectionT = 'row' | 'row-reverse' | 'column' | 'column-reverse';
export type FlexWrapT = 'nowrap' | 'wrap' | 'wrap-reverse';
export type JustifyContentT =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'
  | 'stretch';
export type AlignItemsT = 'normal' | 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline';
export type AlignContentT =
  | 'normal'
  | 'stretch'
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';
export type AlignSelfT =
  'auto' | 'normal' | 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline';
export interface LayoutStylesI {
  display: DisplayT;
  width: string;
  height: string;
  minWidth: string;
  maxWidth: string;
  minHeight: string;
  maxHeight: string;
  boxSizing: 'border-box' | 'content-box';
  flexDirection: FlexDirectionT;
  flexWrap: FlexWrapT;
  justifyContent: JustifyContentT;
  alignItems: AlignItemsT;
  alignContent: AlignContentT;
  flexGrow: number;
  flexShrink: number;
  flexBasis: string;
  flex: string;
  alignSelf: AlignSelfT;
  gap: string;
  rowGap: string;
  columnGap: string;
}

export interface SpacingStylesI {
  margin: string;
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
  padding: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
}

export type TextAlignT = 'left' | 'center' | 'right' | 'justify';
export type TextTransformT = 'none' | 'uppercase' | 'lowercase' | 'capitalize';
export type TextDecorationT = 'none' | 'underline' | 'overline' | 'line-through';
export type FontStyleT = 'normal' | 'italic' | 'oblique';
export type WhiteSpaceT = 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line';
export type WordBreakT = 'normal' | 'break-all' | 'break-word';
export type TextOverflowT = 'clip' | 'ellipsis';
export interface TypographyStylesI {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  color: string;
  textAlign: TextAlignT;
  textTransform: TextTransformT;
  textDecoration: TextDecorationT;
  fontStyle: FontStyleT;
  whiteSpace: WhiteSpaceT;
  wordBreak: WordBreakT;
  textOverflow: TextOverflowT;
}

export type BackgroundSizeT = 'auto' | 'cover' | 'contain';
export type BackgroundPositionT = 'left' | 'center' | 'right' | 'top' | 'bottom';
export type BackgroundRepeatT = 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';
export type BackgroundAttachmentT = 'scroll' | 'fixed' | 'local';
export type BackgroundClipT = 'border-box' | 'padding-box' | 'content-box';
export interface BackgroundStylesI {
  backgroundColor: string;
  backgroundSize: BackgroundSizeT;
  backgroundPosition: BackgroundPositionT;
  backgroundRepeat: BackgroundRepeatT;
  backgroundAttachment: BackgroundAttachmentT;
  backgroundClip: BackgroundClipT;
}

export type BorderStyleT = 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
export interface BorderStylesI {
  border: string;
  borderWidth: string;
  borderStyle: BorderStyleT;
  borderColor: string;
  borderTop: string;
  borderRight: string;
  borderBottom: string;
  borderLeft: string;
  borderRadius: string;
  borderTopLeftRadius: string;
  borderTopRightRadius: string;
  borderBottomRightRadius: string;
  borderBottomLeftRadius: string;
}
export type PositionT = 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
export interface PositionStylesI {
  position: PositionT;
  top: string;
  right: string;
  bottom: string;
  left: string;
  zIndex: string;
}

export type BoxShadowT = 'none' | 'weak' | 'medium' | 'strong';
export interface EffectsStylesI {
  opacity: number;
  boxShadow: BoxShadowT;
  transform: string;
  transition: string;
  filter: string;
  backdropFilter: string;
}

export type OverflowT = 'visible' | 'hidden' | 'scroll' | 'auto';
export interface OverflowStylesI {
  overflow: OverflowT;
  overflowX: OverflowT;
  overflowY: OverflowT;
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
  | 'zoom-out';
export type PointerEventsT = 'auto' | 'none';

export interface InteractionStylesI {
  cursor: CursorT;
  pointerEvents: PointerEventsT;
}

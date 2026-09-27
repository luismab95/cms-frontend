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
export type StateElementT = 'normal' | ':hover' | ':focus' | ':active' | ':disabled';
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
  // Flex container
  flexDirection: FlexDirectionT;
  flexWrap: FlexWrapT;
  justifyContent: JustifyContentT;
  alignItems: AlignItemsT;
  alignContent: AlignContentT;
  // Flex item
  flexGrow: number;
  flexShrink: number;
  flexBasis: string;
  flex: string;
  alignSelf: AlignSelfT;
  // Flex / Grid
  gap: string;
  rowGap: string;
  columnGap: string;
}

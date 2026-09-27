import { CanvasT } from 'app/core/interfaces/page.interface';
import { ElementDataI } from './element.interface';

export interface SelectedItemsInGridI {
  page: PageElementsConfigI | null;
  section: SectionI | null;
  row: RowI | null;
  column: ColumnI | null;
  element: ElementI | null;
  canvas: CanvasT;
}

export interface PageElementsConfigI {
  css: string;
  config: { [key: string]: any };
}

export interface PageElementsI extends PageElementsConfigI {
  data: SectionI[];
  title?: string;
}

export interface ElementI {
  uuid: string;
  name: string;
  css: string;
  config: { [key: string]: any };
  text: { [key: string]: any };
  dataText?: ElementDataI[];
}

export interface ColumnI {
  uuid: string;
  css: string;
  config: { [key: string]: any };
  element: ElementI | null;
}

export interface RowI {
  uuid: string;
  css: string;
  config: { [key: string]: any };
  columns: ColumnI[];
}

export interface SectionI {
  uuid: string;
  css: string;
  config: { [key: string]: any };
  rows: RowI[];
}

export interface HistoryCMSI {
  header: PageElementsI | null;
  body: PageElementsI | null;
  footer: PageElementsI | null;
}

export interface HistoryChangeI {
  previous: HistoryCMSI;
  next: HistoryCMSI;
}


// {
//   "id": "tvF2MdlE",
//   "type": "button",
//   "content": {
//     "text": "Comprar ahora"
//   },
//   "styles": {
//     "layout": {
//       "display": "flex",
//       "width": "auto",
//       "height": "auto",
//       "minWidth": "120px",
//       "maxWidth": "none",
//       "minHeight": "44px",
//       "maxHeight": "none",
//       "boxSizing": "border-box",

//       "flexDirection": "row",
//       "flexWrap": "nowrap",
//       "flexGrow": 0,
//       "flexShrink": 1,
//       "flexBasis": "auto",
//       "flex": "0 1 auto",

//       "justifyContent": "center",
//       "alignItems": "center",
//       "alignContent": "stretch",
//       "alignSelf": "auto",

//       "gap": "8px",
//       "rowGap": "8px",
//       "columnGap": "8px"
//     },

//     "spacing": {
//       "margin": "0",
//       "marginTop": "0",
//       "marginRight": "0",
//       "marginBottom": "0",
//       "marginLeft": "0",

//       "padding": "12px 24px",
//       "paddingTop": "12px",
//       "paddingRight": "24px",
//       "paddingBottom": "12px",
//       "paddingLeft": "24px"
//     },

//     "background": {
//       "backgroundColor": "#6200ea",
//       "backgroundImage": "none",
//       "backgroundSize": "cover",
//       "backgroundPosition": "center",
//       "backgroundRepeat": "no-repeat",
//       "backgroundAttachment": "scroll",
//       "backgroundClip": "border-box",
//       "backgroundBlendMode": "normal"
//     },

//     "border": {
//       "border": "none",
//       "borderWidth": "0",
//       "borderStyle": "none",
//       "borderColor": "#6200ea",

//       "borderTop": "none",
//       "borderRight": "none",
//       "borderBottom": "none",
//       "borderLeft": "none",

//       "borderTopWidth": "0",
//       "borderRightWidth": "0",
//       "borderBottomWidth": "0",
//       "borderLeftWidth": "0",

//       "borderRadius": "50px",
//       "borderTopLeftRadius": "50px",
//       "borderTopRightRadius": "50px",
//       "borderBottomRightRadius": "50px",
//       "borderBottomLeftRadius": "50px"
//     },

//     "typography": {
//       "fontFamily": "Inter, sans-serif",
//       "fontSize": "16px",
//       "fontWeight": 600,
//       "lineHeight": "1.5",
//       "letterSpacing": "0",

//       "color": "#ffffff",

//       "textAlign": "center",
//       "textTransform": "uppercase",
//       "textDecoration": "none",
//       "fontStyle": "normal",

//       "whiteSpace": "nowrap",
//       "wordBreak": "normal",
//       "textOverflow": "clip"
//     },

//     "position": {
//       "position": "relative",
//       "top": "auto",
//       "right": "auto",
//       "bottom": "auto",
//       "left": "auto",
//       "zIndex": 1
//     },

//     "effects": {
//       "opacity": 1,
//       "boxShadow": "none",
//       "transform": "none",
//       "transition": "all 0.3s ease",
//       "filter": "none",
//       "backdropFilter": "none"
//     },

//     "overflow": {
//       "overflow": "visible",
//       "overflowX": "visible",
//       "overflowY": "visible"
//     },

//     "interaction": {
//       "cursor": "pointer",
//       "pointerEvents": "auto"
//     }
//   },

//   "states": {
//     "hover": {
//       "background": {
//         "backgroundColor": "#3700b3"
//       },
//       "effects": {
//         "transform": "translateY(-1px)",
//         "boxShadow": "0 4px 10px rgba(0, 0, 0, 0.15)"
//       }
//     },

//     "focus": {
//       "border": {
//         "borderColor": "#6200ea"
//       },
//       "effects": {
//         "boxShadow": "0 0 0 4px rgba(98, 0, 234, 0.3)"
//       }
//     },

//     "active": {
//       "background": {
//         "backgroundColor": "#6200ea"
//       },
//       "effects": {
//         "transform": "scale(0.98)"
//       }
//     },

//     "disabled": {
//       "effects": {
//         "opacity": 0.5
//       },
//       "interaction": {
//         "cursor": "not-allowed",
//         "pointerEvents": "none"
//       }
//     }
//   }
// }

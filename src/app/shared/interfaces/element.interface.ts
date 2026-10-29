import { RegisteredFieldTypes } from '@ng-forge/dynamic-forms';

export type ElementKindT = 'simple' | 'composite';
export interface ChildrenSchemaI {
  slot: string;
  elementId: number;
}

export interface ElementCMSI {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  css: string;
  style: string;
  config: {
    [key: string]: any;
  };
  text: {
    [key: string]: any;
  };
  status: boolean;
  type: RegisteredFieldTypes[];
  dataText?: ElementDataI[];
  kind: ElementKindT;
  childrenSchema: ChildrenSchemaI[];
  childrens: ElementCMSI[];
}

export interface ElementDataI {
  [key: string]: string;
}

export interface LanguageFormData {
  languageId: string;
  [key: string]: string;
}

export interface LanguagesFormModel {
  languages: LanguageFormData[];
}

export interface PluginPropertiesI {
  config: Record<string, any>;
  text: Record<string, any>;
  uuid: string;
  name: string;
  dataServices: PluginDataI;
  class: string;
  styles: string;
  kind: ElementKindT;
  lang: string;
  urlStatics: string;
  slot: string;
  children: PluginPropertiesI[];
}

export interface PluginDataI {
  service: any;
  customService: any;
}

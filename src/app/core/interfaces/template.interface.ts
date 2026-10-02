import { PageElementsI } from '@shared/interfaces';

export interface TemplateI {
  id?: number;
  name: string;
  description: string;
  mongoI?: string;
  status?: boolean;
  data?: TemplateDataMongoI;
  draft?: TemplateDataMongoI | null;
}

export interface TemplateDataMongoI {
  header: PageElementsI;
  footer: PageElementsI;
}

export interface TemplateMongoI {
  data: TemplateDataMongoI;
}

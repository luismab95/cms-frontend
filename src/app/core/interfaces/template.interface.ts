import { PageElementsI } from '@shared/interfaces';
import { ReviewPageI } from './page.interface';

export interface TemplateI {
  id?: number;
  name: string;
  description: string;
  mongoI?: string;
  status?: boolean;
  data?: TemplateDataMongoI;
  draft?: TemplateDataMongoI | null;
  reviewTemplate?: ReviewPageI;
}

export interface TemplateDataMongoI {
  header: PageElementsI;
  footer: PageElementsI;
}

export interface TemplateMongoI {
  data: TemplateDataMongoI;
}

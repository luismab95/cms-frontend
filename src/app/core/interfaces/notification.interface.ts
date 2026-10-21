export interface NotifyI {
  id: number;
  message: string;
  metadata: { [key: string]: any };
  userId: number;
  readStatus: boolean;
  createdAt: string;
}

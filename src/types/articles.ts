import type Publisher from "./publisher";

export default interface Article {
  id: string;
  uuid?: string;
  publisherId: string;
  userId: string;
  title: string;
  snippet: string;
  isRead?: boolean;
  internalDate: string;
  publisher?: Publisher;
  content?: string;
  createdAt?: Date;
  updatedAt?: Date | null;
}

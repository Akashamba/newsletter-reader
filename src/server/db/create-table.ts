import { pgTableCreator } from "drizzle-orm/pg-core";

export const createTableWithPrefix = pgTableCreator(
  (name) => `newsletter-reader_${name}`,
);

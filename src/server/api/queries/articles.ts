// /server/db/queries/articles.ts
import { and, desc, eq } from "drizzle-orm";
import { articles } from "~/server/db/schema";
import { db } from "~/server/db";

interface GetArticleOptions {
  isUnread?: boolean;
  limit?: number;
}

export async function getArticles(
  userId: string,
  opts: GetArticleOptions = { isUnread: true, limit: 10 },
) {
  return db.query.articles.findMany({
    columns: { content: false, createdAt: false, updatedAt: false },
    where: opts.isUnread
      ? and(eq(articles.userId, userId), eq(articles.isRead, false))
      : eq(articles.userId, userId),
    with: {
      publisher: {
        columns: {
          name: true,
          emailAddress: true,
          id: true,
        },
      },
    },
    limit: opts.limit,
    orderBy: desc(articles.internalDate),
  });
}

export async function getArticlesByPublisher(
  userId: string,
  publisherId: string,
) {
  return db.query.articles.findMany({
    where: and(
      eq(articles.userId, userId),
      eq(articles.publisherId, publisherId),
    ),
    limit: 10,
  });
}

export async function getArticleByUuid(userId: string, uuid: string) {
  return db
    .select()
    .from(articles)
    .where(and(eq(articles.userId, userId), eq(articles.uuid, uuid)));
}

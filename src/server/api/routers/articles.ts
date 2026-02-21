import { TRPCError } from "@trpc/server";
import { inArray } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { articles, publishers, type InsertArticle } from "~/server/db/schema";
import {
  getArticleByUuid,
  getArticles,
  getArticlesByPublisher,
} from "../queries/articles";
import type { gmail_v1 } from "googleapis";
import { db } from "../../db";

function base64UrlToUtf8(input: string) {
  const base64 = input
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(input.length / 4) * 4, "=");

  return Buffer.from(base64, "base64").toString("utf8");
}

function getMessageContent(payload: gmail_v1.Schema$MessagePart) {
  let html = "";
  let plaintext = "";

  if (payload.parts) {
    // scan through all parts
    payload.parts.forEach((p: gmail_v1.Schema$MessagePart) => {
      // find and save the largest html part
      if (p.mimeType === "text/html") {
        const newHtml = base64UrlToUtf8(p.body?.data ?? "");
        if (newHtml.length > html.length) {
          html = newHtml;
        }
      }

      // find and save the largest plaintext part
      if (p.mimeType === "text/plain") {
        const newPlaintext = base64UrlToUtf8(p.body?.data ?? "");
        if (newPlaintext.length > plaintext.length) {
          plaintext = newPlaintext;
        }
      }
    });
  }

  // preferred order for content: html > plaintext > payload.body.data > ""
  if (html.length > 0) {
    return html;
  } else if (plaintext.length > 0) {
    return plaintext;
  } else {
    if (payload.body?.data) {
      return base64UrlToUtf8(payload.body.data);
    } else {
      return "";
    }
  }
}

async function parseFullMessage(
  fullMessage: gmail_v1.Schema$Message,
  userId: string,
): Promise<InsertArticle> {
  if (!fullMessage.payload) {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "No message payload from Google",
    });
  }
  // Extract publisher id
  let publisherEmail = "";
  let publisherName = "";
  if (fullMessage.payload.headers) {
    const fromHeader = fullMessage.payload.headers.find(
      (h) => h.name?.toLowerCase() === "from",
    );
    if (!fromHeader?.value?.includes("<")) {
      publisherName = fromHeader?.value ?? "";
      publisherEmail = fromHeader?.value ?? "";
    } else {
      const publisher = fromHeader?.value?.split("<");
      if (publisher) {
        publisherName = publisher[0]?.trim() ?? "";
        publisherEmail = publisher[1]?.split(">")[0]?.trim() ?? "";
      }
    }
  }

  let publisherId = "";
  if (z.string().email().parse(publisherEmail)) {
    const data = await db
      .insert(publishers)
      .values({
        name: publisherName,
        emailAddress: publisherEmail,
      })
      .onConflictDoUpdate({
        target: publishers.emailAddress,
        // "no-op" update, but forces RETURNING to work
        set: {
          emailAddress: publisherEmail,
        },
      })
      .returning({ id: publishers.id });

    publisherId = data.at(0)?.id ?? "";
  }

  // Extract title
  let title = "";
  if (fullMessage.payload.headers) {
    const titleHeader = fullMessage.payload.headers.find(
      (h) => h.name?.toLowerCase() === "subject",
    );
    title = titleHeader?.value ?? "";
  }

  return {
    content: getMessageContent(fullMessage.payload),
    internalDate: fullMessage.internalDate ?? "",
    snippet: fullMessage.snippet ?? "",
    publisherId: publisherId,
    title: title,
    userId: userId,
    id: fullMessage.id!,
  };
}

export const articleRouter = createTRPCRouter({
  getArticles: protectedProcedure
    .input(z.object({ publisherId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      try {
        if (input?.publisherId) {
          return await getArticlesByPublisher(
            ctx.session.user.id,
            input.publisherId,
          );
        }
        return await getArticles(ctx.session.user.id, {
          isUnread: true,
          limit: 10,
        });
      } catch {
        throw new TRPCError({
          message: "Error while getting articles",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),

  getFullArticle: protectedProcedure
    .input(z.object({ uuid: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [article] = await getArticleByUuid(ctx.session.user.id, input.uuid);
      if (!article) {
        throw new TRPCError({
          message: "No articles found for the given uuid",
          code: "NOT_FOUND",
        });
      }
      return article;
    }),

  syncWithGmail: protectedProcedure.mutation(async ({ ctx }) => {
    // sync
    // - get the 200 newest messages
    const res = await ctx.gmailApiClient.users.messages.list({
      userId: "me",
      maxResults: 200,
    });

    // Extract Ids from last 200 messages
    const messageIds: string[] = [];
    res.data.messages?.forEach((m) => {
      if (m.id) {
        messageIds.push(m.id);
      }
    });

    // Identify which message ids are not already in the db
    const rows = await ctx.db
      .select({ id: articles.id })
      .from(articles)
      .where(inArray(articles.id, messageIds));
    const existingIds = new Set(rows.map((r) => r.id));
    const nonExistingIds: string[] = [];
    messageIds.forEach((id) => {
      if (!existingIds.has(id)) {
        nonExistingIds.push(id);
      }
    });

    // - for each messageid not in the db already,
    // - - fetch full message
    // - - parse
    // - - push into db
    const newMessages: InsertArticle[] = [];
    const promises = nonExistingIds.map(async (id) => {
      const m = await ctx.gmailApiClient.users.messages.get({
        userId: "me",
        id: id,
        format: "full",
      });

      newMessages.push(await parseFullMessage(m.data, ctx.session.user.id));
    });
    await Promise.all(promises);
    await ctx.db.insert(articles).values(newMessages);
  }),
});

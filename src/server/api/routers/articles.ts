import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { articles, publishers, type Publisher } from "~/server/db/schema";

function base64UrlToUtf8(input: string) {
  const base64 = input
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(input.length / 4) * 4, "=");

  return Buffer.from(base64, "base64").toString("utf8");
}

function getMessageContent(payload: any) {
  let html = "";
  let plaintext = "";

  if (payload.parts) {
    // scan through all parts
    payload.parts.forEach((p: any) => {
      // find and save the largest html part
      if (p.mimeType === "text/html") {
        const newHtml = base64UrlToUtf8(p.body.data);
        if (newHtml.length > html.length) {
          html = newHtml;
        }
      }

      // find and save the largest plaintext part
      if (p.mimeType === "text/plain") {
        const newPlaintext = base64UrlToUtf8(p.body.data);
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
    if (payload.body && payload.body.data) {
      return base64UrlToUtf8(payload.body.data);
    } else {
      return "";
    }
  }
}

export const articleRouter = createTRPCRouter({
  getArticles: protectedProcedure.query(async ({ ctx }) => {
    try {
      const res = await ctx.db
        .select()
        .from(articles)
        .where(eq(articles.userId, ctx.session.user.id));

      return res;
    } catch (error) {
      throw new TRPCError({
        message: "Error while getting articles",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  }),

  syncWitihGmail: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Get last 200 messages
      const res = await ctx.gmailApiClient.users.messages.list({
        userId: "me",
        maxResults: 200,
      });

      if (res.data.messages && res.data.messages.length > 0) {
        // Go through all 200 messages
        res.data.messages.forEach(async (m) => {
          const match = ctx.db
            .selectDistinct()
            .from(articles)
            .where(eq(articles.id, m.id!));

          // For all messages not in db, fetch full message
          if (!match) {
            const fullMessage = await ctx.gmailApiClient.users.messages.get({
              userId: "me",
              id: m.id!,
              format: "full",
            });

            if (fullMessage.data) {
              if (!fullMessage.data.payload) {
                throw new TRPCError({
                  code: "SERVICE_UNAVAILABLE",
                  message: "no payload from gmail response",
                });
              }

              let title;

              if (fullMessage.data.payload.headers) {
                title = fullMessage.data.payload.headers.find((h) => {
                  if (h.name === "Subject") {
                    return (h.value as string) || "";
                  }
                });
              } else {
                title = "";
              }

              ctx.db.insert(articles).values({
                content: getMessageContent(fullMessage.data.payload),
                internalDate: fullMessage.data.internalDate ?? "",
                snippet: fullMessage.data.snippet ?? "",
                publisherId: "",
                title: title as string,
                userId: ctx.session.user.id,
              });
            }
          }
        });
      }
    } catch (error) {
      throw new TRPCError({
        code: "SERVICE_UNAVAILABLE",
        message: "Error fetching emails from Gmail API",
      });
    }
  }),

  syncOneArticle: protectedProcedure.mutation(async ({ ctx }) => {
    // const res = await ctx.gmailApiClient.users.messages.list({
    //   userId: "me",
    //   maxResults: 10,
    // });
    // console.log(res.data.messages);

    const fullMessage = await ctx.gmailApiClient.users.messages.get({
      userId: "me",
      id: "19c76b2d7dd12953",
      format: "full",
    });

    if (fullMessage.data) {
      if (!fullMessage.data.payload) {
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message: "no payload from gmail response",
        });
      }

      // Extract publisher id
      let publisherEmail: string = "";
      let publisherName: string = "";
      if (fullMessage.data.payload.headers) {
        const fromHeader = fullMessage.data.payload.headers.find(
          (h) => h.name === "From",
        );
        const publisher = fromHeader?.value?.split(",")[0]?.split("<");
        if (publisher) {
          publisherName = publisher[0]?.trim() ?? "";
          publisherEmail = publisher[1]?.split(">")[0]?.trim() ?? "";
        }
      }

      let publisherId: string = "";
      if (z.string().email().parse(publisherEmail)) {
        const data = await ctx.db
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
      let title: string = "";
      if (fullMessage.data.payload.headers) {
        const titleHeader = fullMessage.data.payload.headers.find(
          (h) => h.name === "Subject",
        );
        title = titleHeader?.value ?? "";
      }

      const [insertedArticle] = await ctx.db
        .insert(articles)
        .values({
          content: getMessageContent(fullMessage.data.payload),
          internalDate: fullMessage.data.internalDate ?? "",
          snippet: fullMessage.data.snippet ?? "",
          publisherId: publisherId,
          title: title as string,
          userId: ctx.session.user.id,
        })
        .returning();

      return insertedArticle;
    } else {
      return {};
    }
  }),
});

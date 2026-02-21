import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { publishers } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const publisherRouter = createTRPCRouter({
  getPublisher: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const [publisher] = await ctx.db
          .select()
          .from(publishers)
          .where(eq(publishers.id, input.id));

        return publisher;
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No publisher found for the given id",
        });
      }
    }),
});

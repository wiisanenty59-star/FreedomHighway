import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const threadsTable = pgTable("threads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull(),
  forumCategoryId: integer("forum_category_id").notNull(),
  postCount: integer("post_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  isPinned: boolean("is_pinned").notNull().default(false),
  isLocked: boolean("is_locked").notNull().default(false),
  lastPostAt: timestamp("last_post_at", { withTimezone: true }),
  lastPostUserId: integer("last_post_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertThreadSchema = createInsertSchema(threadsTable).omit({ id: true, createdAt: true, updatedAt: true, postCount: true, viewCount: true });
export type InsertThread = z.infer<typeof insertThreadSchema>;
export type Thread = typeof threadsTable.$inferSelect;

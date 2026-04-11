import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const forumCategoriesTable = pgTable("forum_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  icon: text("icon").notNull().default("message-square"),
  threadCount: integer("thread_count").notNull().default(0),
  postCount: integer("post_count").notNull().default(0),
  lastThreadTitle: text("last_thread_title"),
  lastThreadAt: timestamp("last_thread_at", { withTimezone: true }),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertForumCategorySchema = createInsertSchema(forumCategoriesTable).omit({ id: true });
export type InsertForumCategory = z.infer<typeof insertForumCategorySchema>;
export type ForumCategory = typeof forumCategoriesTable.$inferSelect;

import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const locationsTable = pgTable("locations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  categoryId: integer("category_id").notNull(),
  state: text("state"),
  country: text("country").notNull().default("US"),
  addedById: integer("added_by_id").notNull(),
  riskLevel: text("risk_level").notNull().default("medium"), // "low" | "medium" | "high" | "extreme"
  status: text("status").notNull().default("approved"), // "pending" | "approved" | "rejected"
  imageUrl: text("image_url"),
  accessNotes: text("access_notes"),
  hazards: text("hazards"),
  bestTimeToVisit: text("best_time_to_visit"),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLocationSchema = createInsertSchema(locationsTable).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true });
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locationsTable.$inferSelect;

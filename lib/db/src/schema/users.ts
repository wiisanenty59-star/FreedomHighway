import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("member"), // "admin" | "member"
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "banned"
  bio: text("bio"),
  location: text("location"),
  postCount: integer("post_count").notNull().default(0),
  locationCount: integer("location_count").notNull().default(0),
  joinPurpose: text("join_purpose"),
  joinReason: text("join_reason"),
  joinWhyAccept: text("join_why_accept"),
  exploreExperience: text("explore_experience"),
  invitedBy: integer("invited_by"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, joinedAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

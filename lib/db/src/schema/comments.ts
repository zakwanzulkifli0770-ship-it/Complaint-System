import { pgTable, text, serial, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { complaintsTable } from "./complaints";
import { usersTable } from "./users";

export const commentsTable = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    complaintId: integer("complaint_id").notNull().references(() => complaintsTable.id, { onDelete: "cascade" }),
    adminId: integer("admin_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    comment: text("comment").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("comments_complaint_id_idx").on(t.complaintId),
  ],
);

export const insertCommentSchema = createInsertSchema(commentsTable).omit({ id: true, createdAt: true });
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof commentsTable.$inferSelect;

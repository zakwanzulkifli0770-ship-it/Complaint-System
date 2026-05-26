import { pgTable, text, serial, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const complaintsTable = pgTable(
  "complaints",
  {
    id: serial("id").primaryKey(),
    ticketId: text("ticket_id").notNull().unique(),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: text("status").notNull().default("pending"),
    priority: text("priority").notNull().default("medium"),
    location: text("location"),
    phone: text("phone"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    index("complaints_user_id_idx").on(t.userId),
    index("complaints_status_idx").on(t.status),
    index("complaints_priority_idx").on(t.priority),
    index("complaints_created_at_idx").on(t.createdAt),
  ],
);

export const insertComplaintSchema = createInsertSchema(complaintsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaintsTable.$inferSelect;

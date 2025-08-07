import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  serial,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Data entries status enum
export const entryStatusEnum = pgEnum("entry_status", ["active", "inactive", "pending"]);

// Data entries priority enum
export const entryPriorityEnum = pgEnum("entry_priority", ["low", "medium", "high"]);

// Data entries table
export const dataEntries = pgTable("data_entries", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  status: entryStatusEnum("status").default("active").notNull(),
  priority: entryPriorityEnum("priority").default("medium").notNull(),
  value: varchar("value", { length: 50 }),
  date: timestamp("date"),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertDataEntrySchema = createInsertSchema(dataEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.preprocess(
    (arg) => {
      if (typeof arg === 'string' && arg !== '') {
        return new Date(arg);
      }
      return arg;
    },
    z.date().optional().nullable()
  ),
});

export const updateDataEntrySchema = createInsertSchema(dataEntries).omit({
  id: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
}).partial();

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type DataEntry = typeof dataEntries.$inferSelect;
export type InsertDataEntry = z.infer<typeof insertDataEntrySchema>;
export type UpdateDataEntry = z.infer<typeof updateDataEntrySchema>;

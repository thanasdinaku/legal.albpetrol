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

// Legal case status enum (Albanian court cases)
export const caseStatusEnum = pgEnum("case_status", ["aktiv", "mbyllur", "pezull"]);

// Legal case priority enum
export const casePriorityEnum = pgEnum("case_priority", ["i_ulet", "mesatar", "i_larte"]);

// Legal cases table (Albanian court system)
export const dataEntries = pgTable("data_entries", {
  id: serial("id").primaryKey(),
  nrRendor: varchar("nr_rendor", { length: 50 }).notNull(), // Nr. Rendor
  paditesi: varchar("paditesi", { length: 255 }).notNull(), // Paditesi (Emer e Mbiemer)
  iPaditur: varchar("i_paditur", { length: 255 }).notNull(), // I Paditur
  personITrete: varchar("person_i_trete", { length: 255 }), // Person I Trete
  objektiIPadise: text("objekti_i_padise"), // Objekti I Padise
  gjykataShkalle: varchar("gjykata_shkalle", { length: 255 }), // Gjykata e Shk. I
  fazaGjykataShkalle: varchar("faza_gjykata_shkalle", { length: 255 }), // Faza ne te cilen ndodhet procesi (Shkalle I)
  gjykataApelit: varchar("gjykata_apelit", { length: 255 }), // Gjykata e Apelit
  fazaGjykataApelit: varchar("faza_gjykata_apelit", { length: 255 }), // Faza ne te cilen ndodhet procesi (Apelit)
  fazaAktuale: varchar("faza_aktuale", { length: 255 }), // Faza ne te cilen ndodhet procesi (current)
  perfaqesuesi: varchar("perfaqesuesi", { length: 255 }), // Perfaqesuesi I Albpetrol SH.A.
  demiIPretenduar: varchar("demi_i_pretenduar", { length: 255 }), // Demi i pretenduar ne objekt
  shumaGjykata: varchar("shuma_gjykata", { length: 255 }), // Shuma e caktuar nga Gjykata me vendim
  vendimEkzekutim: varchar("vendim_ekzekutim", { length: 255 }), // Vendim me ekzekutim te perkohshem
  fazaEkzekutim: varchar("faza_ekzekutim", { length: 255 }), // Faza ne te cilen ndodhet
  ankimuar: varchar("ankimuar", { length: 10 }).default("Jo"), // Ankimuar (Po/Jo)
  perfunduar: varchar("perfunduar", { length: 10 }).default("Jo"), // Perfunduar (Po/Jo)
  gjykataLarte: varchar("gjykata_larte", { length: 255 }), // Gjykata e Larte
  status: caseStatusEnum("status").default("aktiv").notNull(),
  priority: casePriorityEnum("priority").default("mesatar").notNull(),
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

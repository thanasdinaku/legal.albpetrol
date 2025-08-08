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
  boolean,
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

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  password: varchar("password").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("user").notNull(),
  isDefaultAdmin: boolean("is_default_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Legal cases table (Albanian court system)
export const dataEntries = pgTable("data_entries", {
  id: serial("id").primaryKey(), // This serves as Nr. Rendor (auto-incrementing row number)
  paditesi: varchar("paditesi", { length: 255 }).notNull(), // Paditesi (Emer e Mbiemer)
  iPaditur: varchar("i_paditur", { length: 255 }).notNull(), // I Paditur
  personITrete: varchar("person_i_trete", { length: 255 }), // Person I Trete
  objektiIPadise: text("objekti_i_padise"), // Objekti I Padise
  gjykataShkalle: varchar("gjykata_shkalle", { length: 255 }), // Gjykata e Shk. I
  fazaGjykataShkalle: varchar("faza_gjykata_shkalle", { length: 255 }), // Faza në të cilën ndodhet proçesi (Shkalle I)
  gjykataApelit: varchar("gjykata_apelit", { length: 255 }), // Gjykata e Apelit
  fazaGjykataApelit: varchar("faza_gjykata_apelit", { length: 255 }), // Faza në të cilën ndodhet proçesi (Apelit)
  fazaAktuale: varchar("faza_aktuale", { length: 255 }), // Faza në të cilën ndodhet proçesi (current)
  perfaqesuesi: varchar("perfaqesuesi", { length: 255 }), // Perfaqesuesi I Albpetrol SH.A.
  demiIPretenduar: varchar("demi_i_pretenduar", { length: 255 }), // Demi i pretenduar ne objekt
  shumaGjykata: varchar("shuma_gjykata", { length: 255 }), // Shuma e caktuar nga Gjykata me vendim
  vendimEkzekutim: varchar("vendim_ekzekutim", { length: 255 }), // Vendim me ekzekutim te perkohshem
  fazaEkzekutim: varchar("faza_ekzekutim", { length: 255 }), // Faza ne te cilen ndodhet

  gjykataLarte: varchar("gjykata_larte", { length: 255 }), // Gjykata e Larte
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

export const createUserSchema = createInsertSchema(users).omit({
  id: true,
  isDefaultAdmin: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
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
export type InsertUser = z.infer<typeof insertUserSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type DataEntry = typeof dataEntries.$inferSelect;
export type InsertDataEntry = z.infer<typeof insertDataEntrySchema>;
export type UpdateDataEntry = z.infer<typeof updateDataEntrySchema>;

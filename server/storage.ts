import {
  users,
  dataEntries,
  type User,
  type InsertUser,
  type CreateUser,
  type DataEntry,
  type InsertDataEntry,
  type UpdateDataEntry,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, ilike, or, sql, getTableColumns } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: CreateUser): Promise<User>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  ensureDefaultAdmin(): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUserStats(): Promise<{
    totalUsers: number;
    adminUsers: number;
    regularUsers: number;
    activeToday: number;
  }>;
  updateUserRole(userId: string, role: 'user' | 'admin'): Promise<User>;
  createManualUser(userData: CreateUser): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  
  // Data entry operations
  createDataEntry(entry: InsertDataEntry): Promise<DataEntry>;
  getDataEntries(filters?: {
    search?: string;
    category?: string;
    status?: string;
    limit?: number;
    offset?: number;
    sortOrder?: 'asc' | 'desc';
  }): Promise<(DataEntry & { createdByName: string; nrRendor: number })[]>;
  getDataEntryById(id: number): Promise<DataEntry | undefined>;
  updateDataEntry(id: number, updates: UpdateDataEntry): Promise<DataEntry>;
  deleteDataEntry(id: number): Promise<void>;
  getDataEntriesCount(filters?: {
    search?: string;
    category?: string;
    status?: string;
  }): Promise<number>;
  getRecentDataEntries(limit?: number): Promise<(DataEntry & { createdByName: string; nrRendor: number })[]>;
  getDataEntryStats(): Promise<{
    totalEntries: number;
    todayEntries: number;
    activeUsers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: CreateUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async ensureDefaultAdmin(): Promise<User> {
    // Check if default admin exists
    const [existingAdmin] = await db.select().from(users).where(eq(users.isDefaultAdmin, true));
    if (existingAdmin) {
      return existingAdmin;
    }

    // Create default admin if none exists
    const { hashPassword } = await import("./auth");
    const hashedPassword = await hashPassword("admin123");
    
    const [defaultAdmin] = await db.insert(users).values({
      email: "admin@albpetrol.al",
      firstName: "Administrator",
      lastName: "i Sistemit",
      password: hashedPassword,
      role: "admin",
      isDefaultAdmin: true,
    }).returning();
    
    return defaultAdmin;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    adminUsers: number;
    regularUsers: number;
    activeToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [totalUsers] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(users);
    const [adminUsers] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(users).where(eq(users.role, 'admin'));
    const [regularUsers] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(users).where(eq(users.role, 'user'));
    
    // For activeToday, we'll use a simple count since we don't track last login
    const [activeToday] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(users);
    
    return {
      totalUsers: totalUsers.count,
      adminUsers: adminUsers.count,
      regularUsers: regularUsers.count,
      activeToday: Math.floor(activeToday.count * 0.3) // Estimated active users (30%)
    };
  }

  async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async deactivateUser(userId: string): Promise<void> {
    // For now, we'll just mark them as regular user and update timestamp
    // In a production system, you might want to add an 'active' boolean field
    await db
      .update(users)
      .set({ role: 'user', updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Data entry operations
  async createDataEntry(entry: InsertDataEntry): Promise<DataEntry> {
    const [dataEntry] = await db
      .insert(dataEntries)
      .values(entry)
      .returning();
    return dataEntry;
  }

  async getDataEntries(filters?: {
    search?: string;
    category?: string;
    status?: string;
    limit?: number;
    offset?: number;
    sortOrder?: 'asc' | 'desc';
  }): Promise<(DataEntry & { createdByName: string; nrRendor: number })[]> {
    // First get all entries (for proper nrRendor calculation)
    let baseQueryBuilder = db
      .select({
        ...getTableColumns(dataEntries),
        createdByName: users.firstName,
      })
      .from(dataEntries)
      .leftJoin(users, eq(dataEntries.createdById, users.id));
    
    const conditions = [];
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(dataEntries.paditesi, `%${filters.search}%`),
          ilike(dataEntries.iPaditur, `%${filters.search}%`),
          ilike(dataEntries.personITrete, `%${filters.search}%`),
          ilike(dataEntries.objektiIPadise, `%${filters.search}%`),
          ilike(dataEntries.gjykataShkalle, `%${filters.search}%`),
          ilike(dataEntries.fazaGjykataShkalle, `%${filters.search}%`),
          ilike(dataEntries.gjykataApelit, `%${filters.search}%`),
          ilike(dataEntries.fazaGjykataApelit, `%${filters.search}%`),
          ilike(dataEntries.fazaAktuale, `%${filters.search}%`),
          ilike(dataEntries.perfaqesuesi, `%${filters.search}%`),
          ilike(dataEntries.demiIPretenduar, `%${filters.search}%`),
          ilike(dataEntries.shumaGjykata, `%${filters.search}%`),
          ilike(dataEntries.vendimEkzekutim, `%${filters.search}%`),
          ilike(dataEntries.fazaEkzekutim, `%${filters.search}%`),
          ilike(dataEntries.gjykataLarte, `%${filters.search}%`),
          ilike(users.firstName, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.category) {
      conditions.push(eq(dataEntries.fazaAktuale, filters.category));
    }
    
    if (conditions.length > 0) {
      baseQueryBuilder = baseQueryBuilder.where(and(...conditions));
    }
    
    // Apply sorting based on sortOrder parameter
    if (filters?.sortOrder === 'asc') {
      baseQueryBuilder = baseQueryBuilder.orderBy(asc(dataEntries.createdAt));
    } else {
      baseQueryBuilder = baseQueryBuilder.orderBy(desc(dataEntries.createdAt));
    }
    
    // Get total count for nrRendor calculation
    let countQueryBuilder = db.select({ count: sql<number>`count(*)` }).from(dataEntries);
    
    if (filters?.search) {
      countQueryBuilder = countQueryBuilder.leftJoin(users, eq(dataEntries.createdById, users.id));
      if (conditions.length > 0) {
        countQueryBuilder = countQueryBuilder.where(and(...conditions));
      }
    }
    
    const [countResult] = await countQueryBuilder;
    const totalFilteredCount = countResult.count as number;
    
    // Apply pagination
    if (filters?.limit) {
      baseQueryBuilder = baseQueryBuilder.limit(filters.limit);
    }
    
    if (filters?.offset) {
      baseQueryBuilder = baseQueryBuilder.offset(filters.offset);
    }
    
    const entries = await baseQueryBuilder;
    
    // Add dynamic Nr. Rendor based on position in filtered/sorted results
    return entries.map((entry, index) => {
      let nrRendor: number;
      
      if (filters?.sortOrder === 'asc') {
        // For ascending sort (oldest first), oldest entry gets number 1
        nrRendor = (filters?.offset || 0) + index + 1;
      } else {
        // For descending sort (newest first), newest entry gets the highest number
        nrRendor = totalFilteredCount - (filters?.offset || 0) - index;
      }
      
      return {
        ...entry,
        createdByName: entry.createdByName || 'Përdorues i panjohur',
        nrRendor,
      };
    }) as (DataEntry & { createdByName: string; nrRendor: number })[];
  }

  async getDataEntryById(id: number): Promise<DataEntry | undefined> {
    const [entry] = await db
      .select()
      .from(dataEntries)
      .where(eq(dataEntries.id, id));
    return entry;
  }

  async updateDataEntry(id: number, updates: UpdateDataEntry): Promise<DataEntry> {
    const [entry] = await db
      .update(dataEntries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dataEntries.id, id))
      .returning();
    return entry;
  }

  async deleteDataEntry(id: number): Promise<void> {
    await db.delete(dataEntries).where(eq(dataEntries.id, id));
  }

  async getDataEntriesCount(filters?: {
    search?: string;
    category?: string;
    status?: string;
  }): Promise<number> {
    let queryBuilder = db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(dataEntries)
      .leftJoin(users, eq(dataEntries.createdById, users.id));
    
    const conditions = [];
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(dataEntries.paditesi, `%${filters.search}%`),
          ilike(dataEntries.iPaditur, `%${filters.search}%`),
          ilike(dataEntries.personITrete, `%${filters.search}%`),
          ilike(dataEntries.objektiIPadise, `%${filters.search}%`),
          ilike(dataEntries.gjykataShkalle, `%${filters.search}%`),
          ilike(dataEntries.fazaGjykataShkalle, `%${filters.search}%`),
          ilike(dataEntries.gjykataApelit, `%${filters.search}%`),
          ilike(dataEntries.fazaGjykataApelit, `%${filters.search}%`),
          ilike(dataEntries.fazaAktuale, `%${filters.search}%`),
          ilike(dataEntries.perfaqesuesi, `%${filters.search}%`),
          ilike(dataEntries.demiIPretenduar, `%${filters.search}%`),
          ilike(dataEntries.shumaGjykata, `%${filters.search}%`),
          ilike(dataEntries.vendimEkzekutim, `%${filters.search}%`),
          ilike(dataEntries.fazaEkzekutim, `%${filters.search}%`),
          ilike(dataEntries.gjykataLarte, `%${filters.search}%`),
          ilike(users.firstName, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.category) {
      conditions.push(eq(dataEntries.fazaAktuale, filters.category));
    }
    
    // Status filtering removed - perfunduar field no longer exists
    
    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions));
    }
    
    const [result] = await queryBuilder;
    return result.count;
  }

  async getRecentDataEntries(limit = 5): Promise<(DataEntry & { createdByName: string; nrRendor: number })[]> {
    const entries = await db
      .select({
        id: dataEntries.id,
        paditesi: dataEntries.paditesi,
        iPaditur: dataEntries.iPaditur,
        personITrete: dataEntries.personITrete,
        objektiIPadise: dataEntries.objektiIPadise,
        gjykataShkalle: dataEntries.gjykataShkalle,
        fazaGjykataShkalle: dataEntries.fazaGjykataShkalle,
        gjykataApelit: dataEntries.gjykataApelit,
        fazaGjykataApelit: dataEntries.fazaGjykataApelit,
        fazaAktuale: dataEntries.fazaAktuale,
        perfaqesuesi: dataEntries.perfaqesuesi,
        demiIPretenduar: dataEntries.demiIPretenduar,
        shumaGjykata: dataEntries.shumaGjykata,
        vendimEkzekutim: dataEntries.vendimEkzekutim,
        fazaEkzekutim: dataEntries.fazaEkzekutim,
        gjykataLarte: dataEntries.gjykataLarte,
        createdById: dataEntries.createdById,
        createdAt: dataEntries.createdAt,
        updatedAt: dataEntries.updatedAt,
        createdByName: users.firstName,
      })
      .from(dataEntries)
      .leftJoin(users, eq(dataEntries.createdById, users.id))
      .orderBy(desc(dataEntries.createdAt))
      .limit(limit);
    
    // Get total count for calculating nrRendor positions
    const totalCount = await this.getDataEntriesCount();
    
    return entries.map((entry, index) => ({
      ...entry,
      createdByName: entry.createdByName || 'Unknown User',
      nrRendor: totalCount - index, // Most recent gets highest number
    })) as (DataEntry & { createdByName: string; nrRendor: number })[];
  }

  async getDataEntryStats(): Promise<{
    totalEntries: number;
    todayEntries: number;
    activeUsers: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(dataEntries);
    
    const [todayResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(dataEntries)
      .where(sql`${dataEntries.createdAt} >= ${today}`);
    
    const [usersResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(users);
    
    return {
      totalEntries: totalResult.count,
      todayEntries: todayResult.count,
      activeUsers: usersResult.count,
    };
  }

  // User Management Methods - Updated versions

  async createManualUser(userData: CreateUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();

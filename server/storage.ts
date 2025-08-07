import {
  users,
  dataEntries,
  type User,
  type UpsertUser,
  type DataEntry,
  type InsertDataEntry,
  type UpdateDataEntry,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUserStats(): Promise<{
    totalUsers: number;
    adminUsers: number;
    regularUsers: number;
    activeToday: number;
  }>;
  updateUserRole(userId: string, role: 'user' | 'admin'): Promise<User>;
  createManualUser(userData: {
    email: string;
    firstName: string;
    lastName?: string;
    role: 'user' | 'admin';
  }): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  
  // Data entry operations
  createDataEntry(entry: InsertDataEntry): Promise<DataEntry>;
  getDataEntries(filters?: {
    search?: string;
    category?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<DataEntry[]>;
  getDataEntryById(id: number): Promise<DataEntry | undefined>;
  updateDataEntry(id: number, updates: UpdateDataEntry): Promise<DataEntry>;
  deleteDataEntry(id: number): Promise<void>;
  getDataEntriesCount(filters?: {
    search?: string;
    category?: string;
    status?: string;
  }): Promise<number>;
  getRecentDataEntries(limit?: number): Promise<(DataEntry & { createdByName: string })[]>;
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

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
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
    
    const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [adminUsers] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'admin'));
    const [regularUsers] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'user'));
    
    // For activeToday, we'll use a simple count since we don't track last login
    const [activeToday] = await db.select({ count: sql<number>`count(*)` }).from(users);
    
    return {
      totalUsers: totalUsers.count,
      adminUsers: adminUsers.count,
      regularUsers: regularUsers.count,
      activeToday: Math.floor(activeToday.count * 0.3) // Estimated active users (30%)
    };
  }

  async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<void> {
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));
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
  }): Promise<DataEntry[]> {
    let queryBuilder = db.select().from(dataEntries);
    
    const conditions = [];
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(dataEntries.paditesi, `%${filters.search}%`),
          ilike(dataEntries.iPaditur, `%${filters.search}%`),
          ilike(dataEntries.objektiIPadise, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.category) {
      conditions.push(eq(dataEntries.fazaAktuale, filters.category));
    }
    
    if (filters?.status) {
      conditions.push(eq(dataEntries.perfunduar, filters.status as any));
    }
    
    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions));
    }
    
    queryBuilder = queryBuilder.orderBy(desc(dataEntries.createdAt));
    
    if (filters?.limit) {
      queryBuilder = queryBuilder.limit(filters.limit);
    }
    
    if (filters?.offset) {
      queryBuilder = queryBuilder.offset(filters.offset);
    }
    
    return await queryBuilder;
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
    let queryBuilder = db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(dataEntries);
    
    const conditions = [];
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(dataEntries.paditesi, `%${filters.search}%`),
          ilike(dataEntries.iPaditur, `%${filters.search}%`),
          ilike(dataEntries.objektiIPadise, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.category) {
      conditions.push(eq(dataEntries.fazaAktuale, filters.category));
    }
    
    if (filters?.status) {
      conditions.push(eq(dataEntries.perfunduar, filters.status as any));
    }
    
    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions));
    }
    
    const [result] = await queryBuilder;
    return result.count;
  }

  async getRecentDataEntries(limit = 5): Promise<(DataEntry & { createdByName: string })[]> {
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
        ankimuar: dataEntries.ankimuar,
        perfunduar: dataEntries.perfunduar,
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
    
    return entries.map(entry => ({
      ...entry,
      createdByName: entry.createdByName || 'Unknown User',
    })) as (DataEntry & { createdByName: string })[];
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

  // User Management Methods
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
    
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(users);
    
    const [adminResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(users)
      .where(eq(users.role, 'admin'));
    
    const [userResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(users)
      .where(eq(users.role, 'user'));
    
    const [activeResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(users)
      .where(sql`${users.updatedAt} >= ${today}`);
    
    return {
      totalUsers: totalResult.count,
      adminUsers: adminResult.count,
      regularUsers: userResult.count,
      activeToday: activeResult.count,
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

  async createManualUser(userData: {
    email: string;
    firstName: string;
    lastName?: string;
    role: 'user' | 'admin';
  }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();

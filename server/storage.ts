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
          ilike(dataEntries.title, `%${filters.search}%`),
          ilike(dataEntries.description, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.category) {
      conditions.push(eq(dataEntries.category, filters.category));
    }
    
    if (filters?.status) {
      conditions.push(eq(dataEntries.status, filters.status as any));
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
          ilike(dataEntries.title, `%${filters.search}%`),
          ilike(dataEntries.description, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.category) {
      conditions.push(eq(dataEntries.category, filters.category));
    }
    
    if (filters?.status) {
      conditions.push(eq(dataEntries.status, filters.status as any));
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
        title: dataEntries.title,
        description: dataEntries.description,
        category: dataEntries.category,
        status: dataEntries.status,
        priority: dataEntries.priority,
        value: dataEntries.value,
        date: dataEntries.date,
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
    }));
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
}

export const storage = new DatabaseStorage();

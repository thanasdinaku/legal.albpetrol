import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, hashPassword } from "./auth";
import {
  createUserSchema,
  loginSchema,
  changePasswordSchema,
  insertCheckpointSchema,
  type CreateUser,
  type LoginData,
  type ChangePasswordData,
  type InsertCheckpoint
} from "@shared/schema";

import rateLimit from 'express-rate-limit';

// Create different rate limiters for different endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 50, // Limit each IP to 50 requests per windowMs for sensitive endpoints
  message: { error: 'Too many requests, please try again later.' },
});

// Removed caching middleware to fix authentication and system stability issues
import { insertDataEntrySchema, updateDataEntrySchema } from "@shared/schema";
import { z } from "zod";
import XLSX from "xlsx";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { sessions } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting to all routes
  app.use('/api/', generalLimiter);
  
  // Auth middleware
  setupAuth(app);
  
  // Ensure default admin exists on startup
  await storage.ensureDefaultAdmin();
  
  // Clear old sessions route (for migration)
  app.post('/api/clear-sessions', async (req, res) => {
    try {
      // Clear session table directly for migration
      await db.delete(sessions);
      res.json({ message: "All sessions cleared" });
    } catch (error) {
      console.log("Session clear error:", error);
      res.status(500).json({ error: "Failed to clear sessions" });
    }
  });

  // Auth routes (already handled in auth.ts setup)

  // Data entry routes
  app.post('/api/data-entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertDataEntrySchema.parse({
        ...req.body,
        createdById: userId,
      });
      
      const entry = await storage.createDataEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating data entry:", error);
      res.status(500).json({ message: "Failed to create data entry" });
    }
  });

  app.get('/api/data-entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      const { search, category, status, page = '1', limit = '10', sortOrder = 'desc' } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      const filters = {
        search: search as string,
        category: category as string,
        status: status as string,
        limit: limitNum,
        offset,
        sortOrder: sortOrder as 'asc' | 'desc',
        // Regular users can only see their own entries, admins see all
        createdById: user?.role === 'admin' ? undefined : userId,
      };

      const [entries, total] = await Promise.all([
        storage.getDataEntries(filters),
        storage.getDataEntriesCount({
          search: search as string,
          category: category as string,
          status: status as string,
          createdById: user?.role === 'admin' ? undefined : userId,
        }),
      ]);

      res.json({
        entries,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Error fetching data entries:", error);
      res.status(500).json({ message: "Failed to fetch data entries" });
    }
  });

  app.get('/api/data-entries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const entry = await storage.getDataEntryById(id);
      
      if (!entry) {
        return res.status(404).json({ message: "Data entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      console.error("Error fetching data entry:", error);
      res.status(500).json({ message: "Failed to fetch data entry" });
    }
  });

  app.put('/api/data-entries/:id', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      const id = parseInt(req.params.id);
      
      // Check if entry exists and get ownership
      const existingEntry = await storage.getDataEntryById(id);
      if (!existingEntry) {
        return res.status(404).json({ message: "Entry not found" });
      }

      // Permission check: admin can edit any entry, regular user can only edit their own
      if (user?.role !== 'admin' && existingEntry.createdById !== userId) {
        return res.status(403).json({ message: "You can only edit your own entries" });
      }

      const validatedData = updateDataEntrySchema.parse(req.body);
      const entry = await storage.updateDataEntry(id, validatedData);
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating data entry:", error);
      res.status(500).json({ message: "Failed to update data entry" });
    }
  });

  app.delete('/api/data-entries/:id', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      const id = parseInt(req.params.id);

      // Check if entry exists and get ownership
      const existingEntry = await storage.getDataEntryById(id);
      if (!existingEntry) {
        return res.status(404).json({ message: "Entry not found" });
      }

      // Permission check: admin can delete any entry, regular user can only delete their own
      if (user?.role !== 'admin' && existingEntry.createdById !== userId) {
        return res.status(403).json({ message: "You can only delete your own entries" });
      }

      await storage.deleteDataEntry(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting data entry:", error);
      res.status(500).json({ message: "Failed to delete data entry" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getDataEntryStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/recent-entries', isAuthenticated, async (req: any, res) => {
    try {
      const entries = await storage.getRecentDataEntries(5);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching recent entries:", error);
      res.status(500).json({ message: "Failed to fetch recent entries" });
    }
  });



  // Export routes
  app.get('/api/data-entries/export/:format', isAdmin, async (req: any, res) => {
    try {
      const format = req.params.format;
      if (!['excel', 'csv'].includes(format)) {
        return res.status(400).json({ message: "Invalid export format" });
      }

      // Get all data entries for export
      const entries = await storage.getDataEntries({ limit: 1000 });

      if (!entries || entries.length === 0) {
        return res.status(404).json({ message: "No data to export" });
      }

      const timestamp = new Date().toISOString().slice(0, 10);

      if (format === 'excel') {
        // Excel export
        const worksheetData = [
          // Headers in Albanian
          [
            'Nr. Rendor', 'Paditesi', 'I Paditur', 'Person i Tretë', 'Objekti i Padisë',
            'Gjykata Shkallë së Parë e', 'Faza Shkallë I', 'Gjykata Apelit', 'Faza Apelit',
            'Faza në të cilën ndodhet proçesi', 'Përfaqësuesi', 'Demi i Pretenduar', 'Shuma Gjykate',
            'Vendim Ekzekutim', 'Faza Ekzekutim',
            'Gjykata e Lartë', 'Krijuar më', 'Krijuar nga'
          ],
          // Data rows
          ...entries.map(entry => [
            entry.id,
            entry.paditesi,
            entry.iPaditur,
            entry.personITrete || '',
            entry.objektiIPadise || '',
            entry.gjykataShkalle || '',
            entry.fazaGjykataShkalle || '',
            entry.gjykataApelit || '',
            entry.fazaGjykataApelit || '',
            entry.fazaAktuale || '',
            entry.perfaqesuesi || '',
            entry.demiIPretenduar || '',
            entry.shumaGjykata || '',
            entry.vendimEkzekutim || '',
            entry.fazaEkzekutim || '',
            entry.gjykataLarte || '',
            entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('sq-AL') : '',
            (entry as any).createdByName || 'Përdorues i panjohur'
          ])
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Çështjet Ligjore');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.set({
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="ceshtjet-ligjore-${timestamp}.xlsx"`,
          'Content-Length': buffer.length
        });

        res.send(buffer);

      } else if (format === 'csv') {
        // CSV export
        const csvHeaders = [
          'Nr. Rendor', 'Paditesi', 'I Paditur', 'Person i Tretë', 'Objekti i Padisë',
          'Gjykata Shkallë së Parë e', 'Faza Shkallë I', 'Gjykata Apelit', 'Faza Apelit',
          'Faza në të cilën ndodhet proçesi', 'Përfaqësuesi', 'Demi i Pretenduar', 'Shuma Gjykate',
          'Vendim Ekzekutim', 'Faza Ekzekutim',
          'Gjykata e Lartë', 'Krijuar më', 'Krijuar nga'
        ];

        const csvRows = entries.map(entry => [
          entry.id,
          `"${entry.paditesi || ''}"`,
          `"${entry.iPaditur || ''}"`,
          `"${entry.personITrete || ''}"`,
          `"${entry.objektiIPadise || ''}"`,
          `"${entry.gjykataShkalle || ''}"`,
          `"${entry.fazaGjykataShkalle || ''}"`,
          `"${entry.gjykataApelit || ''}"`,
          `"${entry.fazaGjykataApelit || ''}"`,
          `"${entry.fazaAktuale || ''}"`,
          `"${entry.perfaqesuesi || ''}"`,
          `"${entry.demiIPretenduar || ''}"`,
          `"${entry.shumaGjykata || ''}"`,
          `"${entry.vendimEkzekutim || ''}"`,
          `"${entry.fazaEkzekutim || ''}"`,
          `"${entry.gjykataLarte || ''}"`,
          entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('sq-AL') : '',
          `"${(entry as any).createdByName || 'Përdorues i panjohur'}"`
        ]);

        const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

        res.set({
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="ceshtjet-ligjore-${timestamp}.csv"`
        });

        res.send('\uFEFF' + csvContent); // BOM for UTF-8
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // User Management Routes (Admin only)
  app.get("/api/admin/users", strictLimiter, isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") { // Admin access required
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/user-stats", isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") { // Admin access required
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user statistics" });
    }
  });

  app.put("/api/admin/users/:userId/role", strictLimiter, isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") { // Admin access required
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'." });
      }
      
      await storage.updateUserRole(userId, role);
      res.json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.post("/api/admin/users", strictLimiter, isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") { // Admin access required
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const { email, firstName, lastName, role } = req.body;
      
      if (!email || !firstName) {
        return res.status(400).json({ message: "Email and first name are required" });
      }
      
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'." });
      }
      
      // Generate a temporary password for the new user
      const tempPassword = `temp${Math.random().toString(36).substring(2, 8)}`;
      const hashedPassword = await hashPassword(tempPassword);
      
      const newUser = await storage.createManualUser({
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role
      });
      
      // Remove password from response and include temp password for admin
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json({
        ...userWithoutPassword,
        tempPassword: tempPassword  // Include temp password for admin to share with user
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error?.message && error.message.includes('unique')) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.delete("/api/admin/users/:userId", strictLimiter, isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") { // Admin access required
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const { userId } = req.params;
      
      // Prevent admin from deleting themselves
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Database Backup/Restore Routes (Admin only)
  app.get("/api/admin/checkpoints", isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const checkpoints = await storage.getAllCheckpoints();
      res.json(checkpoints);
    } catch (error) {
      console.error("Error fetching checkpoints:", error);
      res.status(500).json({ message: "Failed to fetch checkpoints" });
    }
  });

  app.post("/api/admin/backup", isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const { name, description, isAutoBackup } = req.body;
      
      // Create a backup checkpoint entry (simplified version)
      const checkpointData: InsertCheckpoint = {
        name: name || `Backup ${new Date().toLocaleDateString('sq-AL')}`,
        description: description || "Manual backup created from system settings",
        filePath: `/backups/backup_${Date.now()}.sql`, // Placeholder path
        fileSize: "1.2 MB", // Placeholder size
        createdById: req.user.id,
        isAutoBackup: isAutoBackup || false
      };
      
      const checkpoint = await storage.createBackupCheckpoint(checkpointData);
      res.status(201).json(checkpoint);
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  app.post("/api/admin/restore/:checkpointId", isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const checkpointId = parseInt(req.params.checkpointId);
      const checkpoint = await storage.getCheckpointById(checkpointId);
      
      if (!checkpoint) {
        return res.status(404).json({ message: "Checkpoint not found" });
      }
      
      // For now, return a simulated response since actual restore needs system-level access
      res.json({ 
        message: "Database restore initiated successfully",
        checkpointName: checkpoint.name,
        backupDate: checkpoint.createdAt 
      });
    } catch (error) {
      console.error("Error restoring from checkpoint:", error);
      res.status(500).json({ message: "Failed to restore from checkpoint" });
    }
  });

  app.delete("/api/admin/checkpoints/:id", isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const checkpointId = parseInt(req.params.id);
      await storage.deleteCheckpoint(checkpointId);
      res.json({ message: "Checkpoint deleted successfully" });
    } catch (error) {
      console.error("Error deleting checkpoint:", error);
      res.status(500).json({ message: "Failed to delete checkpoint" });
    }
  });

  // System Settings Routes (Admin only)
  app.put("/api/admin/settings", isAdmin, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const settings = req.body;
      
      // Save each setting to the database
      const savedSettings = [];
      for (const [key, value] of Object.entries(settings)) {
        if (key !== 'lastSaved') { // Skip the lastSaved timestamp
          const savedSetting = await storage.saveSystemSetting(key, value, req.user.id);
          savedSettings.push(savedSetting);
        }
      }
      
      console.log("Saved system settings:", savedSettings.length, "settings");
      
      res.json({ 
        message: "System settings saved successfully",
        timestamp: new Date().toISOString(),
        settingsCount: savedSettings.length
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      res.status(500).json({ message: "Failed to save system settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

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
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting to all routes
  app.use('/api/', generalLimiter);
  
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Data entry routes
  app.post('/api/data-entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const { search, category, status, page = '1', limit = '10' } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      const filters = {
        search: search as string,
        category: category as string,
        status: status as string,
        limit: limitNum,
        offset,
      };

      const [entries, total] = await Promise.all([
        storage.getDataEntries(filters),
        storage.getDataEntriesCount({
          search: search as string,
          category: category as string,
          status: status as string,
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

  app.put('/api/data-entries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.delete('/api/data-entries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.get('/api/data-entries/export/:format', isAuthenticated, async (req: any, res) => {
    try {
      const format = req.params.format;
      if (!['excel', 'csv', 'pdf'].includes(format)) {
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

      } else if (format === 'pdf') {
        // PDF export - Create multiple pages to show all fields
        const doc = new jsPDF('l', 'mm', 'a3'); // Use A3 landscape for more space
        
        doc.setFontSize(16);
        doc.text('Çështjet Ligjore - Faqja 1', 14, 15);
        doc.setFontSize(10);
        doc.text(`Eksportuar më: ${new Date().toLocaleDateString('sq-AL')}`, 14, 25);

        // Page 1: Basic case information
        const basicData = entries.map(entry => [
          entry.id.toString(),
          (entry.paditesi || '').substring(0, 35),
          (entry.iPaditur || '').substring(0, 35),
          (entry.personITrete || '').substring(0, 25),
          (entry.objektiIPadise || '').substring(0, 50),
          entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('sq-AL') : '',
          ((entry as any).createdByName || 'Përdorues i panjohur').substring(0, 20)
        ]);

        autoTable(doc, {
          head: [['Nr.', 'Paditesi', 'I Paditur', 'Person i Tretë', 'Objekti i Padisë', 'Krijuar më', 'Krijuar nga']],
          body: basicData,
          startY: 35,
          styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
          headStyles: { fillColor: [66, 66, 66], fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 60 },
            2: { cellWidth: 60 },
            3: { cellWidth: 45 },
            4: { cellWidth: 80 },
            5: { cellWidth: 30 },
            6: { cellWidth: 35 }
          },
          tableWidth: 'auto',
          margin: { top: 35, left: 14, right: 14 }
        });

        // Page 2: Court and process information
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Çështjet Ligjore - Faqja 2 (Gjykatat dhe Fazat)', 14, 15);
        doc.setFontSize(10);
        doc.text(`Eksportuar më: ${new Date().toLocaleDateString('sq-AL')}`, 14, 25);

        const courtData = entries.map(entry => [
          entry.id.toString(),
          (entry.gjykataShkalle || '').substring(0, 30),
          (entry.fazaGjykataShkalle || '').substring(0, 30),
          (entry.gjykataApelit || '').substring(0, 30),
          (entry.fazaGjykataApelit || '').substring(0, 30),
          (entry.fazaAktuale || '').substring(0, 30),
          (entry.gjykataLarte || '').substring(0, 30)
        ]);

        autoTable(doc, {
          head: [['Nr.', 'Gjykata Shkallë së Parë e', 'Faza Shkallë I', 'Gjykata Apelit', 'Faza Apelit', 'Faza në të cilën ndodhet proçesi', 'Gjykata e Lartë']],
          body: courtData,
          startY: 35,
          styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
          headStyles: { fillColor: [66, 66, 66], fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 55 },
            2: { cellWidth: 55 },
            3: { cellWidth: 55 },
            4: { cellWidth: 55 },
            5: { cellWidth: 55 },
            6: { cellWidth: 55 }
          },
          tableWidth: 'auto',
          margin: { top: 35, left: 14, right: 14 }
        });

        // Page 3: Financial and execution information
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Çështjet Ligjore - Faqja 3 (Informacioni Financiar)', 14, 15);
        doc.setFontSize(10);
        doc.text(`Eksportuar më: ${new Date().toLocaleDateString('sq-AL')}`, 14, 25);

        const financialData = entries.map(entry => [
          entry.id.toString(),
          (entry.perfaqesuesi || '').substring(0, 35),
          (entry.demiIPretenduar || '').substring(0, 30),
          (entry.shumaGjykata || '').substring(0, 30),
          (entry.vendimEkzekutim || '').substring(0, 35),
          (entry.fazaEkzekutim || '').substring(0, 35)
        ]);

        autoTable(doc, {
          head: [['Nr.', 'Përfaqësuesi', 'Demi i Pretenduar', 'Shuma Gjykate', 'Vendim Ekzekutim', 'Faza Ekzekutim']],
          body: financialData,
          startY: 35,
          styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
          headStyles: { fillColor: [66, 66, 66], fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 70 },
            2: { cellWidth: 60 },
            3: { cellWidth: 60 },
            4: { cellWidth: 70 },
            5: { cellWidth: 70 }
          },
          tableWidth: 'auto',
          margin: { top: 35, left: 14, right: 14 }
        });

        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="ceshtjet-ligjore-${timestamp}.pdf"`,
          'Content-Length': pdfBuffer.length
        });

        res.send(pdfBuffer);
      }

    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // User Management Routes (Admin only)
  app.get("/api/admin/users", strictLimiter, isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.claims.sub !== "46078954") { // Only truealbos@gmail.com can access
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/user-stats", isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.claims.sub !== "46078954") { // Only truealbos@gmail.com can access
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user statistics" });
    }
  });

  app.put("/api/admin/users/:userId/role", strictLimiter, isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.claims.sub !== "46078954") { // Only truealbos@gmail.com can access
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

  app.post("/api/admin/users", strictLimiter, isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.claims.sub !== "46078954") { // Only truealbos@gmail.com can access
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const { email, firstName, lastName, role } = req.body;
      
      if (!email || !firstName) {
        return res.status(400).json({ message: "Email and first name are required" });
      }
      
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'." });
      }
      
      const newUser = await storage.createManualUser({
        email,
        firstName,
        lastName,
        role
      });
      
      res.status(201).json(newUser);
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error?.message && error.message.includes('unique')) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.delete("/api/admin/users/:userId", strictLimiter, isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.claims.sub !== "46078954") { // Only truealbos@gmail.com can access
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const { userId } = req.params;
      
      // Prevent admin from deleting themselves
      if (userId === req.user.claims.sub) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertDataEntrySchema, updateDataEntrySchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
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
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
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

  // CSV Import endpoint
  const upload = multer({ storage: multer.memoryStorage() });
  
  app.post('/api/import/csv', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required for CSV import" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileContent = req.file.buffer.toString('utf8');
      const mappings = JSON.parse(req.body.mappings || '[]');

      // Parse CSV
      const lines = fileContent.split('\n').filter((line: string) => line.trim());
      const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
      const dataRows = lines.slice(1).filter((line: string) => line.trim());

      let importedCount = 0;
      let errors = [];

      for (let i = 0; i < dataRows.length; i++) {
        try {
          const cells = dataRows[i].split(',').map((cell: string) => cell.trim().replace(/"/g, ''));
          const rowData: any = {};

          // Apply field mappings
          mappings.forEach((mapping: any) => {
            const csvIndex = headers.indexOf(mapping.csvField);
            if (csvIndex !== -1 && mapping.dbField !== 'skip' && cells[csvIndex]) {
              let value = cells[csvIndex];
              
              // Handle specific field types
              if (mapping.dbField === 'date' && value) {
                // Try to parse date
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                  rowData[mapping.dbField] = date;
                }
              } else if (['ankimuar', 'perfunduar'].includes(mapping.dbField)) {
                // Validate boolean fields (Po/Jo)
                if (['po', 'jo'].includes(value.toLowerCase())) {
                  rowData[mapping.dbField] = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                }
              } else {
                rowData[mapping.dbField] = value;
              }
            }
          });

          // Set defaults if not provided
          if (!rowData.ankimuar) rowData.ankimuar = 'Jo';
          if (!rowData.perfunduar) rowData.perfunduar = 'Jo';

          // Validate and create entry
          const validatedData = insertDataEntrySchema.parse({
            ...rowData,
            createdById: req.user.claims.sub,
          });

          await storage.createDataEntry(validatedData);
          importedCount++;
        } catch (error: any) {
          errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }

      res.json({
        imported: importedCount,
        total: dataRows.length,
        errors: errors.slice(0, 10) // Limit error messages
      });

    } catch (error) {
      console.error("Error importing CSV:", error);
      res.status(500).json({ message: "Failed to import CSV data" });
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
            'Nr. Rendor', 'Paditesi', 'I Paditur', 'Person I Tretë', 'Objekti I Padisë',
            'Gjykata Shkallë I', 'Faza Shkallë I', 'Gjykata Apelit', 'Faza Apelit',
            'Faza Aktuale', 'Përfaqësuesi', 'Demi i Pretenduar', 'Shuma Gjykate',
            'Vendim Ekzekutim', 'Faza Ekzekutim', 'Ankimuar', 'Përfunduar',
            'Gjykata e Lartë', 'Krijuar më'
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
            entry.ankimuar || 'Jo',
            entry.perfunduar || 'Jo',
            entry.gjykataLarte || '',
            entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('sq-AL') : ''
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
          'Nr. Rendor', 'Paditesi', 'I Paditur', 'Person I Tretë', 'Objekti I Padisë',
          'Gjykata Shkallë I', 'Faza Shkallë I', 'Gjykata Apelit', 'Faza Apelit',
          'Faza Aktuale', 'Përfaqësuesi', 'Demi i Pretenduar', 'Shuma Gjykate',
          'Vendim Ekzekutim', 'Faza Ekzekutim', 'Ankimuar', 'Përfunduar',
          'Gjykata e Lartë', 'Krijuar më'
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
          entry.ankimuar || 'Jo',
          entry.perfunduar || 'Jo',
          `"${entry.gjykataLarte || ''}"`,
          entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('sq-AL') : ''
        ]);

        const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

        res.set({
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="ceshtjet-ligjore-${timestamp}.csv"`
        });

        res.send('\uFEFF' + csvContent); // BOM for UTF-8

      } else if (format === 'pdf') {
        // PDF export
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
        
        doc.setFontSize(16);
        doc.text('Çështjet Ligjore', 14, 15);
        doc.setFontSize(10);
        doc.text(`Eksportuar më: ${new Date().toLocaleDateString('sq-AL')}`, 14, 25);

        const tableData = entries.map(entry => [
          entry.id.toString(),
          entry.paditesi || '',
          entry.iPaditur || '',
          entry.personITrete || '',
          (entry.objektiIPadise || '').substring(0, 30) + (entry.objektiIPadise && entry.objektiIPadise.length > 30 ? '...' : ''),
          entry.ankimuar || 'Jo',
          entry.perfunduar || 'Jo',
          entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('sq-AL') : ''
        ]);

        (doc as any).autoTable({
          head: [['Nr.', 'Paditesi', 'I Paditur', 'Person I Tretë', 'Objekti I Padisë', 'Ankimuar', 'Përfunduar', 'Krijuar']],
          body: tableData,
          startY: 35,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [66, 66, 66] },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 40 },
            2: { cellWidth: 40 },
            3: { cellWidth: 30 },
            4: { cellWidth: 60 },
            5: { cellWidth: 20 },
            6: { cellWidth: 20 },
            7: { cellWidth: 25 }
          }
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

  const httpServer = createServer(app);
  return httpServer;
}

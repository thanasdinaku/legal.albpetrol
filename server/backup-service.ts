import { spawn } from 'child_process';
import { createWriteStream, createReadStream, existsSync, unlinkSync, statSync } from 'fs';
import { mkdir, readdir, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { pipeline } from 'stream/promises';
import { db } from './db';
import { systemBackups, dataEntries, users, systemSettings, sessions, databaseCheckpoints } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface BackupOptions {
  type: 'full' | 'data-only' | 'config-only';
  description?: string;
  createdBy?: string;
}

export interface BackupProgress {
  stage: string;
  progress: number;
  message: string;
  completed: boolean;
}

export class BackupService {
  private backupDir = './backups';
  
  constructor() {
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory() {
    try {
      await mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create backup directory:', error);
    }
  }

  async createBackup(options: BackupOptions, progressCallback?: (progress: BackupProgress) => void): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${options.type}-${timestamp}.sql`;
    const filepath = join(this.backupDir, filename);
    
    try {
      progressCallback?.({
        stage: 'Duke filluar backup-un',
        progress: 0,
        message: 'Përgatitja e sistemit për backup...',
        completed: false
      });

      let dumpCommand: string[];
      let tables: string[] = [];
      
      if (options.type === 'full') {
        dumpCommand = [
          'pg_dump',
          process.env.DATABASE_URL!,
          '--verbose',
          '--no-owner',
          '--no-privileges',
          '--format=custom'
        ];
        tables = ['data_entries', 'users', 'system_settings', 'sessions', 'database_checkpoints', 'system_backups'];
      } else if (options.type === 'data-only') {
        dumpCommand = [
          'pg_dump',
          process.env.DATABASE_URL!,
          '--verbose',
          '--no-owner',
          '--no-privileges',
          '--data-only',
          '--format=custom',
          '--table=data_entries',
          '--table=database_checkpoints'
        ];
        tables = ['data_entries', 'database_checkpoints'];
      } else { // config-only
        dumpCommand = [
          'pg_dump',
          process.env.DATABASE_URL!,
          '--verbose',
          '--no-owner',
          '--no-privileges',
          '--data-only',
          '--format=custom',
          '--table=users',
          '--table=system_settings',
          '--table=sessions'
        ];
        tables = ['users', 'system_settings', 'sessions'];
      }

      progressCallback?.({
        stage: 'Duke eksportuar të dhënat',
        progress: 25,
        message: 'Duke krijuar dump-in e bazës së të dhënave...',
        completed: false
      });

      await this.executePgDump(dumpCommand, filepath);

      progressCallback?.({
        stage: 'Duke llogaritur checksum',
        progress: 75,
        message: 'Duke verifikuar integritetin e të dhënave...',
        completed: false
      });

      const checksum = await this.calculateChecksum(filepath);
      const fileSize = statSync(filepath).size;
      const recordCount = await this.getRecordCount(tables);

      progressCallback?.({
        stage: 'Duke regjistruar backup-un',
        progress: 90,
        message: 'Duke përfunduar regjistrimin...',
        completed: false
      });

      // Save backup info to database
      const [backupRecord] = await db.insert(systemBackups).values({
        filename,
        filepath,
        size: fileSize,
        type: options.type,
        description: options.description,
        tables: JSON.stringify(tables),
        recordCount,
        checksum,
        createdBy: options.createdBy
      }).returning();

      progressCallback?.({
        stage: 'Backup i kompletuar',
        progress: 100,
        message: 'Backup-u u krijua me sukses!',
        completed: true
      });

      return backupRecord.id;
    } catch (error) {
      console.error('Backup creation failed:', error);
      
      // Clean up partial backup file
      if (existsSync(filepath)) {
        unlinkSync(filepath);
      }
      
      throw new Error(`Backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async restoreBackup(backupId: string, progressCallback?: (progress: BackupProgress) => void): Promise<void> {
    try {
      progressCallback?.({
        stage: 'Duke gjetur backup-un',
        progress: 0,
        message: 'Duke kërkuar backup-un në sistem...',
        completed: false
      });

      const [backup] = await db.select().from(systemBackups).where(eq(systemBackups.id, backupId));
      
      if (!backup) {
        throw new Error('Backup not found');
      }

      if (!existsSync(backup.filepath)) {
        throw new Error('Backup file not found on disk');
      }

      progressCallback?.({
        stage: 'Duke verifikuar backup-un',
        progress: 10,
        message: 'Duke kontrolluar integritetin e backup-ut...',
        completed: false
      });

      // Verify backup integrity
      const currentChecksum = await this.calculateChecksum(backup.filepath);
      if (currentChecksum !== backup.checksum) {
        throw new Error('Backup file integrity check failed');
      }

      progressCallback?.({
        stage: 'Duke përgatitur restaurimin',
        progress: 25,
        message: 'Duke përgatitur bazën e të dhënave për restaurim...',
        completed: false
      });

      // Create a backup of current state before restore
      const preRestoreBackupId = await this.createBackup({
        type: 'full',
        description: `Pre-restore backup before restoring ${backup.filename}`,
        createdBy: backup.createdBy || undefined
      });

      progressCallback?.({
        stage: 'Duke restauruar të dhënat',
        progress: 50,
        message: 'Duke aplikuar backup-un në bazën e të dhënave...',
        completed: false
      });

      // Execute restore
      await this.executePgRestore(backup.filepath, backup.type);

      progressCallback?.({
        stage: 'Duke verifikuar restaurimin',
        progress: 85,
        message: 'Duke kontrolluar suksesin e restaurimit...',
        completed: false
      });

      // Verify restore
      const tablesInBackup = JSON.parse(backup.tables as string);
      const currentRecordCount = await this.getRecordCount(tablesInBackup);
      
      progressCallback?.({
        stage: 'Restaurimi i kompletuar',
        progress: 100,
        message: `Restaurimi u kompletua me sukses! ${currentRecordCount} regjistra u restauruan.`,
        completed: true
      });

    } catch (error) {
      console.error('Backup restore failed:', error);
      throw new Error(`Backup restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBackups(): Promise<any[]> {
    try {
      const backups = await db.select().from(systemBackups).orderBy(systemBackups.createdAt);
      
      // Verify files still exist and update info if needed
      const validBackups = [];
      for (const backup of backups) {
        if (existsSync(backup.filepath)) {
          const stats = statSync(backup.filepath);
          validBackups.push({
            ...backup,
            size: stats.size,
            tables: JSON.parse(backup.tables as string)
          });
        } else {
          // Remove database record for missing file
          await db.delete(systemBackups).where(eq(systemBackups.id, backup.id));
        }
      }
      
      return validBackups;
    } catch (error) {
      console.error('Error fetching backups:', error);
      throw error;
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    try {
      const [backup] = await db.select().from(systemBackups).where(eq(systemBackups.id, backupId));
      
      if (!backup) {
        throw new Error('Backup not found');
      }

      // Delete file from disk
      if (existsSync(backup.filepath)) {
        unlinkSync(backup.filepath);
      }

      // Delete database record
      await db.delete(systemBackups).where(eq(systemBackups.id, backupId));
      
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw error;
    }
  }

  async getSystemStatus(): Promise<any> {
    try {
      const [dataEntriesCount] = await db.select().from(dataEntries);
      const [usersCount] = await db.select().from(users);
      const latestBackup = await db.select().from(systemBackups).orderBy(systemBackups.createdAt).limit(1);
      
      const totalRecords = await this.getRecordCount(['data_entries', 'users', 'system_settings']);
      
      return {
        database: {
          status: 'Connected',
          lastCheck: new Date().toISOString()
        },
        totalRecords,
        lastBackup: latestBackup.length > 0 ? latestBackup[0].createdAt : null
      };
    } catch (error) {
      console.error('Error getting system status:', error);
      return {
        database: { status: 'Error' },
        totalRecords: 0,
        lastBackup: null
      };
    }
  }

  private async executePgDump(command: string[], outputFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn(command[0], command.slice(1));
      const writeStream = createWriteStream(outputFile);
      
      process.stdout.pipe(writeStream);
      
      let errorOutput = '';
      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`pg_dump failed with code ${code}: ${errorOutput}`));
        }
      });
      
      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  private async executePgRestore(backupFile: string, backupType: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const restoreCommand: string[] = [
        'pg_restore',
        '--verbose',
        '--clean',
        '--no-owner',
        '--no-privileges',
        '--dbname',
        process.env.DATABASE_URL!,
        backupFile
      ];
      
      const restoreProcess = spawn(restoreCommand[0], restoreCommand.slice(1));
      
      let errorOutput = '';
      restoreProcess.stderr.on('data', (data: any) => {
        errorOutput += data.toString();
      });
      
      restoreProcess.on('close', (code: any) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`pg_restore failed with code ${code}: ${errorOutput}`));
        }
      });
      
      restoreProcess.on('error', (error: any) => {
        reject(error);
      });
    });
  }

  private async calculateChecksum(filepath: string): Promise<string> {
    const hash = createHash('sha256');
    const stream = createReadStream(filepath);
    
    await pipeline(stream, hash);
    return hash.digest('hex');
  }

  private async getRecordCount(tables: string[]): Promise<number> {
    try {
      let totalCount = 0;
      
      for (const tableName of tables) {
        let count = 0;
        
        switch (tableName) {
          case 'data_entries':
            const dataEntriesResult = await db.select().from(dataEntries);
            count = dataEntriesResult.length;
            break;
          case 'users':
            const usersResult = await db.select().from(users);
            count = usersResult.length;
            break;
          case 'system_settings':
            const settingsResult = await db.select().from(systemSettings);
            count = settingsResult.length;
            break;
          case 'sessions':
            const sessionsResult = await db.select().from(sessions);
            count = sessionsResult.length;
            break;
          case 'database_checkpoints':
            const checkpointsResult = await db.select().from(databaseCheckpoints);
            count = checkpointsResult.length;
            break;
          case 'system_backups':
            const backupsResult = await db.select().from(systemBackups);
            count = backupsResult.length;
            break;
        }
        
        totalCount += count;
      }
      
      return totalCount;
    } catch (error) {
      console.error('Error counting records:', error);
      return 0;
    }
  }
}
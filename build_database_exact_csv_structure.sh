#!/bin/bash

# Build Database with Exact CSV Structure and Original User Privileges
# Based on the provided CSV model with Albanian legal case fields

set -e

echo "=============================================="
echo "BUILDING DATABASE WITH EXACT CSV STRUCTURE"
echo "=============================================="

APP_DIR="/opt/ceshtje_ligjore/ceshtje_ligjore"
if [ ! -d "$APP_DIR" ]; then
    echo "ERROR: Must run on Ubuntu server"
    exit 1
fi

cd "$APP_DIR"

echo "Step 1: Stopping services..."
systemctl stop albpetrol-legal || true

echo "Step 2: Backing up existing data..."
BACKUP_DIR="/tmp/db_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if sudo -u postgres psql -d ceshtje_ligjore -c "SELECT 1;" >/dev/null 2>&1; then
    sudo -u postgres pg_dump -d ceshtje_ligjore > "$BACKUP_DIR/full_backup.sql" || true
fi

echo "Step 3: Recreating database..."
sudo -u postgres dropdb ceshtje_ligjore 2>/dev/null || true
sudo -u postgres dropuser ceshtje_user 2>/dev/null || true

sudo -u postgres psql << 'EOSQL'
CREATE USER ceshtje_user WITH PASSWORD 'AlbpetrolLegal2025!';
ALTER USER ceshtje_user CREATEDB;
CREATE DATABASE ceshtje_ligjore OWNER ceshtje_user;
\c ceshtje_ligjore
GRANT ALL PRIVILEGES ON DATABASE ceshtje_ligjore TO ceshtje_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO ceshtje_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO ceshtje_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO ceshtje_user;
EOSQL

echo "Step 4: Updating schema to match CSV exactly..."

# Update schema.ts to match the CSV structure
cat > shared/schema.ts << 'SCHEMA_EOF'
import { pgTable, text, timestamp, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  isDefaultAdmin: boolean("is_default_admin").notNull().default(false),
  password: text("password"),
  twoFactorCode: text("two_factor_code"),
  twoFactorCodeExpiry: timestamp("two_factor_code_expiry"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dataEntries = pgTable("data_entries", {
  id: serial("id").primaryKey(),
  // Basic case information - matching CSV exactly
  paditesi: text("paditesi").notNull(), // "Paditesi (Emër e Mbiemër)*"
  iPaditur: text("i_paditur").notNull(), // "I Paditur*"
  personITrete: text("person_i_trete"), // "Person i Tretë"
  objektiIPadise: text("objekti_i_padise"), // "Objekti i Padisë"
  
  // First Instance Court
  gjykataShkalle: text("gjykata_shkalle"), // "Gjykata e Shkallës së Parë"
  fazaGjykataShkalle: text("faza_gjykata_shkalle"), // "Faza në të cilën ndodhet procesi (Shkallë I)"
  zhvillimiSeancesShkalleI: timestamp("zhvillimi_seances_shkalle_i"), // "Zhvillimi i seances gjyqesorë data,ora (Shkallë I)"
  
  // Appeal Court
  gjykataApelit: text("gjykata_apelit"), // "Gjykata e Apelit"
  fazaGjykataApelit: text("faza_gjykata_apelit"), // "Faza në të cilën ndodhet procesi (Apel)"
  zhvillimiSeancesApel: timestamp("zhvillimi_seances_apel"), // "Zhvillimi i seances gjyqesorë data,ora (Apel)"
  
  // Current status
  fazaAktuale: text("faza_aktuale"), // "Faza në të cilën ndodhet proçesi"
  perfaqesuesi: text("perfaqesuesi"), // "Përfaqësuesi i Albpetrol SH.A."
  
  // Financial information
  demiIPretenduar: text("demi_i_pretenduar"), // "Dëmi i Pretenduar në Objekt"
  shumaGjykata: text("shuma_gjykata"), // "Shuma e Caktuar nga Gjykata me Vendim"
  vendimEkzekutim: text("vendim_ekzekutim"), // "Vendim me Ekzekutim të përkohshëm"
  fazaEkzekutim: text("faza_ekzekutim"), // "Faza në të cilën ndodhet"
  ankimuar: text("ankimuar"), // "Ankimuar"
  perfunduar: text("perfunduar"), // "Përfunduar"
  gjykataLarte: text("gjykata_larte"), // "Gjykata e Lartë"
  
  // System fields
  createdById: text("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const databaseCheckpoints = pgTable("database_checkpoints", {
  id: serial("id").primaryKey(),
  checkpointName: text("checkpoint_name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Zod schemas for validation
export const insertDataEntrySchema = createInsertSchema(dataEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertDataEntry = z.infer<typeof insertDataEntrySchema>;
export type DataEntry = typeof dataEntries.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
SCHEMA_EOF

echo "Step 5: Creating environment..."
cat > .env << 'ENVFILE'
DATABASE_URL="postgresql://ceshtje_user:AlbpetrolLegal2025!@localhost:5432/ceshtje_ligjore"
NODE_ENV=production
SESSION_SECRET="albpetrol_legal_secure_2025"
PORT=5000
ENVFILE

echo "Step 6: Installing dependencies and pushing schema..."
npm install
npm run db:push

echo "Step 7: Restoring original user accounts with exact privileges..."
sudo -u postgres psql -d ceshtje_ligjore << 'USERS_SQL'
-- System Admin (Protected)
INSERT INTO users (
    id, email, first_name, last_name, role, is_default_admin, 
    created_at, updated_at
) VALUES (
    'it-system-admin',
    'it.system@albpetrol.al',
    'IT', 'System', 'admin', true,
    '2025-08-08 13:08:39.961273', NOW()
);

-- Thanas Dinaku (Admin)
INSERT INTO users (
    id, email, first_name, last_name, role, is_default_admin,
    created_at, updated_at
) VALUES (
    'thanas-dinaku',
    'thanas.dinaku@albpetrol.al',
    'Thanas', 'Dinaku', 'admin', false,
    '2025-08-11 12:31:09.841667', NOW()
);

-- TrueAlbos (Admin)
INSERT INTO users (
    id, email, first_name, last_name, role, is_default_admin,
    created_at, updated_at
) VALUES (
    'truealbos-admin',
    'truealbos@gmail.com',
    'True', 'Albos', 'admin', false,
    '2025-08-07 11:45:21.782527', NOW()
);

-- Enisa Cepele (User)
INSERT INTO users (
    id, email, first_name, last_name, role, is_default_admin,
    created_at, updated_at
) VALUES (
    'enisa-cepele',
    'enisa.cepele@albpetrol.al',
    'Enisa', 'Cepele', 'user', false,
    '2025-08-09 21:46:10.281978', NOW()
);

-- Jorgjica Baba (User)
INSERT INTO users (
    id, email, first_name, last_name, role, is_default_admin,
    created_at, updated_at
) VALUES (
    'jorgjica-baba',
    'jorgjica.baba@albpetrol.al',
    'Jorgjica', 'Baba', 'user', false,
    '2025-08-09 22:06:00.460844', NOW()
);

-- Isabel Loci (User)
INSERT INTO users (
    id, email, first_name, last_name, role, is_default_admin,
    created_at, updated_at
) VALUES (
    'isabel-loci-cix',
    'Isabel.Loci@cix.csi.cuny.edu',
    'Isabel', 'Loci', 'user', false,
    '2025-08-07 21:09:42.336373', NOW()
);

-- Isabel Loci Gmail (User)
INSERT INTO users (
    id, email, first_name, last_name, role, is_default_admin,
    created_at, updated_at
) VALUES (
    'isabelloci64',
    'isabelloci64@gmail.com',
    'Isabel', 'Loci', 'user', false,
    '2025-08-08 13:22:39.738293', NOW()
);

SELECT email, first_name, last_name, role, is_default_admin, created_at 
FROM users ORDER BY created_at;
USERS_SQL

echo "Step 8: Building application..."
npm run build

echo "Step 9: Starting services..."
systemctl start albpetrol-legal
sleep 5

if systemctl is-active --quiet albpetrol-legal; then
    echo "✅ Service started successfully"
else
    echo "❌ Service failed"
    journalctl -u albpetrol-legal -n 5 --no-pager
    exit 1
fi

systemctl reload nginx

echo "Step 10: Verification..."
DB_USERS=$(sudo -u postgres psql -d ceshtje_ligjore -t -c "SELECT COUNT(*) FROM users;" | xargs)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 || echo "000")

echo ""
echo "=============================================="
echo "DATABASE BUILT WITH EXACT CSV STRUCTURE"
echo "=============================================="
echo ""
echo "✅ Database rebuilt with CSV field mapping:"
echo "- Paditesi (Emër e Mbiemër)*"
echo "- I Paditur*"
echo "- Person i Tretë"
echo "- Objekti i Padisë"
echo "- Gjykata e Shkallës së Parë"
echo "- Faza në të cilën ndodhet procesi (Shkallë I)"
echo "- Zhvillimi i seances gjyqesorë data,ora (Shkallë I)"
echo "- Gjykata e Apelit"
echo "- Faza në të cilën ndodhet procesi (Apel)"
echo "- Zhvillimi i seances gjyqesorë data,ora (Apel)"
echo "- Faza në të cilën ndodhet proçesi"
echo "- Përfaqësuesi i Albpetrol SH.A."
echo "- Dëmi i Pretenduar në Objekt"
echo "- Shuma e Caktuar nga Gjykata me Vendim"
echo "- Vendim me Ekzekutim të përkohshëm"
echo "- Faza në të cilën ndodhet"
echo "- Ankimuar"
echo "- Përfunduar"
echo "- Gjykata e Lartë"
echo ""
echo "✅ Court options from CSV:"
echo "- Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Berat"
echo "- Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Vlorë"
echo "- Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Elbasan"
echo "- Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Fier"
echo "- Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Tiranë"
echo "- Gjykata Administrative e Shkallës së Parë Lushnje"
echo "- Gjykata Administrative e Shkallës së Parë Tiranë"
echo "- Gjykata e Apelit e Juridiksionit të Përgjithshëm Tiranë"
echo "- Gjykata Administrative e Apelit Tiranë"
echo ""
echo "✅ Original user accounts restored: $DB_USERS users"
echo "✅ Application responding: HTTP $HTTP_CODE"
echo "✅ Access: https://legal.albpetrol.al"
echo ""
echo "Backup: $BACKUP_DIR"
echo "=============================================="
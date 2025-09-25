import { sql } from "drizzle-orm";
import { db } from "./db";
import { hashPassword } from "./auth";

/**
 * Initialize database with essential data
 * Creates admin user if it doesn't exist
 */
export async function initializeDatabase() {
  try {
    console.log("🔧 Initializing database...");
    
    // Generate correct password hash using scrypt (same as auth system)
    const correctPasswordHash = await hashPassword("Admin2025!");
    console.log("🔑 Generated scrypt password hash for admin user");
    
    // Check if admin user exists
    const adminUser = await db.execute(sql`
      SELECT id, email, password FROM users WHERE email = 'it.system@albpetrol.al'
    `);
    
    if (adminUser.rows.length === 0) {
      console.log("👤 Creating admin user: it.system@albpetrol.al");
      
      // Create admin user with all required fields
      await db.execute(sql`
        INSERT INTO users (
          id, 
          email, 
          first_name, 
          last_name, 
          role, 
          is_default_admin, 
          password,
          created_at, 
          updated_at
        ) VALUES (
          'it-system-admin',
          'it.system@albpetrol.al',
          'IT',
          'System',
          'admin',
          true,
          ${correctPasswordHash},
          NOW(),
          NOW()
        ) ON CONFLICT (email) DO UPDATE SET
          role = 'admin',
          is_default_admin = true,
          password = ${correctPasswordHash},
          updated_at = NOW()
      `);
      
      console.log("✅ Admin user created successfully");
    } else {
      console.log("✅ Admin user already exists");
      
      // Check if password format is correct (scrypt format: hash.salt)
      const existingPassword = adminUser.rows[0].password as string;
      if (!existingPassword || !existingPassword.includes('.') || existingPassword.startsWith('$2b$')) {
        console.log("🔧 Updating admin password to correct scrypt format");
        await db.execute(sql`
          UPDATE users 
          SET password = ${correctPasswordHash}, updated_at = NOW()
          WHERE email = 'it.system@albpetrol.al'
        `);
        console.log("✅ Admin password updated to scrypt format");
      } else {
        console.log("✅ Admin password already in correct scrypt format");
      }
    }
    
    console.log("✅ Database initialization completed");
    
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    // Don't throw error - let the app continue running
    // The user can manually create admin user if needed
  }
}

/**
 * Create admin user manually (for emergency situations)
 */
export async function createAdminUser() {
  try {
    console.log("🔧 Manually creating admin user...");
    
    // Generate correct password hash using scrypt (same as auth system)
    const correctPasswordHash = await hashPassword("Admin2025!");
    
    await db.execute(sql`
      INSERT INTO users (
        id, 
        email, 
        first_name, 
        last_name, 
        role, 
        is_default_admin, 
        password,
        created_at, 
        updated_at
      ) VALUES (
        'it-system-admin',
        'it.system@albpetrol.al',
        'IT',
        'System',
        'admin',
        true,
        ${correctPasswordHash},
        NOW(),
        NOW()
      ) ON CONFLICT (email) DO UPDATE SET
        role = 'admin',
        is_default_admin = true,
        password = ${correctPasswordHash},
        updated_at = NOW()
    `);
    
    console.log("✅ Admin user created/updated successfully");
    return true;
    
  } catch (error) {
    console.error("❌ Failed to create admin user:", error);
    return false;
  }
}
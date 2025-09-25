import { sql } from "drizzle-orm";
import { db } from "./db";

/**
 * Initialize database with essential data
 * Creates admin user if it doesn't exist
 */
export async function initializeDatabase() {
  try {
    console.log("🔧 Initializing database...");
    
    // Check if admin user exists
    const adminUser = await db.execute(sql`
      SELECT id, email FROM users WHERE email = 'it.system@albpetrol.al'
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
          '$2b$10$vp1qyF1Ly6qZ1Vq8iX1pMeH5Dw6ZK9LnB8WmTc7Qr2F5Ng4sM6xPO',
          NOW(),
          NOW()
        ) ON CONFLICT (email) DO UPDATE SET
          role = 'admin',
          is_default_admin = true,
          updated_at = NOW()
      `);
      
      console.log("✅ Admin user created successfully");
    } else {
      console.log("✅ Admin user already exists");
    }
    
    // Ensure admin user has correct password hash for 'Admin2025!'
    await db.execute(sql`
      UPDATE users 
      SET password = '$2b$10$vp1qyF1Ly6qZ1Vq8iX1pMeH5Dw6ZK9LnB8WmTc7Qr2F5Ng4sM6xPO'
      WHERE email = 'it.system@albpetrol.al' AND (password IS NULL OR password = '')
    `);
    
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
        '$2b$10$vp1qyF1Ly6qZ1Vq8iX1pMeH5Dw6ZK9LnB8WmTc7Qr2F5Ng4sM6xPO',
        NOW(),
        NOW()
      ) ON CONFLICT (email) DO UPDATE SET
        role = 'admin',
        is_default_admin = true,
        password = '$2b$10$vp1qyF1Ly6qZ1Vq8iX1pMeH5Dw6ZK9LnB8WmTc7Qr2F5Ng4sM6xPO',
        updated_at = NOW()
    `);
    
    console.log("✅ Admin user created/updated successfully");
    return true;
    
  } catch (error) {
    console.error("❌ Failed to create admin user:", error);
    return false;
  }
}
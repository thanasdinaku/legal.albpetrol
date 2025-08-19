import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: 'user' | 'admin';
      password: string;
      profileImageUrl: string | null;
      isDefaultAdmin: boolean | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    }
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "default-secret-key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

export function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false);
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("Failed to deserialize user:", error);
      done(null, false); // Don't fail, just return false
    }
  });

  // Login route (both endpoints for compatibility)
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err: any, user: User | false) => {
      if (err) {
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // All users including default admin must use 2FA
      
      try {
        // Generate 6-digit verification code for non-admin users
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save code to database
        await storage.saveTwoFactorCode(user.id, verificationCode);
        
        // Send verification code via email
        const { sendTwoFactorCode } = await import("./email");
        await sendTwoFactorCode(user, verificationCode);
        
        // Return success with indication that 2FA is required
        res.status(200).json({ 
          requiresTwoFactor: true,
          userId: user.id,
          email: user.email
        });
      } catch (error) {
        console.error("Failed to send two-factor code:", error);
        res.status(500).json({ message: "Failed to send verification code. Please try again." });
      }
    })(req, res, next);
  });

  app.post("/api/auth/verify-2fa", async (req, res) => {
    try {
      const { userId, code } = req.body;
      
      if (!userId || !code) {
        return res.status(400).json({ message: "User ID and verification code are required" });
      }
      
      const isValid = await storage.verifyTwoFactorCode(userId, code);
      
      if (isValid) {
        // Get the user for the session
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Create session
        req.login(user, (err) => {
          if (err) {
            return res.status(500).json({ message: "Login failed" });
          }
          
          // Remove password from response for security
          const { password, twoFactorCode, twoFactorCodeExpiry, ...userWithoutPassword } = user;
          res.status(200).json(userWithoutPassword);
        });
      } else {
        res.status(401).json({ message: "Invalid or expired verification code" });
      }
    } catch (error) {
      console.error("2FA verification error:", error);
      res.status(500).json({ message: "Verification failed. Please try again." });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.redirect("/auth");
    });
  });

  // Handle GET logout for direct navigation
  app.get("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.redirect("/auth");
    });
  });

  // Get current user route
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    // Remove password from response for security
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Change password route
  // Password validation function
  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push("Fjalëkalimi duhet të jetë të paktën 8 karaktere");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Fjalëkalimi duhet të përmbajë të paktën një shkronjë të madhe");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Fjalëkalimi duhet të përmbajë të paktën një numër");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Fjalëkalimi duhet të përmbajë të paktën një karakter special");
    }
    
    return { isValid: errors.length === 0, errors };
  };

  app.put("/api/auth/change-password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user!;
      
      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          message: "Fjalëkalimi nuk plotëson kriteret e kërkuara",
          errors: passwordValidation.errors 
        });
      }
      
      // Verify current password
      if (!(await comparePasswords(currentPassword, user.password))) {
        return res.status(400).json({ message: "Fjalëkalimi aktual është i gabuar" });
      }
      
      // Hash new password and update
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);
      
      res.json({ message: "Fjalëkalimi u ndryshua me sukses" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Dështoi ndryshimi i fjalëkalimit" });
    }
  });
}

// Authentication middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Admin middleware
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || req.user!.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}
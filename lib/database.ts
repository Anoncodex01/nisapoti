import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// TypeScript declaration for global pool
declare global {
  var _mysqlPool: mysql.Pool | undefined;
}

// Validate required environment variables
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  throw new Error('Missing required database environment variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
}

// Database configuration - using environment variables
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 5, // Keep low to prevent connection leaks
  queueLimit: 0
};

// Create connection pool with Next.js hot reload protection
let pool: mysql.Pool;

if (!global._mysqlPool) {
  global._mysqlPool = mysql.createPool(dbConfig);
}

pool = global._mysqlPool;

export class DatabaseService {
  private pool = pool;

  async testConnection(): Promise<boolean> {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }


  async query(sql: string, params: any[] = []): Promise<any[]> {
    try {
      const [rows] = await pool.query(sql, params);
      return rows as any[];
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async queryOne(sql: string, params: any[] = []): Promise<any | null> {
    try {
      const rows = await this.query(sql, params);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Database queryOne error:', error);
      throw error;
    }
  }

  async execute(sql: string, params: any[] = []): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const [result] = await pool.execute(sql, params);
      return { success: true, data: result };
    } catch (error) {
      console.error('Database execute error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown database error' 
      };
    }
  }

  // User-related methods
  async getUserByEmail(email: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const user = await this.queryOne(
        'SELECT id, email, password, email_verified, created_at, updated_at, status FROM users WHERE email = ?',
        [email]
      );
      return { success: true, data: user };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get user' 
      };
    }
  }

  async getUserById(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const user = await this.queryOne(
        'SELECT id, email, email_verified, created_at, updated_at, status FROM users WHERE id = ?',
        [id]
      );
      return { success: true, data: user };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get user' 
      };
    }
  }

  async createUser(email: string, password: string, name?: string, username?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Generate user ID
      const userId = this.generateId();
      
      // Insert user (email not verified initially)
      const userResult = await this.execute(
        'INSERT INTO users (id, email, password, email_verified, created_at, updated_at, status) VALUES (?, ?, ?, 0, NOW(), NOW(), "active")',
        [userId, email, hashedPassword]
      );

      if (!userResult.success) {
        return userResult;
      }

      // Don't create profile immediately - wait for email verification
      // Profile will be created after email verification in the profile completion step

      // Get the created user
      const user = await this.getUserByEmail(email);
      return { success: true, data: user.data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create user' 
      };
    }
  }

  async verifyPassword(email: string, password: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const user = await this.getUserByEmail(email);
      
      if (!user.success || !user.data) {
        return { success: false, error: 'User not found' };
      }

      const isPasswordValid = await bcrypt.compare(password, user.data.password);
      
      if (!isPasswordValid) {
        return { success: false, error: 'Invalid password' };
      }

      // Check if user email is verified
      if (!user.data.email_verified) {
        return { success: false, error: 'Please verify your email before logging in' };
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user.data;
      return { success: true, data: userWithoutPassword };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to verify password' 
      };
    }
  }

  async getProfileByUserId(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const profile = await this.queryOne(
        'SELECT id, user_id, display_name, username, bio, category, website, avatar_url, created_at, updated_at FROM profiles WHERE user_id = ?',
        [userId]
      );
      return { success: true, data: profile };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get profile' 
      };
    }
  }

  async updateProfile(userId: string, profileData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { display_name, username, bio, category, website, avatar_url } = profileData;
      
      const result = await this.execute(
        `UPDATE profiles 
         SET display_name = ?, username = ?, bio = ?, category = ?, website = ?, avatar_url = ?, updated_at = NOW()
         WHERE user_id = ?`,
        [display_name, username, bio, category, website, avatar_url, userId]
      );

      if (!result.success) {
        return result;
      }

      // Get updated profile
      const profile = await this.getProfileByUserId(userId);
      return { success: true, data: profile.data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update profile' 
      };
    }
  }

  // Utility method to generate IDs
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

}

// Export singleton instance
export const db = new DatabaseService();

// Export individual functions for backward compatibility
export async function testConnection(): Promise<boolean> {
  return db.testConnection();
}

export async function getUserByEmail(email: string): Promise<{ success: boolean; data?: any; error?: string }> {
  return db.getUserByEmail(email);
}

export async function executeQuery(sql: string, params: any[] = []): Promise<{ success: boolean; data?: any; error?: string }> {
  return db.execute(sql, params);
}

// Export connectToDatabase function for backward compatibility
export async function connectToDatabase() {
  return pool;
}

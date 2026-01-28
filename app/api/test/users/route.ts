import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

const db = new DatabaseService();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Test database connection first
    const dbConnected = await db.testConnection();
    
    if (!dbConnected) {
      return NextResponse.json({
        success: false,
        error: 'Database not connected'
      });
    }

    // Fetch users and profiles
    const users = await db.query('SELECT id, email, created_at FROM users LIMIT 10');
    const profiles = await db.query('SELECT user_id, username, display_name FROM profiles LIMIT 10');

    return NextResponse.json({
      success: true,
      data: {
        users,
        profiles
      }
    });

  } catch (error) {
    console.error('❌ Test users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

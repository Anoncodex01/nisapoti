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

    // Check table structures
    const earningsStructure = await db.query('DESCRIBE earnings');
    const supportersStructure = await db.query('DESCRIBE supporters');
    const pageViewsStructure = await db.query('DESCRIBE page_views');

    return NextResponse.json({
      success: true,
      data: {
        earnings: earningsStructure,
        supporters: supportersStructure,
        pageViews: pageViewsStructure
      }
    });

  } catch (error) {
    console.error('❌ Test tables error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table structures' },
      { status: 500 }
    );
  }
}

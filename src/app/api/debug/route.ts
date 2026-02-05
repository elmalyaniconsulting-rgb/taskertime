export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL_exists: !!process.env.DATABASE_URL,
      DATABASE_URL_start: process.env.DATABASE_URL?.substring(0, 40) + '...',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
      NEXTAUTH_SECRET_exists: !!process.env.NEXTAUTH_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    },
  };

  // Test 1: Session
  try {
    const session = await getServerSession(authOptions);
    results.session = session || 'NO SESSION (not logged in)';
  } catch (e: any) {
    results.session_error = e.message;
  }

  // Test 2: Prisma import
  try {
    const { default: prisma } = await import('@/lib/prisma');
    results.prisma_import = 'OK';

    // Test 3: Raw query
    try {
      const raw = await prisma.$queryRaw`SELECT 1 as test`;
      results.db_connection = 'OK';
    } catch (e: any) {
      results.db_connection_error = e.message;
    }

    // Test 4: Check tables exist
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;
      results.tables = tables;
    } catch (e: any) {
      results.tables_error = e.message;
    }

    // Test 5: Count users
    try {
      const count = await prisma.user.count();
      results.users_count = count;
    } catch (e: any) {
      results.users_count_error = e.message;
    }

    // Test 6: List users
    try {
      const users = await prisma.user.findMany({
        select: { id: true, email: true, firstName: true, lastName: true },
        take: 5,
      });
      results.users = users;
    } catch (e: any) {
      results.users_list_error = e.message;
    }

  } catch (e: any) {
    results.prisma_import_error = e.message;
  }

  return NextResponse.json(results, { status: 200 });
}

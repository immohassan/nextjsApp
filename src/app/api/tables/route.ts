import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    const tables = await prisma.tableConfig.findMany({
      include: {
        _count: { select: { rows: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = tables.map(t => ({
      id: t.id,
      name: t.name,
      createdAt: t.createdAt,
      _count: { rows: t._count.rows },
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 })
  }
}

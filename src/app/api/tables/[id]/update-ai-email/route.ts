import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rowId, tableId, aiEmail } = body

    if (!rowId || !tableId || !aiEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: rowId, tableId, and aiEmail are required' },
        { status: 400 }
      )
    }

    // Verify the row belongs to the table
    const row = await prisma.tables.findFirst({
      where: {
        id: rowId,
        tableConfigId: tableId,
      },
    })

    if (!row) {
      return NextResponse.json(
        { error: 'Row not found or does not belong to the specified table' },
        { status: 404 }
      )
    }

    // Check if AI email already exists (to avoid double deduction)
    const existingRow = await prisma.tables.findUnique({
      where: { id: rowId },
    })

    // Update the AI Personalized Email field
    const updated = await prisma.tables.update({
      where: { id: rowId },
      data: { aiPersonalizedEmail: aiEmail } as any,
    })

    // Deduct 1 credit only if AI email was previously empty/null
    if (!(existingRow as any)?.aiPersonalizedEmail || (existingRow as any).aiPersonalizedEmail.trim() === '') {
      try {
        // Get or create credits record
        const credits = await prisma.$queryRaw`
          SELECT id, balance FROM Credits LIMIT 1
        ` as any[]
        
        if (credits.length > 0) {
          const creditRecord = credits[0]
          if (creditRecord.balance >= 1) {
            await prisma.$queryRaw`
              UPDATE Credits 
              SET balance = balance - 1, updatedAt = datetime('now')
              WHERE id = ${creditRecord.id}
            `
          }
        } else {
          // Create new credits record with deduction
          await prisma.$queryRaw`
            INSERT INTO Credits (id, balance, createdAt, updatedAt) 
            VALUES (${randomUUID()}, 249, datetime('now'), datetime('now'))
          `
        }
      } catch (creditError) {
        // Don't fail the request if credit deduction fails
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: updated.id, aiPersonalizedEmail: (updated as any).aiPersonalizedEmail },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update AI email' },
      { status: 500 }
    )
  }
}


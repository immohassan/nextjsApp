import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rowId, tableId, email } = body

    if (!rowId || !tableId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: rowId, tableId, and email are required' },
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

    // Check if email already exists (to avoid double deduction)
    const existingRow = await prisma.tables.findUnique({
      where: { id: rowId },
      select: { email: true },
    })

    // Update the email field
    const updated = await prisma.tables.update({
      where: { id: rowId },
      data: { email: email },
    })

    // Deduct 2 credits only if email was previously empty/null
    if (!existingRow?.email || existingRow.email.trim() === '') {
      try {
        // Get or create credits record
        const credits = await prisma.$queryRaw`
          SELECT id, balance FROM Credits LIMIT 1
        ` as any[]
        
        if (credits.length > 0) {
          const creditRecord = credits[0]
          if (creditRecord.balance >= 2) {
            await prisma.$queryRaw`
              UPDATE Credits 
              SET balance = balance - 2, updatedAt = datetime('now')
              WHERE id = ${creditRecord.id}
            `
          }
        } else {
          // Create new credits record with deduction
          await prisma.$queryRaw`
            INSERT INTO Credits (id, balance, createdAt, updatedAt) 
            VALUES (${randomUUID()}, 248, datetime('now'), datetime('now'))
          `
        }
      } catch (creditError) {
        // Don't fail the request if credit deduction fails
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: updated.id, email: updated.email },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update email' },
      { status: 500 }
    )
  }
}


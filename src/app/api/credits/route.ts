import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function getOrCreate(): Promise<{ id: string; balance: number }> {
  // Use raw SQL to avoid Prisma client issues
  const existing = await prisma.$queryRaw`
    SELECT id, balance FROM Credits LIMIT 1
  ` as any[]
  
  if (existing.length > 0) {
    return existing[0]
  }
  
  // Create new credits record
  const newCredits = await prisma.$queryRaw`
    INSERT INTO Credits (id, balance, createdAt, updatedAt) 
    VALUES (${crypto.randomUUID()}, 250, datetime('now'), datetime('now'))
    RETURNING id, balance
  ` as any[]
  
  return newCredits[0]
}

export async function GET() {
  try {
    const credits = await getOrCreate()
    return NextResponse.json({ success: true, data: { balance: credits.balance } })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch credits' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, amount } = await request.json()
    if (!action || typeof amount !== 'number') {
      return NextResponse.json({ success: false, error: 'action and amount required' }, { status: 400 })
    }

    const credits = await getOrCreate()

    if (action === 'topup') {
      const updated = await prisma.$queryRaw`
        UPDATE Credits 
        SET balance = balance + ${amount}, updatedAt = datetime('now')
        WHERE id = ${credits.id}
        RETURNING balance
      ` as any[]
      
      return NextResponse.json({ success: true, data: { balance: updated[0].balance } })
    }

    if (action === 'deduct') {
      if (credits.balance < amount) {
        return NextResponse.json({ success: false, error: 'Insufficient credits' }, { status: 402 })
      }
      
      const updated = await prisma.$queryRaw`
        UPDATE Credits 
        SET balance = balance - ${amount}, updatedAt = datetime('now')
        WHERE id = ${credits.id}
        RETURNING balance
      ` as any[]
      
      return NextResponse.json({ success: true, data: { balance: updated[0].balance } })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update credits' }, { status: 500 })
  }
}



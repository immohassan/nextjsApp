import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const spreadsheetId = searchParams.get('id')

    if (spreadsheetId) {
      // Get specific spreadsheet with its records
      const spreadsheet = await prisma.spreadsheet.findUnique({
        where: { id: spreadsheetId },
        include: {
          records: {
            orderBy: { rowIndex: 'asc' }
          }
        }
      })

      if (!spreadsheet) {
        return NextResponse.json(
          { error: 'Spreadsheet not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: spreadsheet
      })
    } else {
      // Get all spreadsheets
      const spreadsheets = await prisma.spreadsheet.findMany({
        include: {
          _count: {
            select: { records: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({
        success: true,
        data: spreadsheets
      })
    }

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch spreadsheets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const spreadsheetId = searchParams.get('id')

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Spreadsheet ID is required' },
        { status: 400 }
      )
    }

    // Delete spreadsheet and all its records (cascade)
    await prisma.spreadsheet.delete({
      where: { id: spreadsheetId }
    })

    return NextResponse.json({
      success: true,
      message: 'Spreadsheet deleted successfully'
    })

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to delete spreadsheet',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ spreadsheetId: string }> }
) {
  try {
    const { spreadsheetId } = await context.params

    // Get spreadsheet with table config and records
    let spreadsheet = await prisma.spreadsheet.findUnique({
      where: { id: spreadsheetId },
      include: {
        tableConfig: true,
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

    // If tableConfig is missing (e.g., imported before schema update), create it from existing records
    if (!spreadsheet.tableConfig) {
      const derivedHeaderSet = new Set<string>()
      for (const rec of spreadsheet.records) {
        const data = rec.data as Record<string, any>
        Object.keys(data || {}).forEach((k) => derivedHeaderSet.add(k))
      }
      const derivedHeaders = Array.from(derivedHeaderSet)

      // If we couldn't derive headers, default to empty so we still return extra columns
      const created = await prisma.tableConfig.create({
        data: {
          spreadsheetId: spreadsheet.id,
          headers: derivedHeaders,
        },
      })

      // Reload spreadsheet with tableConfig
      spreadsheet = await prisma.spreadsheet.findUnique({
        where: { id: spreadsheetId },
        include: {
          tableConfig: true,
          records: { orderBy: { rowIndex: 'asc' } },
        },
      }) as typeof spreadsheet
    }

    // Get headers from table config
    const originalHeaders = (spreadsheet.tableConfig?.headers as string[]) || []
    
    // Create all headers (original + additional columns)
    const allHeaders = [
      ...originalHeaders,
      'Email',
      'AI Summary', 
      'Email Template'
    ]

    // Transform records for table display
    const tableData = spreadsheet.records.map(record => {
      const rowData: Record<string, any> = {}
      
      // Add original data
      const originalData = record.data as Record<string, any>
      originalHeaders.forEach(header => {
        rowData[header] = originalData[header] || ''
      })
      
      // Add additional columns
      rowData['Email'] = record.email || ''
      rowData['AI Summary'] = record.aiSummary || ''
      rowData['Email Template'] = record.emailTemplate || ''
      
      return {
        id: record.id,
        ...rowData
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        spreadsheet: {
          id: spreadsheet.id,
          title: spreadsheet.title,
          url: spreadsheet.url
        },
        headers: allHeaders,
        rows: tableData,
        totalRecords: tableData.length
      }
    })

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch table data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ spreadsheetId: string }> }
) {
  try {
    const { spreadsheetId } = await context.params
    const { recordId, field, value } = await request.json()

    if (!recordId || !field || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: recordId, field, value' },
        { status: 400 }
      )
    }

    // Update the specific field
    const updateData: any = {}
    if (field === 'Email') {
      updateData.email = value
    } else if (field === 'AI Summary') {
      updateData.aiSummary = value
    } else if (field === 'Email Template') {
      updateData.emailTemplate = value
    } else {
      // For original data fields, update the JSON data
      const record = await prisma.spreadsheetRecord.findUnique({
        where: { id: recordId }
      })
      
      if (!record) {
        return NextResponse.json(
          { error: 'Record not found' },
          { status: 404 }
        )
      }

      const currentData = record.data as Record<string, any>
      currentData[field] = value
      updateData.data = currentData
    }

    const updatedRecord = await prisma.spreadsheetRecord.update({
      where: { id: recordId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: updatedRecord
    })

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to update record',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

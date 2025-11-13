import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { spreadsheetUrl } = await request.json()

    if (!spreadsheetUrl) {
      return NextResponse.json(
        { error: 'Spreadsheet URL is required' },
        { status: 400 }
      )
    }

    // Extract spreadsheet ID from URL
    const spreadsheetId = extractSpreadsheetId(spreadsheetUrl)
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Invalid Google Sheets URL' },
        { status: 400 }
      )
    }

    // Initialize Google Sheets API
    let sheets: any

    // For public spreadsheets, we can use API key
    // For private spreadsheets, you'll need OAuth2 authentication
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE) {
      // Use service account authentication for private sheets
      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      })
      sheets = google.sheets({ version: 'v4', auth })
    } else if (process.env.GOOGLE_SHEETS_API_KEY) {
      // Use API key for public sheets
      sheets = google.sheets({ 
        version: 'v4',
        auth: process.env.GOOGLE_SHEETS_API_KEY
      })
    } else {
      throw new Error('No Google Sheets API credentials found. Please set GOOGLE_SHEETS_API_KEY or GOOGLE_SERVICE_ACCOUNT_KEY_FILE')
    }

    // Get spreadsheet metadata
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    })

    const title = spreadsheet.data.properties?.title || 'Untitled Spreadsheet'

    // Check if spreadsheet already exists in database
    let dbSpreadsheet = await prisma.spreadsheet.findUnique({
      where: { url: spreadsheetUrl }
    })

    if (!dbSpreadsheet) {
      // Create new spreadsheet record
      dbSpreadsheet = await prisma.spreadsheet.create({
        data: {
          url: spreadsheetUrl,
          title,
        }
      })
    } else {
      // Update existing spreadsheet
      dbSpreadsheet = await prisma.spreadsheet.update({
        where: { id: dbSpreadsheet.id },
        data: {
          title,
          updatedAt: new Date(),
        }
      })
    }

    // Get all sheets in the spreadsheet
    const sheetsList = spreadsheet.data.sheets || []
    
    for (const sheet of sheetsList) {
      const sheetName = sheet.properties?.title || 'Sheet1'
      
      try {
        // Get data from the sheet
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A:Z`, // Get all columns A to Z
        })

        const values = response.data.values || []
        
        if (values.length === 0) {
          continue // Skip empty sheets
        }

        // Assume first row contains headers
        const headers = values[0] || []
        const dataRows = values.slice(1)

        // Store table configuration for this spreadsheet
        await prisma.tableConfig.upsert({
          where: { spreadsheetId: dbSpreadsheet.id },
          update: {
            headers: headers,
            updatedAt: new Date(),
          },
          create: {
            spreadsheetId: dbSpreadsheet.id,
            headers: headers,
          }
        })

        // Clear existing records for this sheet (if updating)
        await prisma.spreadsheetRecord.deleteMany({
          where: {
            spreadsheetId: dbSpreadsheet.id,
          }
        })

        // Insert new records with additional columns
        const recordsToCreate = dataRows.map((row: any[], index: number) => {
          const rowData: Record<string, any> = { sheetName }
          
          // Map each cell to its corresponding header
          headers.forEach((header: string, colIndex: number) => {
            if (header) {
              rowData[header] = row[colIndex] || ''
            }
          })

          return {
            spreadsheetId: dbSpreadsheet.id,
            rowIndex: index + 1, // Start from 1
            data: rowData,
            email: '', // Initialize additional columns
            aiSummary: '',
            emailTemplate: '',
          }
        })

        if (recordsToCreate.length > 0) {
          await prisma.spreadsheetRecord.createMany({
            data: recordsToCreate,
          })
        }

      } catch (sheetError) {
        // Continue with other sheets even if one fails
      }
    }

    // Get final count of records
    const recordCount = await prisma.spreadsheetRecord.count({
      where: { spreadsheetId: dbSpreadsheet.id }
    })

    // Deduct 1 credit for spreadsheet import
    try {
      const credits = await prisma.credits.findFirst()
      if (credits) {
        await prisma.credits.update({ where: { id: credits.id }, data: { balance: Math.max(0, credits.balance - 1) } })
      } else {
        await prisma.credits.create({ data: { balance: 249 } })
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Spreadsheet imported successfully',
      data: {
        spreadsheetId: dbSpreadsheet.id,
        title: dbSpreadsheet.title,
        recordCount,
        sheetsProcessed: sheetsList.length,
      }
    })

  } catch (error) {
    // Provide more specific error messages
    let errorMessage = 'Failed to import spreadsheet'
    let statusCode = 500
    
    if (error instanceof Error) {
      if (error.message.includes('No Google Sheets API credentials')) {
        errorMessage = 'Google Sheets API credentials not configured'
        statusCode = 500
      } else if (error.message.includes('Invalid spreadsheet ID')) {
        errorMessage = 'Invalid Google Sheets URL'
        statusCode = 400
      } else if (error.message.includes('Permission denied')) {
        errorMessage = 'Access denied. Make sure the spreadsheet is public or you have proper permissions'
        statusCode = 403
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: statusCode }
    )
  }
}

function extractSpreadsheetId(url: string): string | null {
  // Handle different Google Sheets URL formats
  const patterns = [
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

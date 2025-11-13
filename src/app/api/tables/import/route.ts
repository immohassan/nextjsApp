import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

const BATCH_SIZE = 500 // Process records in batches to avoid overwhelming the database

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tableName, data } = body

    // Validate input
    if (!tableName || typeof tableName !== 'string') {
      return NextResponse.json(
        { error: 'Table name is required' },
        { status: 400 }
      )
    }

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Data must be an array of JSON objects' },
        { status: 400 }
      )
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'Data array cannot be empty' },
        { status: 400 }
      )
    }

    if (data.length > 2500) {
      return NextResponse.json(
        { error: 'Maximum 2500 records allowed per import' },
        { status: 400 }
      )
    }

    // Create TableConfig
    const tableConfig = await prisma.tableConfig.create({
      data: {
        name: tableName,
      }
    })

    // Process records in batches
    const totalRecords = data.length
    let processedCount = 0
    const errors: string[] = []

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE)
      
      const recordsToCreate = batch.map((record: Record<string, any>) => {
        // Map JSON object fields to schema columns
        // Handle various field name variations (case-insensitive, with/without spaces, etc.)
        const normalizeField = (fieldName: string): string => {
          return fieldName.toLowerCase().trim()
        }

        const coerceToString = (val: unknown): string => {
          if (val == null) return ''
          if (typeof val === 'string') return val
          if (Array.isArray(val)) return val.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join(', ')
          if (typeof val === 'object') {
            const obj = val as Record<string, any>
            const preferredKeys = ['title', 'jobTitle', 'position', 'name', 'text', 'value']
            for (const k of preferredKeys) {
              if (obj[k]) return coerceToString(obj[k])
            }
            try { return JSON.stringify(obj) } catch { return String(val) }
          }
          return String(val)
        }

        const getNested = (obj: any, path: string): any => {
          try {
            return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj)
          } catch {
            return undefined
          }
        }

        const getFieldValue = (record: Record<string, any>, possibleNames: string[], possiblePaths: string[] = []): string => {
          for (const name of possibleNames) {
            // Try exact match first
            if (record[name] !== undefined) return coerceToString(record[name])
            
            // Try case-insensitive match
            const lowerName = normalizeField(name)
            for (const key in record) {
              if (normalizeField(key) === lowerName) {
                return coerceToString(record[key])
              }
            }
          }
          // Try nested paths like "startedOn.year", "profile.navigationUrl"
          for (const p of possiblePaths) {
            const v = getNested(record, p)
            if (v !== undefined) return coerceToString(v)
          }
          return ''
        }

        const monthName = (m: number): string => {
          const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
          if (Number.isFinite(m) && m >= 1 && m <= 12) return names[m-1]
          return String(m)
        }

        // Compute tenure from nested startedOn { month, year }
        const startedYearStr = getFieldValue(record, [], ['startedOn.year', 'startDate.year', 'started.year'])
        const startedMonthStr = getFieldValue(record, [], ['startedOn.month', 'startDate.month', 'started.month'])
        const tenureFromStart = startedYearStr
          ? `${startedMonthStr ? monthName(parseInt(startedMonthStr, 10)) + ' ' : ''}${startedYearStr}`
          : ''

        // Compute tenure durations like "1y 2m" from currentPosition.tenureAtPosition/Company
        const formatYM = (y: any, m: any): string => {
          const yy = parseInt(String(y ?? ''), 10)
          const mm = parseInt(String(m ?? ''), 10)
          const parts: string[] = []
          if (!Number.isNaN(yy) && yy > 0) parts.push(`${yy}y`)
          if (!Number.isNaN(mm) && mm > 0) parts.push(`${mm}m`)
          return parts.join(' ')
        }
        const posYears = getNested(record, 'currentPosition.tenureAtPosition.numYears')
        const posMonths = getNested(record, 'currentPosition.tenureAtPosition.numMonths')
        const companyYears = getNested(record, 'currentPosition.tenureAtCompany.numYears')
        const companyMonths = getNested(record, 'currentPosition.tenureAtCompany.numMonths')
        const tenureAtPositionDuration = formatYM(posYears, posMonths)
        const tenureAtCompanyDuration = formatYM(companyYears, companyMonths)

        // Build the mapped row
        const emailRaw = getFieldValue(record, ['email', 'Email', 'e-mail', 'emailAddress'])
        const emailValue = emailRaw || ''

        const mapped: any = {
          tableConfigId: tableConfig.id,
          firstName: getFieldValue(record, ['firstName', 'first_name', 'First Name', 'firstname', 'first']),
          lastName: getFieldValue(record, ['lastName', 'last_name', 'Last Name', 'lastname', 'last']),
          // If email empty, omit so Prisma treats it as undefined (works even if client types are stale)
          ...(emailValue ? { email: emailValue } : {}),
          // Map AI personalized email if present
          ...(getFieldValue(record, ['aiPersonalizedEmail', 'AI Personalized Email', 'emailTemplate', 'Email Template'])
            ? { aiPersonalizedEmail: getFieldValue(record, ['aiPersonalizedEmail', 'AI Personalized Email', 'emailTemplate', 'Email Template']) }
            : {}),
          currentPosition: getFieldValue(record, ['currentPosition', 'current_position', 'Current Position', 'title', 'jobTitle', 'position'], ['currentPosition.title']),
          location: getFieldValue(record, ['location', 'Location', 'city', 'City', 'country', 'Country'], ['geoRegion', 'currentPosition.location', 'currentPosition.companyUrnResolutionResult.location']),
          specialities: getFieldValue(record, ['specialities', 'specialties', 'Specialities', 'skills', 'Skills', 'skillset'], ['skills', 'skills.list']),
          profileSummary: getFieldValue(record, ['profileSummary', 'profile_summary', 'Profile Summary', 'summary', 'Summary', 'about', 'About']),
          linkedinUrl: getFieldValue(record, ['linkedinUrl', 'linkedin_url', 'Linkedin Url', 'linkedin', 'LinkedIn', 'linkedin_profile', 'linkedinProfile'], ['navigationUrl', 'profile.navigationUrl']),
          companyName: getFieldValue(record, ['companyName', 'company_name', 'Company Name', 'company', 'Company', 'employer'], ['currentPosition.companyName', 'company.name']),
          companyDescription: getFieldValue(record, ['companyDescription', 'company_description', 'Company Description', 'about_company', 'aboutCompany', 'company summary'], ['currentPosition.description', 'company.description']),
          industry: getFieldValue(record, ['industry', 'Industry', 'sector', 'Sector'], ['currentPosition.companyUrnResolutionResult.industry', 'company.industry']),
          // Prefer computed duration first, then fallbacks
          tenureAtCompany: tenureAtCompanyDuration || getFieldValue(record, ['tenureAtCompany', 'tenure_at_company', 'Tenure at Company', 'years_at_company', 'yearsAtCompany'], ['currentPosition.tenureAtCompany']) || '',
          tenureAtPosition: tenureAtPositionDuration || tenureFromStart || getFieldValue(record, ['tenureAtPosition', 'tenure_at_position', 'Tenure at Position', 'years_in_role', 'yearsInRole', 'position_tenure'], ['currentPosition.tenureAtPosition']) || '',
        }

        return mapped
      })

      try {
        // Use createMany; duplicate emails are handled via composite unique in schema
        await prisma.tables.createMany({
          data: recordsToCreate as any,
        })
        processedCount += recordsToCreate.length
      } catch (batchError) {
        errors.push(`Batch ${i / BATCH_SIZE + 1}: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`)
      }
    }

    // Get final count
    const finalCount = await prisma.tables.count({
      where: { tableConfigId: tableConfig.id }
    })

    // Deduct credits equal to the number of rows created
    if (finalCount > 0) {
      try {
        // Get or create credits record
        const credits = await prisma.$queryRaw`
          SELECT id, balance FROM Credits LIMIT 1
        ` as any[]
        
        if (credits.length > 0) {
          const creditRecord = credits[0]
          const creditsToDeduct = finalCount
          if (creditRecord.balance >= creditsToDeduct) {
            await prisma.$queryRaw`
              UPDATE Credits 
              SET balance = balance - ${creditsToDeduct}, updatedAt = datetime('now')
              WHERE id = ${creditRecord.id}
            `
          } else {
            // Insufficient credits - set to 0
            await prisma.$queryRaw`
              UPDATE Credits 
              SET balance = 0, updatedAt = datetime('now')
              WHERE id = ${creditRecord.id}
            `
          }
        } else {
          // Create new credits record with deduction
          const initialBalance = 250
          const creditsToDeduct = finalCount
          await prisma.$queryRaw`
            INSERT INTO Credits (id, balance, createdAt, updatedAt) 
            VALUES (${randomUUID()}, ${Math.max(0, initialBalance - creditsToDeduct)}, datetime('now'), datetime('now'))
          `
        }
      } catch (creditError) {
        // Don't fail the request if credit deduction fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Table created successfully. Processed ${processedCount} of ${totalRecords} records.`,
      data: {
        tableConfigId: tableConfig.id,
        tableName: tableConfig.name,
        recordsProcessed: processedCount,
        totalRecords: totalRecords,
        finalRecordCount: finalCount,
        errors: errors.length > 0 ? errors : undefined,
      }
    })

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to create table and records',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


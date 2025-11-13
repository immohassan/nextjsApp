import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const STATIC_HEADERS = [
	'First Name',
	'Last Name',
	'Email',
	'AI Personalized Email',
	'Current Position',
	'Location',
	'Profile Summary',
	'Specialities',
	'Linkedin Url',
	'Company Name',
	'Industry',
	'Tenure at Position',
	'Tenure at Company',
	'Company Description',
] as const

export async function GET(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params
		const table = await prisma.tableConfig.findUnique({
			where: { id },
			include: { rows: { orderBy: { createdAt: 'asc' } } },
		})
		if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 })

		const rows = table.rows.map(r => ({
			id: r.id,
			'First Name': r.firstName,
			'Last Name': r.lastName,
			'Email': r.email ?? '',
			'AI Personalized Email': (r as any).aiPersonalizedEmail ?? '',
			'Current Position': r.currentPosition,
			'Location': r.location,
			'Profile Summary': r.profileSummary,
			'Specialities': r.specialities,
			'Linkedin Url': r.linkedinUrl,
			'Company Name': r.companyName,
			'Industry': r.industry,
			'Tenure at Position': r.tenureAtPosition,
			'Tenure at Company': r.tenureAtCompany,
			'Company Description': r.companyDescription,
		}))

		return NextResponse.json({
			success: true,
			data: {
				table: { id: table.id, name: table.name, aiPrompt: (table as any).aiPrompt ?? null },
				headers: STATIC_HEADERS,
				rows,
				totalRecords: rows.length,
			},
		})
	} catch (error) {
		return NextResponse.json({ error: 'Failed to fetch table rows' }, { status: 500 })
	}
}

export async function PUT(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params
		const body = await request.json()
		const { recordId, field, value, aiPrompt } = body

		// Handle TableConfig update (aiPrompt)
		if (!recordId && typeof aiPrompt === 'string') {
			const updatedTable = await prisma.tableConfig.update({
				where: { id },
				data: { aiPrompt } as any,
			})
			return NextResponse.json({ 
				success: true, 
				data: { 
					id: updatedTable.id, 
					aiPrompt: (updatedTable as any).aiPrompt ?? null 
				} 
			})
		}

		// Handle Tables record update
		if (!recordId || !field) {
			return NextResponse.json({ error: 'Missing recordId/field' }, { status: 400 })
		}

		const fieldMap: Record<string, keyof import('@prisma/client').Tables> = {
			'First Name': 'firstName',
			'Last Name': 'lastName',
			'Email': 'email',
			'AI Personalized Email': 'aiPersonalizedEmail' as any,
			'Current Position': 'currentPosition',
			'Location': 'location',
			'Profile Summary': 'profileSummary',
			'Specialities': 'specialities',
			'Linkedin Url': 'linkedinUrl',
			'Company Name': 'companyName',
			'Industry': 'industry',
			'Tenure at Position': 'tenureAtPosition',
			'Tenure at Company': 'tenureAtCompany',
			'Company Description': 'companyDescription',
		}
		const dbField = fieldMap[field]
		if (!dbField) return NextResponse.json({ error: 'Unsupported field' }, { status: 400 })

		const updated = await prisma.tables.update({
			where: { id: recordId },
			data: { [dbField]: String(value ?? '') },
		})

		return NextResponse.json({ success: true, data: updated })
	} catch (error) {
		return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
	}
}

export async function DELETE(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params
		const { recordIds } = await request.json()
		if (!Array.isArray(recordIds) || recordIds.length === 0) return NextResponse.json({ error: 'recordIds required' }, { status: 400 })

		await prisma.tables.deleteMany({ where: { id: { in: recordIds } } })
		return NextResponse.json({ success: true })
	} catch (error) {
		return NextResponse.json({ error: 'Failed to delete records' }, { status: 500 })
	}
}

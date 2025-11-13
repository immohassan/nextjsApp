'use client'
import Link from "next/link"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IconArrowLeft, IconClock, IconListDetails, IconCheck } from "@tabler/icons-react"  
export default function SpreadsheetImportPage() {
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleImport = async () => {
    if (!spreadsheetUrl.trim()) {
      setError('Please enter a spreadsheet URL')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/import-spreadsheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ spreadsheetUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import spreadsheet')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Link href="/scraper" className="mb-3">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <IconArrowLeft className="h-4 w-4" />
            Back
          </Button>
          </Link>
      <Card>
        <CardHeader>
          <CardTitle>Import Google Spreadsheet</CardTitle>
          <CardDescription>
            Enter a Google Sheets URL to import all data into the database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium mb-2">
              Spreadsheet URL
            </label>
            <Input
              id="url"
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={spreadsheetUrl}
              onChange={(e) => setSpreadsheetUrl(e.target.value)}
              className="w-full"
            />
          </div>

          <Button 
            onClick={handleImport} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Importing...' : 'Import Spreadsheet'}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-semibold text-green-800 mb-2">Import Successful!</h3>
              <div className="space-y-2 text-sm text-green-700">
                <p><strong>Title:</strong> {result.data.title}</p>
                <p><strong>Records Imported:</strong> {result.data.recordCount}</p>
                <p><strong>Sheets Processed:</strong> {result.data.sheetsProcessed}</p>
                <Badge variant="secondary" className="mt-2">
                  ID: {result.data.spreadsheetId}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Example URLs</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit</p>
          <p>• https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms</p>
        </div>
      </div>
    </div>
  )
}

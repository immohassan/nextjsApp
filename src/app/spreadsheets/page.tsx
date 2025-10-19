'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Spreadsheet {
  id: string
  title: string
  url: string
  createdAt: string
  _count: {
    records: number
  }
}

export default function SpreadsheetsPage() {
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSpreadsheets()
  }, [])

  const fetchSpreadsheets = async () => {
    try {
      const response = await fetch('/api/spreadsheets')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch spreadsheets')
      }

      setSpreadsheets(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this spreadsheet?')) {
      return
    }

    try {
      const response = await fetch(`/api/spreadsheets?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete spreadsheet')
      }

      // Remove from local state
      setSpreadsheets(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading spreadsheets...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Imported Spreadsheets</h1>
        <Link href="/spreadsheet-import">
          <Button>Import New Spreadsheet</Button>
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-6">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {spreadsheets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500 mb-4">No spreadsheets imported yet.</p>
            <Link href="/spreadsheet-import">
              <Button>Import Your First Spreadsheet</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {spreadsheets.map((spreadsheet) => (
            <Card key={spreadsheet.id}>
              <CardHeader>
                <CardTitle className="text-lg">{spreadsheet.title}</CardTitle>
                <CardDescription>
                  Imported on {new Date(spreadsheet.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {spreadsheet._count.records} records
                    </Badge>
                    <Badge variant="outline">
                      {spreadsheet.id.slice(0, 8)}...
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => window.open(spreadsheet.url, '_blank')}
                    >
                      View Original
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDelete(spreadsheet.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import * as React from "react"
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  IconDotsVertical,
  IconMaximize,
  IconPlus,
  IconFilter,
  IconRefresh,
  IconChevronDown,
} from "@tabler/icons-react"

interface Spreadsheet {
  id: string
  title: string
  url: string
  createdAt: string
  _count: {
    records: number
  }
}

interface TableData {
  spreadsheet: {
    id: string
    title: string
    url: string
  }
  headers: string[]
  rows: Record<string, any>[]
  totalRecords: number
}

function HoverEditableCell({
  value,
  onChange,
  isTextarea = false,
}: {
  value: string
  onChange: (value: string) => void
  isTextarea?: boolean
}) {
  const [draft, setDraft] = React.useState(value)
  const [open, setOpen] = React.useState(false)
  const [allowHoverOpen, setAllowHoverOpen] = React.useState(false)

  React.useEffect(() => {
    setDraft(value)
  }, [value])

  const handleOpenChange = (next: boolean) => {
    // Only allow open changes triggered by click-initiated state
    if (!allowHoverOpen && next) return
    setOpen(next)
    if (!next) setAllowHoverOpen(false)
  }

  return (
    <HoverCard open={open} onOpenChange={handleOpenChange} openDelay={999999} closeDelay={0}>
      <HoverCardTrigger asChild>
        <div
          className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[32px] flex items-center w-full"
          onClick={() => {
            setAllowHoverOpen(true)
            setOpen((v) => !v)
          }}
        >
          <span
            className={`truncate w-full ${!value ? 'text-muted-foreground' : ''}`}
            title={value}
          >
            {value || 'Click to edit'}
          </span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-[420px] space-y-2">
        {isTextarea ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[120px]"
          />
        ) : (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        )}
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => { setDraft(value); setOpen(false); setAllowHoverOpen(false) }}>Cancel</Button>
          <Button size="sm" onClick={() => { onChange(draft); setOpen(false); setAllowHoverOpen(false) }}>Save</Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

function DynamicTable({ spreadsheetId }: { spreadsheetId: string }) {
  const [tableData, setTableData] = React.useState<TableData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const rowsPerPage = 10
  type Filter = { field: string; op: string; value: string }
  const [filters, setFilters] = React.useState<Filter[]>([])
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set())

  const fetchTableData = async () => {
    try {
      const response = await fetch(`/api/table/${spreadsheetId}`)
      const data = await response.json()
      
      if (data.success) {
        setTableData(data.data)
      }
    } catch (error) {
      console.error('Error fetching table data:', error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchTableData()
  }, [spreadsheetId])

  const updateCell = async (recordId: string, field: string, value: string) => {
    try {
      const response = await fetch(`/api/table/${spreadsheetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recordId, field, value }),
      })

      if (response.ok) {
        // Refresh table data
        fetchTableData()
      }
    } catch (error) {
      console.error('Error updating cell:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading table data...</div>
  }

  if (!tableData) {
    return <div className="text-center py-8 text-red-500">Failed to load table data</div>
  }

  const filteredRows = tableData.rows.filter((row) => {
    const matchesSearch = Object.values(row).some((value) =>
      value?.toString().toLowerCase().includes(search.toLowerCase())
    )

    const matchesFilters = filters.every((f) => {
      if (!f.field) return true
      const raw = row[f.field]
      const valStr = (raw ?? '').toString()
      const q = (f.value ?? '').toString()
      const s = valStr.toLowerCase()
      const qs = q.toLowerCase()

      switch (f.op) {
        case 'isEmpty':
          return valStr.trim().length === 0
        case 'isNotEmpty':
          return valStr.trim().length > 0
        case 'equals':
          return s === qs
        case 'notEquals':
          return s !== qs
        case 'contains':
          return s.includes(qs)
        case 'startsWith':
          return s.startsWith(qs)
        case 'endsWith':
          return s.endsWith(qs)
        case 'gt': {
          const num = Number(valStr)
          const qn = Number(q)
          if (Number.isNaN(num) || Number.isNaN(qn)) return false
          return num > qn
        }
        case 'lt': {
          const num = Number(valStr)
          const qn = Number(q)
          if (Number.isNaN(num) || Number.isNaN(qn)) return false
          return num < qn
        }
        case 'gte': {
          const num = Number(valStr)
          const qn = Number(q)
          if (Number.isNaN(num) || Number.isNaN(qn)) return false
          return num >= qn
        }
        case 'lte': {
          const num = Number(valStr)
          const qn = Number(q)
          if (Number.isNaN(num) || Number.isNaN(qn)) return false
          return num <= qn
        }
        default:
          // Fallback to contains
          return s.includes(qs)
      }
    })

    return matchesSearch && matchesFilters
  })

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage)
  const paginatedRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const visibleHeaders = tableData.headers.filter((h) => h !== 'AI Summary')
  const dataColumnClass = "border min-w-[250px] w-[250px] max-w-[250px]"
  const smallColumnClass = "border min-w-[40px] w-[40px] max-w-[40px]"

  const handleSelectRow = (rowId: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(rowId)) {
        newSet.delete(rowId)
      } else {
        newSet.add(rowId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedRows.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(paginatedRows.map(row => row.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return
    try {
      const response = await fetch(`/api/table/${spreadsheetId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordIds: Array.from(selectedRows) })
        }
      )
      if (response.ok) {
        setSelectedRows(new Set())
        fetchTableData()
      }
    } catch (error) {
      console.error('Error deleting records:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="flex items-center justify-end">
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <button className="hover:text-foreground">Extract Emails</button>
          <button className="hover:text-foreground">Enrich</button>
          <a className="hover:text-foreground" href="/scraper">Extract More</a>
          <a className="hover:text-foreground" href="/credits">Credits Remaining: 250</a>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <IconDotsVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit AI Prompt</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search records..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {filters.map((f, i) => (
            <div key={`${f.field}-${i}`} className="flex gap-2 items-center border rounded-none px-2 py-1">
              <select
                className="h-8 border rounded-none px-2 text-sm bg-background"
                value={f.field}
                onChange={(e) =>
                  setFilters((prev) => prev.map((p, idx) => (idx === i ? { ...p, field: e.target.value } : p)))
                }
              >
                <option value="">Select field</option>
                {tableData.headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>

              <select
                className="h-8 border rounded-none px-2 text-sm bg-background"
                value={f.op}
                onChange={(e) =>
                  setFilters((prev) => prev.map((p, idx) => (idx === i ? { ...p, op: e.target.value } : p)))
                }
              >
                <option value="contains">contains</option>
                <option value="equals">equals</option>
                <option value="notEquals">not equals</option>
                <option value="startsWith">starts with</option>
                <option value="endsWith">ends with</option>
                <option value="isEmpty">is empty</option>
                <option value="isNotEmpty">is not empty</option>
                <option value="gt">greater than</option>
                <option value="gte">greater or equal</option>
                <option value="lt">less than</option>
                <option value="lte">less or equal</option>
              </select>

              <Input
                placeholder={f.op === 'isEmpty' || f.op === 'isNotEmpty' ? '—' : 'Value'}
                value={f.value}
                onChange={(e) =>
                  setFilters((prev) => prev.map((p, idx) => (idx === i ? { ...p, value: e.target.value } : p)))
                }
                disabled={f.op === 'isEmpty' || f.op === 'isNotEmpty'}
                className="h-8 w-[180px]"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setFilters((prev) => prev.filter((_, idx) => idx !== i))}
              >
                ✕
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFilters((prev) => [...prev, { field: tableData.headers[0] || '', op: 'contains', value: '' }])}
          >
            Add Filter
          </Button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedRows.size > 0 && (
        <div className="flex items-center justify-between border-y px-2 py-2 text-sm">
          <span className="text-muted-foreground">{selectedRows.size} selected</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">Bulk actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-red-500" onClick={handleBulkDelete}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Table */}
      <div className="w-full max-w-full max-h-[600px] overflow-auto border rounded-none">
        <Table className="border-collapse border">
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow className="border">
              <TableHead className={`${smallColumnClass} pl-3`}>
                <Checkbox 
                  checked={selectedRows.size === paginatedRows.length && paginatedRows.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className={`${smallColumnClass}`}>#</TableHead>
              {visibleHeaders.map((header) => (
                <TableHead key={header} className={`${dataColumnClass} rounded-none`}>
                  <div className="truncate" title={header}>{header}</div>
                </TableHead>
              ))}
              <TableHead className={`${dataColumnClass}`}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row, index) => (
              <TableRow key={row.id || index} className="border rounded-none">
                <TableCell className={`${smallColumnClass} pl-3`}>
                  <Checkbox 
                    checked={selectedRows.has(row.id)}
                    onCheckedChange={() => handleSelectRow(row.id)}
                  />
                </TableCell>
                <TableCell className={`${smallColumnClass} text-center text-muted-foreground`}>
                  {(page - 1) * rowsPerPage + index + 1}
                </TableCell>
                {visibleHeaders.map((header) => (
                  <TableCell key={header} className={`${dataColumnClass} rounded-none`}>
                    {header === 'Email Template' ? (
                      <HoverEditableCell
                        value={row[header] || ''}
                        onChange={(value) => updateCell(row.id, header, value)}
                        isTextarea={true}
                      />
                    ) : (
                      <HoverEditableCell
                        value={row[header] || ''}
                        onChange={(value) => updateCell(row.id, header, value)}
                      />
                    )}
                  </TableCell>
                ))}
                <TableCell className={`${dataColumnClass}`}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <IconDotsVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Generate AI Email</DropdownMenuItem>
                      <DropdownMenuItem>Send Email</DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <span>
          Page {page} of {totalPages} ({filteredRows.length} records)
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  const [spreadsheets, setSpreadsheets] = React.useState<Spreadsheet[]>([])
  const [selectedSpreadsheet, setSelectedSpreadsheet] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  const fetchSpreadsheets = async () => {
    try {
      const response = await fetch('/api/spreadsheets')
      const data = await response.json()
      
      if (data.success) {
        setSpreadsheets(data.data)
        
        // Check for table parameter in URL
        const urlParams = new URLSearchParams(window.location.search)
        const tableParam = urlParams.get('table')
        
        if (tableParam && data.data.find((s: Spreadsheet) => s.id === tableParam)) {
          setSelectedSpreadsheet(tableParam)
        } else if (data.data.length > 0 && !selectedSpreadsheet) {
          setSelectedSpreadsheet(data.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching spreadsheets:', error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchSpreadsheets()
  }, [])

  // Update URL when spreadsheet selection changes
  React.useEffect(() => {
    if (selectedSpreadsheet) {
      const url = new URL(window.location.href)
      url.searchParams.set('table', selectedSpreadsheet)
      window.history.replaceState({}, '', url.toString())
    }
  }, [selectedSpreadsheet])

  if (loading) {
    return (
      <div className="m-5">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className="text-center py-8">Loading spreadsheets...</div>
      </div>
    )
  }

  if (spreadsheets.length === 0) {
    return (
      <div className="m-5">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No spreadsheets imported yet.</p>
          <Button asChild>
            <a href="/spreadsheet-import">Import Your First Spreadsheet</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="m-5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 w-full">
          {selectedSpreadsheet && (
            <div className="flex items-baseline gap-2">
              <h1 className="text-xl font-semibold">
                {spreadsheets.find(s => s.id === selectedSpreadsheet)?.title}
              </h1>
              <span className="text-sm text-muted-foreground">
                {spreadsheets.find(s => s.id === selectedSpreadsheet)?._count.records} records
              </span>
            </div>
          )}
          <Button asChild className="ml-auto">
            <a href="/spreadsheet-import">
              <IconPlus size={16} className="mr-1" /> Import New
            </a>
          </Button>
        </div>
      </div>

      {selectedSpreadsheet && (
        <DynamicTable spreadsheetId={selectedSpreadsheet} />
      )}
    </div>
  )
}

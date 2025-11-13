"use client"
import { Type, Bot, Database, ListPlus,TableCellsMerge  , Library    } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FaArrowDown } from "react-icons/fa"
import { MdOutlinePeopleAlt } from "react-icons/md"
import { IconCheck } from "@tabler/icons-react"
import * as React from "react"
import { MailSearch } from 'lucide-react';
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
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconDotsVertical,
  IconMaximize,
  IconPlus,
  IconFilter,
  IconRefresh,
  IconChevronDown,
  IconCursorText,
  IconLoader2,
  IconPlayerPlay,
} from "@tabler/icons-react"

// Static headers requested for the dashboard table
const STATIC_HEADERS = [
  "First Name",
  "Last Name",
  "Email",
  "AI Personalized Email",
  "Current Position",
  "Location",
  "Profile Summary",
  "Specialities",
  "Linkedin Url",
  "Company Name",
  "Industry",
  "Tenure at Position",
  "Tenure at Company",
  "Company Description",
] as const

interface TableConfigSummary {
  id: string
  name: string
  createdAt: string
  _count: {
    rows: number
  }
}

interface TableData {
  table: {
    id: string
    name: string
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
    // Only allow closing if explicitly triggered (not by hover)
    if (!next && allowHoverOpen) {
      setOpen(false)
      setAllowHoverOpen(false)
    }
    // Prevent hover-based opening/closing
    if (next && !allowHoverOpen) return
  }

  return (
    <HoverCard open={open} onOpenChange={handleOpenChange} openDelay={999999} closeDelay={999999}>
      <HoverCardTrigger asChild>
        <div
          className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[28px] flex items-center w-full min-w-0"
          onClick={() => {
            setAllowHoverOpen(true)
            setOpen((v) => !v)
          }}
        >
          <span
            className={`w-full font-medium text-sm break-words min-w-0 ${!value ? 'text-muted-foreground' : ''}`}
            title={value}
            style={{ 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
              maxWidth: '100%'
            }}
          >
            {value || 'Click to edit'}
          </span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-[420px] space-y-2"
        onPointerDownOutside={() => {
          // Allow closing when clicking outside
          setOpen(false)
          setAllowHoverOpen(false)
        }}
        onEscapeKeyDown={() => {
          setOpen(false)
          setAllowHoverOpen(false)
        }}
      >
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
  const rowsPerPage = 25
  type Filter = { field: string; op: string; value: string }
  const [filters, setFilters] = React.useState<Filter[]>([])
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set())
  const [generatingEmail, setGeneratingEmail] = React.useState<Set<string>>(new Set())
  const [searchingEmail, setSearchingEmail] = React.useState<Set<string>>(new Set())
  const [showSuccessAlert, setShowSuccessAlert] = React.useState(false)
  const [showFailAlert, setshowFailAlert] = React.useState(false)
  const [bulkProcessModalOpen, setBulkProcessModalOpen] = React.useState(false)
  const [bulkProcessType, setBulkProcessType] = React.useState<'email' | 'ai-email' | null>(null)
  const [isBulkProcessing, setIsBulkProcessing] = React.useState(false)
  const [bulkProgress, setBulkProgress] = React.useState<{ processed: number; total: number } | null>(null)
  const pollIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const processingRowsRef = React.useRef<Array<Record<string, any>>>([])
  const [credits, setCredits] = React.useState<number | null>(null)
  const [promptOpen, setPromptOpen] = React.useState(false)
  const [aiPrompt, setAiPrompt] = React.useState("")
  const [savingPrompt, setSavingPrompt] = React.useState(false)

  // Map static headers to likely source keys in the dynamic dataset
  const headerAliases: Record<string, string[]> = React.useMemo(() => ({
    "First Name": ["First Name"],
    "Last Name": ["Last Name"],
    "Email": ["Email"],
    "AI Personalized Email": ["AI Personalized Email"],
    "Current Position": ["Current Position"],
    "Location": ["Location"],
    "Profile Summary": ["Profile Summary"],
    "Specialities": ["Specialities"],
    "Linkedin Url": ["Linkedin Url"],
    "Company Name": ["Company Name"],
    "Industry": ["Industry"],
    "Tenure at Position": ["Tenure at Position"],
    "Tenure at Company": ["Tenure at Company"],
    "Company Description": ["Company Description"],
  }), [])

  // Resolve the actual key in row data for a given static header
  const resolveFieldKey = React.useCallback((staticHeader: string): string | undefined => {
    if (!tableData) return undefined
    const candidates = headerAliases[staticHeader] || [staticHeader]
    // Build a case-insensitive map of available headers
    const sourceHeaders = tableData.headers
    // Try exact (case-insensitive) match first
    for (const cand of candidates) {
      const found = sourceHeaders.find(h => h.toLowerCase() === cand.toLowerCase())
      if (found) return found
    }
    // Fallback: includes match
    for (const cand of candidates) {
      const found = sourceHeaders.find(h => h.toLowerCase().includes(cand.toLowerCase()))
      if (found) return found
    }
    return undefined
  }, [tableData, headerAliases])

  const fetchTableData = async () => {
    try {
      const response = await fetch(`/api/tables/${spreadsheetId}`)
      const data = await response.json()
      
      if (data.success) {
        setTableData(data.data)
        
        // Check if there's ongoing bulk processing from localStorage
        const storedProcessing = localStorage.getItem(`bulkProcessing_${spreadsheetId}`)
        if (storedProcessing) {
          try {
            const processing = JSON.parse(storedProcessing)
            if (processing.isActive && processing.tableId === spreadsheetId) {
              // Restore processing state
              setIsBulkProcessing(true)
              setBulkProcessType(processing.processType)
              
              // Restore rows being processed
              const storedRowIds = processing.rowIds || []
              if (storedRowIds.length > 0) {
                const rowsToProcess = data.data.rows.filter((r: any) => storedRowIds.includes(r.id))
                processingRowsRef.current = rowsToProcess
                
                // Calculate current progress
                const sourceKey = processing.processType === 'email' ? 'Email' : 'AI Personalized Email'
                const processedCount = rowsToProcess.filter((r: any) => {
                  const value = r[sourceKey]
                  return value && value.trim() !== ''
                }).length
                
                setBulkProgress({ processed: processedCount, total: rowsToProcess.length })
                
                // Resume polling if not all rows are processed
                // We'll start polling in a useEffect after the component is fully initialized
                if (processedCount < rowsToProcess.length) {
                  // State is set, polling will resume in useEffect
                } else {
                  // All done, clear storage
                  localStorage.removeItem(`bulkProcessing_${spreadsheetId}`)
                  setIsBulkProcessing(false)
                  setBulkProgress(null)
                }
              }
            }
          } catch (e) {
            console.error('Error restoring processing state:', e)
            localStorage.removeItem(`bulkProcessing_${spreadsheetId}`)
          }
        }
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

  React.useEffect(() => {
    if (tableData?.table?.id) {
      setAiPrompt((tableData as any).table.aiPrompt || "")
    }
  }, [tableData?.table?.id])

  // Cleanup polling interval on unmount or when table changes
  React.useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      setIsBulkProcessing(false)
      setBulkProgress(null)
      processingRowsRef.current = []
    }
  }, [spreadsheetId])

  React.useEffect(() => {
    const loadCredits = async () => {
      try {
        const r = await fetch('/api/credits')
        const d = await r.json()
        if (d.success) setCredits(d.data.balance)
      } catch {}
    }
    loadCredits()
  }, [])

  // Resume polling if there's ongoing processing after page load
  React.useEffect(() => {
    if (isBulkProcessing && bulkProcessType && processingRowsRef.current.length > 0 && tableData) {
      // Check if we need to resume polling (not all rows are processed)
      const sourceKey = bulkProcessType === 'email' ? 'Email' : 'AI Personalized Email'
      const processedCount = processingRowsRef.current.filter((r: any) => {
        const row = tableData.rows.find((row: any) => row.id === r.id)
        const value = row?.[sourceKey]
        return value && value.trim() !== ''
      }).length
      
      if (processedCount < processingRowsRef.current.length) {
        // Start polling to continue tracking progress
        startPolling(bulkProcessType, processingRowsRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBulkProcessing, bulkProcessType, tableData])

  const updateCell = async (recordId: string, field: string, value: string) => {
    try {
      const response = await fetch(`/api/tables/${spreadsheetId}`, {
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
      const key = resolveFieldKey(f.field) || f.field
      const raw = row[key]
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
  const visibleHeaders = STATIC_HEADERS
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
      const response = await fetch(`/api/tables/${spreadsheetId}`,
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

  const handleGenerateAIEmail = async (row: Record<string, any>) => {
    try {
      // Check if prompt is set
      const tablePrompt = (tableData?.table as any)?.aiPrompt
      if (!tablePrompt || tablePrompt.trim() === '') {
        alert('Please set the prompt first using the "Set Prompt" button.')
        return
      }

      // Add to loading state
      setGeneratingEmail(prev => new Set([...prev, row.id]))
      console.log('Generating AI email for row:', row)
      console.log('Prompt being sent:', tablePrompt)
      
      // Prepare payload
      const payload = {
        rowData: row,
        prompt: tablePrompt,
        spreadsheetId: spreadsheetId,
        action: 'generate_ai_email'
      }
      console.log('Payload being sent:', JSON.stringify(payload, null, 2))
      
      // Call the webhook with the row data and prompt
      const response = await fetch('https://goclienflow.com/webhook/ad8f688e-c826-4f4d-a5b9-20c2244287d5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        console.log(result);
        // Update the AI Personalized Email column with the response
        const aiEmail = result.emailTemplate || result.aiEmail || result.ai_personalized_email || result.emailBody || result.body
        if (aiEmail) {
          await updateCell(row.id, 'AI Personalized Email', aiEmail)
          // Deduct 1 credit for AI email
          try {
            const cd = await fetch('/api/credits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deduct', amount: 1 }) })
            const cj = await cd.json()
            if (cj.success) setCredits(cj.data.balance)
          } catch {}
          setShowSuccessAlert(true)
          // Auto-hide alert after 5 seconds
          setTimeout(() => setShowSuccessAlert(false), 5000)
        } else {
          alert('No AI email received from the webhook')
        }
      } else {
        alert('Failed to generate AI email')
      }
    } catch (error) {
      console.error('Error generating AI email:', error)
      alert('Error generating AI email')
    } finally {
      // Remove from loading state
      setGeneratingEmail(prev => {
        const newSet = new Set(prev)
        newSet.delete(row.id)
        return newSet
      })
    }
  }

  // Start polling for bulk processing updates
  const startPolling = (processType: 'email' | 'ai-email', rowsToProcess: Array<Record<string, any>>) => {
    // Clear any existing polling interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }
    
    let pollCount = 0
    const maxPollCount = 150 // 5 minutes (150 * 2 seconds)
    
    pollIntervalRef.current = setInterval(async () => {
      pollCount++
      
      // Fetch fresh table data
      try {
        const response = await fetch(`/api/tables/${spreadsheetId}?t=${Date.now()}`)
        const data = await response.json()
        
        if (data.success) {
          const updatedRows = data.data.rows || []
          
          // Check which rows have been processed
          const processedRowIds = new Set<string>()
          processingRowsRef.current.forEach(row => {
            const updatedRow = updatedRows.find((r: any) => r.id === row.id)
            if (updatedRow) {
              const sourceKey = processType === 'email' ? 'Email' : 'AI Personalized Email'
              const value = updatedRow[sourceKey]
              if (value && value.trim() !== '') {
                processedRowIds.add(row.id)
              }
            }
          })
          
          // Update progress
          const processedCount = processedRowIds.size
          const totalCount = processingRowsRef.current.length
          setBulkProgress({ processed: processedCount, total: totalCount })
          
          // Update localStorage with current progress
          if (typeof window !== 'undefined' && tableData?.table?.id) {
            localStorage.setItem(`bulkProcessing_${spreadsheetId}`, JSON.stringify({
              isActive: true,
              tableId: spreadsheetId,
              processType,
              rowIds: processingRowsRef.current.map(r => r.id),
            }))
          }
          
          // Check if all rows have been processed
          const allProcessed = processingRowsRef.current.every(row => processedRowIds.has(row.id))
          
          if (allProcessed) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            setIsBulkProcessing(false)
            setBulkProgress(null)
            processingRowsRef.current = []
            // Clear localStorage
            if (typeof window !== 'undefined') {
              localStorage.removeItem(`bulkProcessing_${spreadsheetId}`)
            }
            setShowSuccessAlert(true)
            setTimeout(() => setShowSuccessAlert(false), 5000)
            // Refresh table data one final time
            await fetchTableData()
          } else if (pollCount >= maxPollCount) {
            // Timeout after 5 minutes
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            setIsBulkProcessing(false)
            setBulkProgress(null)
            processingRowsRef.current = []
            // Clear localStorage
            if (typeof window !== 'undefined') {
              localStorage.removeItem(`bulkProcessing_${spreadsheetId}`)
            }
          } else {
            // Update table data in state
            setTableData(data.data)
          }
        }
      } catch (error) {
        console.error('Error polling for updates:', error)
      }
    }, 2000) // Poll every 2 seconds
  }

  // Bulk process emails or AI emails
  const handleBulkProcess = async (processType: 'email' | 'ai-email', limit: 'first10' | 'all') => {
    if (!tableData?.rows || !tableData?.table?.id) return
    
    // Close modal immediately when option is selected
    setBulkProcessModalOpen(false)
    setIsBulkProcessing(true)
    
    // Get rows to process
    const rowsToProcess = limit === 'first10' 
      ? paginatedRows.slice(0, 10)
      : paginatedRows
    
    // Store rows being processed
    processingRowsRef.current = rowsToProcess
    
    // Initialize progress
    setBulkProgress({ processed: 0, total: rowsToProcess.length })
    
    try {
      // Check if AI email needs prompt
      if (processType === 'ai-email') {
        const tablePrompt = (tableData?.table as any)?.aiPrompt
        if (!tablePrompt || tablePrompt.trim() === '') {
          alert('Please set the prompt first using the "Set Prompt" button.')
          setIsBulkProcessing(false)
          setBulkProgress(null)
          processingRowsRef.current = []
          return
        }
      }
      
      // Store processing state in localStorage for persistence across page refreshes
      if (typeof window !== 'undefined') {
        localStorage.setItem(`bulkProcessing_${spreadsheetId}`, JSON.stringify({
          isActive: true,
          tableId: spreadsheetId,
          processType,
          rowIds: rowsToProcess.map(r => r.id),
        }))
      }
      
      // Get callback URLs - webhook will call these when data is ready
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const emailCallbackUrl = `${baseUrl}/api/tables/${tableData.table.id}/update-email`
      const aiEmailCallbackUrl = `${baseUrl}/api/tables/${tableData.table.id}/update-ai-email`
      
      // Send all rows to webhook (fire and forget - don't wait for response)
      const webhookUrl = processType === 'email' 
        ? 'https://goclienflow.com/webhook/55e5955a-6172-4fb4-a23c-33251a163900'
        : 'https://goclienflow.com/webhook/55e5955a-6172-4fb4-a23c-33251a163900'
      
      // Fire and forget - don't await the response
      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rows: rowsToProcess,
          tableId: tableData.table.id,
          processType,
          callbackUrl: processType === 'email' ? emailCallbackUrl : aiEmailCallbackUrl,
          ...(processType === 'ai-email' && { prompt: (tableData?.table as any)?.aiPrompt }),
        })
      }).catch(error => {
        console.error('Error sending webhook (non-blocking):', error)
      })
      
      // Start polling
      startPolling(processType, rowsToProcess)
      
    } catch (error) {
      console.error('Error in bulk processing:', error)
      alert('Error initiating bulk processing. Please try again.')
      setIsBulkProcessing(false)
      setBulkProgress(null)
      processingRowsRef.current = []
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`bulkProcessing_${spreadsheetId}`)
      }
    }
  }

  // Per-row Extract Email
  const handleExtractEmailForRow = async (row: Record<string, any>) => {
    try {
      // Add to loading state
      setSearchingEmail(prev => new Set([...prev, row.id]))
      
      // Send entire row data in payload
      const response = await fetch('https://goclienflow.com/webhook/e82458e3-cd96-4a51-8c72-4fe95fdc729b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rowData: row,
          recordId: row.id,
          action: 'extract_email'
        })
      })
      
      if (!response.ok) {
        setshowFailAlert(true)
        setTimeout(() => setshowFailAlert(false), 5000)
        return
      }
      
      let email: string | undefined
      try {
        const result = await response.json()
        email = result.email || result.data?.email || result.result?.email
      } catch {
        const text = await response.text()
        const m = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
        email = m ? m[0] : undefined
      }
      
      if (!email) {
        setshowFailAlert(true)
        setTimeout(() => setshowFailAlert(false), 5000)
        return
      }
      
      // Save to Email cell
      await updateCell(row.id, 'Email', email)
      
      // Deduct 2 credits for Extract Email
      try {
        const cd = await fetch('/api/credits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deduct', amount: 2 }) })
        const cj = await cd.json()
        if (cj.success) setCredits(cj.data.balance)
      } catch {}
      
      setShowSuccessAlert(true)
      setTimeout(() => setShowSuccessAlert(false), 5000)
    } catch (err) {
      console.error('Error extracting email:', err)
      setshowFailAlert(true)
      setTimeout(() => setshowFailAlert(false), 5000)
    } finally {
      // Remove from loading state
      setSearchingEmail(prev => {
        const newSet = new Set(prev)
        newSet.delete(row.id)
        return newSet
      })
    }
  }

  // Extract Emails (top navbar action)
  const handleExtractEmails = async () => {
    try {
      if (selectedRows.size !== 1) {
        alert('Please select exactly one row to extract emails.')
        return
      }

      const selectedId = Array.from(selectedRows)[0]
      const allRows = tableData.rows
      const row = allRows.find(r => r.id === selectedId)
      if (!row) {
        alert('Selected row not found.')
        return
      }

      // Determine which column to update for the email
      const findHeader = (candidates: string[]): string | undefined => {
        const lowerHeaders = tableData.headers.map(h => ({ h, l: h.toLowerCase() }))
        for (const cand of candidates) {
          const lc = cand.toLowerCase()
          const match = lowerHeaders.find(({ l }) => l.includes(lc))
          if (match) return match.h
        }
        return undefined
      }
      const emailColumnKey = findHeader(['email']) || 'Email'

      const response = await fetch('https://goclienflow.com/webhook/e82458e3-cd96-4a51-8c72-4fe95fdc729b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowData: row,
          spreadsheetId,
          recordId: selectedId,
          action: 'extract_email'
        })
      })

      if (!response.ok) {
        // showFailAlert
        setshowFailAlert(true)
          // Auto-hide alert after 5 seconds
          setTimeout(() => setshowFailAlert(false), 5000)
        // alert('Failed to extract email.')
        return
      }

      let email: string | undefined
      try {
        const result = await response.json()
        email = result.email || result.data?.email || result.result?.email
      } catch {
        // If webhook returns plain text
        const text = await response.text()
        // naive email extraction
        const m = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
        email = m ? m[0] : undefined
      }

      if (!email) {
        setshowFailAlert(true)
          // Auto-hide alert after 5 seconds
          setTimeout(() => setshowFailAlert(false), 5000)
        return
      }

      await updateCell(selectedId, emailColumnKey, email)
      // Deduct 2 credits for Extract Email
      try {
        const cd = await fetch('/api/credits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deduct', amount: 2 }) })
        const cj = await cd.json()
        if (cj.success) setCredits(cj.data.balance)
      } catch {}
      setShowSuccessAlert(true)
      setTimeout(() => setShowSuccessAlert(false), 5000)
    } catch (err) {
      console.error('Error extracting email:', err)
      alert('Error extracting email')
    }
  }

  return (
    <div className="space-y-4">
      {/* Success Alert */}
      {showSuccessAlert && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            Successfully generated email. If you don't see the email, please refresh the page.
          </AlertDescription>
        </Alert>
      )}

      {showFailAlert && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            Email not Found.
          </AlertDescription>
        </Alert>
      )}

      {/* Table Header */}
      <div className="flex items-center justify-end">
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm"><Bot />Set Prompt</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Set AI Prompt</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                <p className="text-sm text-muted-foreground">This prompt will be used for AI email generation for this table.</p>
                <Textarea
                  className="min-h-[160px] max-h-[400px] resize-y"
                  placeholder="Type your prompt..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t mt-3">
                <Button variant="outline" onClick={() => setPromptOpen(false)}>Cancel</Button>
                <Button
                  disabled={savingPrompt}
                  onClick={async () => {
                    if (!tableData?.table?.id) return
                    setSavingPrompt(true)
                    try {
                      const r = await fetch(`/api/tables/${tableData.table.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ aiPrompt }),
                      })
                      if (!r.ok) throw new Error('Failed to save prompt')
                      setPromptOpen(false)
                    } catch (e) {
                      alert('Failed to save prompt')
                    } finally {
                      setSavingPrompt(false)
                    }
                  }}
                >
                  {savingPrompt ? 'Saving...' : 'Save Prompt'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <span className="inline-flex items-center gap-2 text-foreground/80">
            <Database className="w-4 h-4" />
            <span>Credits Remaining: {credits ?? '—'}</span>
          </span>
        </nav>
      </div>

      {/* Progress Bar */}
      {isBulkProcessing && bulkProgress && (
        <div className="bg-muted/50 border rounded-md p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {bulkProcessType === 'email' ? 'Searching Emails' : 'Generating AI Emails'}
            </span>
            <span className="text-muted-foreground">
              {bulkProgress.processed} / {bulkProgress.total} completed
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${(bulkProgress.processed / bulkProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Bulk Process Modal */}
      <Dialog open={bulkProcessModalOpen} onOpenChange={setBulkProcessModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {bulkProcessType === 'email' ? 'Bulk Search Emails' : 'Bulk Generate AI Emails'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Select how many rows to process:
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
                onClick={() => handleBulkProcess(bulkProcessType!, 'first10')}
                disabled={isBulkProcessing}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">First 10 rows</span>
                  <span className="text-xs text-muted-foreground">Process only the first 10 rows on this page</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
                onClick={() => handleBulkProcess(bulkProcessType!, 'all')}
                disabled={isBulkProcessing}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">All rows ({paginatedRows.length})</span>
                  <span className="text-xs text-muted-foreground">Process all {paginatedRows.length} rows on this page</span>
                </div>
              </Button>
            </div>
            {isBulkProcessing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconLoader2 className="h-4 w-4 animate-spin" />
                Processing rows...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search records..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="max-w-xs border-2 border-black"
        />
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f, i) => (
            <div 
              key={`${f.field}-${i}`} 
              className="flex gap-2 items-center border rounded-md px-3 py-2 bg-card shadow-sm hover:shadow-md transition-shadow"
            >
              <Select
                value={f.field || undefined}
                onValueChange={(value) =>
                  setFilters((prev) => prev.map((p, idx) => (idx === i ? { ...p, field: value } : p)))
                }
              >
                <SelectTrigger className="h-8 w-[160px] text-sm">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {visibleHeaders.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={f.op}
                onValueChange={(value) =>
                  setFilters((prev) => prev.map((p, idx) => (idx === i ? { ...p, op: value } : p)))
                }
              >
                <SelectTrigger className="h-8 w-[140px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">contains</SelectItem>
                  <SelectItem value="equals">equals</SelectItem>
                  <SelectItem value="notEquals">not equals</SelectItem>
                  <SelectItem value="startsWith">starts with</SelectItem>
                  <SelectItem value="endsWith">ends with</SelectItem>
                  <SelectItem value="isEmpty">is empty</SelectItem>
                  <SelectItem value="isNotEmpty">is not empty</SelectItem>
                  <SelectItem value="gt">greater than</SelectItem>
                  <SelectItem value="gte">greater or equal</SelectItem>
                  <SelectItem value="lt">less than</SelectItem>
                  <SelectItem value="lte">less or equal</SelectItem>
                </SelectContent>
              </Select>

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
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Remove filter"
              >
                ✕
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFilters((prev) => [...prev, { field: visibleHeaders[0] || '', op: 'contains', value: '' }])}
            className="flex items-center gap-2"
          >
            <IconFilter className="h-4 w-4" />
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
                  <div className="flex items-center justify-between gap-2" title={header}>
                    <div className="truncate font-bold flex items-center gap-1">
                      <Type size={15} strokeWidth={3} />
                      {header}
                    </div>
                    {(header === 'Email' || header === 'AI Personalized Email') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 shrink-0"
                        onClick={() => {
                          setBulkProcessType(header === 'Email' ? 'email' : 'ai-email')
                          setBulkProcessModalOpen(true)
                        }}
                        title={`Bulk ${header === 'Email' ? 'Search' : 'Generate'} ${header}`}
                      >
                        <IconPlayerPlay className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TableHead>
              ))}
              {/* <TableHead className={`${dataColumnClass}`}>Actions</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row, index) => (
              <TableRow key={row.id || index} className="border rounded-none text-sm">
                <TableCell className={`${smallColumnClass} pl-3`}>
                  <Checkbox 
                    checked={selectedRows.has(row.id)}
                    onCheckedChange={() => handleSelectRow(row.id)}
                  />
                </TableCell>
                <TableCell className={`${smallColumnClass} text-center text-muted-foreground py-1`}>
                  {(page - 1) * rowsPerPage + index + 1}
                </TableCell>
                {visibleHeaders.map((header) => {
                  const sourceKey = resolveFieldKey(header)
                  const value = sourceKey ? (row[sourceKey] ?? '') : ''
                  const isLongText = header === 'Profile Summary' || header === 'Company Description' || header === 'AI Personalized Email'
                  const isAIPersonalizedEmail = header === 'AI Personalized Email'
                  return (
                    <TableCell key={header} className={`${dataColumnClass} rounded-none py-1 ${isAIPersonalizedEmail ? 'overflow-hidden' : ''}`}>
                      {/* Commented out: Email and AI Personalized Email buttons - now behave like regular cells */}
                      {header === 'Email' || header === 'AI Personalized Email' ? (
                        <div className={`flex items-center gap-2 ${isAIPersonalizedEmail ? 'min-w-0' : ''}`}>
                          {!value && (
                            <Button 
                              size="sm" 
                              onClick={() => (header === 'Email' ? handleExtractEmailForRow(row) : handleGenerateAIEmail(row))}
                              className="shrink-0"
                            >
                              <MailSearch className="w-4 h-4" /> {header === 'Email' ? 'Search' : 'Generate'}
                            </Button>
                          )}
                          <div className={`flex-1 ${isAIPersonalizedEmail ? 'min-w-0 overflow-hidden' : ''}`}>
                            <HoverEditableCell
                              value={value}
                              onChange={(v) => {
                                if (!sourceKey) return
                                updateCell(row.id, sourceKey, v)
                              }}
                              isTextarea={header === 'AI Personalized Email'}
                            />
                          </div>
                        </div>
                      ) : (
                        <HoverEditableCell
                          value={value}
                          onChange={(v) => {
                            if (!sourceKey) return
                            updateCell(row.id, sourceKey, v)
                          }}
                          isTextarea={isLongText}
                        />
                )}
                    </TableCell>
                  )
                })}
                {/* <TableCell className={`${dataColumnClass} py-1`}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <IconDotsVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleGenerateAIEmail(row)}
                        disabled={generatingEmail.has(row.id)}
                      >
                        {generatingEmail.has(row.id) ? 'Generating...' : 'Generate AI Email'}
                      </DropdownMenuItem>
                      <DropdownMenuItem>Send Email</DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell> */}
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
  const [spreadsheets, setSpreadsheets] = React.useState<TableConfigSummary[]>([])
  const [selectedSpreadsheet, setSelectedSpreadsheet] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [extractionModalOpen, setExtractionModalOpen] = React.useState(false)
  const [selectedExtractionType, setSelectedExtractionType] = React.useState<string | null>(null)
  const [salesNavFormData, setSalesNavFormData] = React.useState({
    searchName: "",
    salesNavUrl: "",
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = React.useState(false)

  const fetchSpreadsheets = async () => {
    try {
      const response = await fetch('/api/tables')
      const data = await response.json()
      
      if (data.success) {
        setSpreadsheets(data.data)
      }
    } catch (error) {
      console.error('Error fetching tables:', error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchSpreadsheets()
  }, [])

  // Update URL when spreadsheet selection changes
  React.useEffect(() => {
    const url = new URL(window.location.href)
    if (selectedSpreadsheet) {
      url.searchParams.set('table', selectedSpreadsheet)
    } else {
      url.searchParams.delete('table')
    }
    window.history.replaceState({}, '', url.toString())
  }, [selectedSpreadsheet])

  if (loading) {
    return (
      <div className="m-5">
        <h1 className="text-2xl font-bold mb-4 inline-flex items-center gap-2"><TableCellsMerge className="w-5 h-5" /> <span>Tables</span></h1>
        <div className="text-center py-8">Loading tables...</div>
      </div>
    )
  }

  if (spreadsheets.length === 0) {
    return (
      <div className="m-5">
        <h1 className="text-2xl font-bold mb-4 inline-flex items-center gap-2"><TableCellsMerge className="w-5 h-5" /> <span>Tables</span></h1>
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No tables yet.</p>
          <a className="underline" href="/scraper">Go to Scraper</a>
        </div>
      </div>
    )
  }

  return (
    <div className="m-5">
      <div className="flex items-start justify-between mb-6">
        <div className="flex w-full gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold inline-flex items-center gap-2"><TableCellsMerge className="w-5 h-5" /> <span>Tables</span></h1>
            <div className="flex items-center gap-3">
              <Select
                value={selectedSpreadsheet ?? undefined as any}
                onValueChange={(value) => setSelectedSpreadsheet(value)}
              >
                <SelectTrigger className="w-[280px] h-10 bg-background border-input shadow-sm hover:bg-accent/50 transition-colors">
                  <SelectValue placeholder="Select Tables" />
                </SelectTrigger>
                <SelectContent>
                  {spreadsheets.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{s.name}</span>
                        {/* <span className="text-xs text-muted-foreground ml-2">
                          {s._count.rows} records
                        </span> */}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSpreadsheet && (
                <span className="text-sm font-bold inline-flex items-center gap-1">
                  <Library className="w-4 h-4" />
                  {spreadsheets.find(s => s.id === selectedSpreadsheet)?._count.rows} records
                </span>
              )}
            </div>
          </div>
          <Dialog 
            open={extractionModalOpen} 
            onOpenChange={(open) => {
              setExtractionModalOpen(open)
              if (!open) {
                // Reset state when modal closes
                setSelectedExtractionType(null)
                setSalesNavFormData({ searchName: "", salesNavUrl: "" })
                setShowSuccessAlert(false)
                setIsSubmitting(false)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="ml-auto mt-1">
                <ListPlus /> New Extraction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create a new table</DialogTitle>
              </DialogHeader>
              
              {!selectedExtractionType ? (
                // Show extraction options
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Card 
                    className="border rounded-lg shadow-sm cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedExtractionType('salesNavigator')}
                  >
                    <CardHeader className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <MdOutlinePeopleAlt className="h-5 w-5" />
                        <CardTitle className="text-base font-medium">Scrape Sales Navigator search results</CardTitle>
                      </div>
                      <Badge className="bg-purple-100 text-purple-700">Popular</Badge>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-3">Extract people from a sales navigator search</CardDescription>
                      <Badge variant="secondary">1 Credit</Badge>
                    </CardContent>
                  </Card>

                  <Card 
                    className="border rounded-lg shadow-sm cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => window.open('/spreadsheet-import', '_blank')}
                  >
                    <CardHeader className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FaArrowDown className="h-5 w-5" />
                        <CardTitle className="text-base font-medium">Import people as csv</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-3">Import from an existing spreadsheet (xlsx, csv,..) and map columns</CardDescription>
                      <Badge variant="secondary">Free</Badge>
                    </CardContent>
                  </Card>
                </div>
              ) : selectedExtractionType === 'salesNavigator' ? (
                // Show Sales Navigator form
                <div className="space-y-4 mt-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedExtractionType(null)}
                    className="mb-2"
                  >
                    ← Back to options
                  </Button>

                  {showSuccessAlert && (
                    <div className="relative w-full rounded-lg border border-green-200 bg-green-50 p-4">
                      <IconCheck className="absolute left-4 top-4 h-4 w-4 text-green-600" />
                      <div className="pl-7 text-sm text-green-800">
                        Your request has been submitted! Your results will be visible in about 10-15 minutes in the tables.
                      </div>
                    </div>
                  )}

                  <Card className="p-4">
                    <CardHeader>
                      <CardTitle>
                        <h1 className="text-center text-lg mt-3 mb-2">Extraction set up</h1>
                        <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-md border border-blue-200">
                          LinkedIn only displays the first <b>2500 results</b> of a search, so we won't be able
                          to access any more than this.
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <label className="block font-medium mb-1">1. Give your search a name</label>
                        <Input 
                          placeholder="Start typing" 
                          value={salesNavFormData.searchName}
                          onChange={(e) => setSalesNavFormData(prev => ({ ...prev, searchName: e.target.value }))}
                        />
                      </div>

                      <div>
                        <label className="block font-medium mb-1">2. Paste the LinkedIn Sales Navigator search url</label>
                        <Input 
                          placeholder="Start typing" 
                          value={salesNavFormData.salesNavUrl}
                          onChange={(e) => setSalesNavFormData(prev => ({ ...prev, salesNavUrl: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Input example: https://www.linkedin.com/sales/search/people#query=xyz
                        </p>
                      </div>

                      <Button 
                        className="w-full" 
                        disabled={!salesNavFormData.searchName || !salesNavFormData.salesNavUrl || isSubmitting}
                        onClick={async () => {
                          setIsSubmitting(true)
                          try {
                            const response = await fetch('/api/webhook/sales-navigator', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                searchName: salesNavFormData.searchName,
                                salesNavUrl: salesNavFormData.salesNavUrl,
                              })
                            })
                            
                            const result = await response.json()
                            
                            if (response.ok) {
                              setShowSuccessAlert(true)
                              setSalesNavFormData({ searchName: "", salesNavUrl: "" })
                              // Refresh tables list after successful submission
                              fetchSpreadsheets()
                              // Close modal after 3 seconds
                              setTimeout(() => {
                                setExtractionModalOpen(false)
                                setSelectedExtractionType(null)
                                setShowSuccessAlert(false)
                              }, 3000)
                            } else {
                              alert(result.error || 'Failed to submit form. Please try again.')
                            }
                          } catch (error) {
                            console.error('Error submitting form:', error)
                            alert('Error submitting form. Please try again.')
                          } finally {
                            setIsSubmitting(false)
                          }
                        }}
                      >
                        {isSubmitting ? 'Scraping...' : 'Scrap Leads'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {selectedSpreadsheet ? (
        <DynamicTable spreadsheetId={selectedSpreadsheet} />
      ) : (
        <div className="text-sm text-muted-foreground">Select a table to view rows.</div>
      )}
    </div>
  )
}

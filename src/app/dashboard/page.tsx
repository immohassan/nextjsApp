"use client"

import * as React from "react"
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
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
import { Textarea } from "@/components/ui/textarea"
import {
  IconGripVertical,
  IconDotsVertical,
  IconCircleCheckFilled,
  IconLoader,
  IconMaximize,
  IconPlus,
  IconFilter,
  IconRefresh,
} from "@tabler/icons-react"

type RowData = {
  id: number
  header: string
  type: string
  status: string
  target: string
  limit: string
  reviewer: string
  owner: string
  priority: string
  deadline: string
  notes: string
  description: string
}

function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({ id })
  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground"
    >
      <IconGripVertical className="size-3" />
    </Button>
  )
}

function DescriptionCell({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState(value)
  return (
    <div className="flex items-center justify-between group w-full">
      <span className="truncate">{value}</span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition"
          >
            <IconMaximize size={16} />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Description</DialogTitle>
          </DialogHeader>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[200px]"
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onChange(draft)
                setOpen(false)
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DraggableRow({
  row,
  visibleCols,
  onUpdateRow,
}: {
  row: RowData
  visibleCols: Record<string, boolean>
  onUpdateRow: (id: number, field: keyof RowData, value: string) => void
}) {
  const { setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  })
  const cellClass = "border w-[150px] truncate"
  return (
    <TableRow
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 border"
      data-dragging={isDragging}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <TableCell className={cellClass}>
        <DragHandle id={row.id} /> <Checkbox />
      </TableCell>
      {visibleCols.header && (
        <TableCell className={cellClass}>
          <Button variant="link" className="px-0">
            {row.header}
          </Button>
        </TableCell>
      )}
      {visibleCols.type && (
        <TableCell className={cellClass}>
          <Badge variant="outline">{row.type}</Badge>
        </TableCell>
      )}
      {visibleCols.status && (
        <TableCell className={cellClass}>
          <Badge variant="outline" className="flex items-center gap-1">
            {row.status === "Done" ? (
              <IconCircleCheckFilled className="size-3 fill-green-500" />
            ) : (
              <IconLoader className="size-3" />
            )}
            {row.status}
          </Badge>
        </TableCell>
      )}
      {visibleCols.target && (
        <TableCell className={cellClass}>
          <Input defaultValue={row.target} className="h-8 w-full text-right" />
        </TableCell>
      )}
      {visibleCols.limit && (
        <TableCell className={cellClass}>
          <Input defaultValue={row.limit} className="h-8 w-full text-right" />
        </TableCell>
      )}
      {visibleCols.reviewer && (
        <TableCell className={cellClass}>{row.reviewer}</TableCell>
      )}
      {visibleCols.owner && (
        <TableCell className={cellClass}>{row.owner}</TableCell>
      )}
      {visibleCols.priority && (
        <TableCell className={cellClass}>{row.priority}</TableCell>
      )}
      {visibleCols.deadline && (
        <TableCell className={cellClass}>{row.deadline}</TableCell>
      )}
      {visibleCols.notes && (
        <TableCell className={cellClass}>{row.notes}</TableCell>
      )}
      {visibleCols.description && (
        <TableCell className={cellClass}>
          <DescriptionCell
            value={row.description}
            onChange={(newVal) => onUpdateRow(row.id, "description", newVal)}
          />
        </TableCell>
      )}
      <TableCell className={cellClass}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <IconDotsVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Generate AI Summary</DropdownMenuItem>
            <DropdownMenuItem>Enrich Lead</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

export function SimpleDnDTable() {
  const [rows, setRows] = React.useState<RowData[]>([
    {
      id: 1,
      header: "Executive Summary",
      type: "Section",
      status: "Done",
      target: "15",
      limit: "20",
      reviewer: "Eddie Lake",
      owner: "Alice",
      priority: "High",
      deadline: "2025-10-15",
      notes: "Completed early",
      description: "This section explains the proposal at a high level.",
    },
    {
      id: 2,
      header: "Technical Approach",
      type: "Section",
      status: "In Progress",
      target: "10",
      limit: "12",
      reviewer: "Emily Whalen",
      owner: "Bob",
      priority: "Medium",
      deadline: "2025-10-20",
      notes: "Needs review",
      description: "Detailing how the technical solution will be implemented.",
    },
  ])

  const [filters, setFilters] = React.useState<
    { field: keyof RowData; value: string }[]
  >([])
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const rowsPerPage = 5

  const [visibleCols, setVisibleCols] = React.useState<Record<string, boolean>>({
    header: true,
    type: true,
    status: true,
    target: true,
    limit: true,
    reviewer: true,
    owner: true,
    priority: true,
    deadline: true,
    notes: true,
    description: true,
  })

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor), useSensor(KeyboardSensor))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setRows((prev) => {
        const oldIndex = prev.findIndex((r) => r.id === active.id)
        const newIndex = prev.findIndex((r) => r.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  const filteredRows = rows.filter((row) => {
    const matchesSearch = row.header.toLowerCase().includes(search.toLowerCase())
    const matchesFilters = filters.every(
      (f) => row[f.field]?.toString().toLowerCase().includes(f.value.toLowerCase())
    )
    return matchesSearch && matchesFilters
  })

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage)
  const paginatedRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const cellClass = "border w-[150px] truncate"

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder="Search by header..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="max-w-xs"
          />
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {filters.map((f, i) => (
              <div key={i} className="flex gap-2 items-center border rounded-md px-2 py-1">
                <Select
                  value={f.field}
                  onValueChange={(val) =>
                    setFilters((prev) =>
                      prev.map((p, idx) => (idx === i ? { ...p, field: val as keyof RowData } : p))
                    )
                  }
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(visibleCols).map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Value"
                  value={f.value}
                  onChange={(e) =>
                    setFilters((prev) =>
                      prev.map((p, idx) => (idx === i ? { ...p, value: e.target.value } : p))
                    )
                  }
                  className="w-[120px]"
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
              onClick={() => setFilters((prev) => [...prev, { field: "header", value: "" }])}
            >
              <IconPlus size={14} className="mr-1" /> Add Filter
            </Button>
          </div>
        </div>

        {/* Right-side buttons */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <IconFilter size={16} className="mr-1" /> Advanced Filters
          </Button>
          <Button size="sm" variant="outline">
            <IconRefresh size={16} className="mr-1" /> Refresh
          </Button>
          <Button size="sm" variant="outline">
            <IconPlus size={16} className="mr-1" /> New Entry
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.keys(visibleCols).map((col) => (
                <DropdownMenuItem
                  key={col}
                  onClick={() =>
                    setVisibleCols((prev) => ({
                      ...prev,
                      [col]: !prev[col],
                    }))
                  }
                >
                  <Checkbox checked={visibleCols[col]} className="mr-2" /> {col}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="w-full max-w-full max-h-[500px] overflow-auto border rounded-md">
        <Table className="border-collapse border table-fixed min-w-[1600px]">
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow className="border">
              <TableHead className="border w-20 truncate"></TableHead>
              {Object.entries(visibleCols).map(
                ([key, visible]) => visible && <TableHead key={key}>{key}</TableHead>
              )}
              <TableHead className={cellClass}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <SortableContext
              items={paginatedRows.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              {paginatedRows.map((row) => (
                <DraggableRow
                  key={row.id}
                  row={row}
                  visibleCols={visibleCols}
                  onUpdateRow={(id, field, val) =>
                    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)))
                  }
                />
              ))}
            </SortableContext>
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-2">
        <span>
          Page {page} of {totalPages}
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
    </DndContext>
  )
}

export default function Page() {
  return (
    <div className="m-5">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <SimpleDnDTable />
    </div>
  )
}

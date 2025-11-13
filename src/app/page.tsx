"use client"

import * as React from "react"

export default function Home() {
  const [amount, setAmount] = React.useState(10)
  const [balance, setBalance] = React.useState<number | null>(null)

  React.useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch('/api/credits')
        const d = await r.json()
        if (d.success) setBalance(d.data.balance)
      } catch {}
    }
    load()
  }, [])

  const topup = async () => {
    try {
      const r = await fetch('/api/credits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'topup', amount }) })
      const d = await r.json()
      if (d.success) setBalance(d.data.balance)
    } catch {}
  }

  return (
    <div className="m-5 space-y-4">
      <h1 className="text-2xl font-semibold">Home</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Credits: {balance ?? '—'}</span>
        <input type="number" className="border px-2 py-1 w-24" value={amount} onChange={(e) => setAmount(parseInt(e.target.value || '0', 10))} />
        <button className="border px-3 py-1" onClick={topup}>Top up</button>
      </div>
    </div>
  )
}

"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartRadialShape } from "@/components/charts/chart-radial-shape"
import { ChartRadarGridCircle } from "@/components/charts/chart-radar-grid-circle"

export default function CreditsPage() {
  const [balance, setBalance] = React.useState<number | null>(null)
  const [topupAmount, setTopupAmount] = React.useState(10)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const loadCredits = async () => {
      try {
        const response = await fetch('/api/credits')
        const data = await response.json()
        if (data.success) {
          setBalance(data.data.balance)
        }
      } catch (error) {
        console.error('Error loading credits:', error)
      }
    }
    loadCredits()
  }, [])

  const handleTopup = async () => {
    if (topupAmount <= 0) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'topup', amount: topupAmount })
      })
      
      const data = await response.json()
      if (data.success) {
        setBalance(data.data.balance)
        setTopupAmount(10) // Reset to default
      } else {
        alert('Failed to top up credits')
      }
    } catch (error) {
      console.error('Error topping up:', error)
      alert('Error topping up credits')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">AI Credits Usage</h1>
      <p className="text-muted-foreground">
        Track your remaining credits and usage trends
      </p>

      {/* Credits Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Balance</CardTitle>
          <CardDescription>Your available AI credits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">
              {balance !== null ? balance : '—'} credits
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={topupAmount}
                onChange={(e) => setTopupAmount(parseInt(e.target.value) || 0)}
                className="w-20"
                min="1"
              />
              <Button 
                onClick={handleTopup} 
                disabled={loading || topupAmount <= 0}
              >
                {loading ? 'Adding...' : 'Top Up'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radial Chart */}
        <ChartRadialShape />

        {/* Radar Chart */}
        <ChartRadarGridCircle />
      </div>
    </div>
  )
}

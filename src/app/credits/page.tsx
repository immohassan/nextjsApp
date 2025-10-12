"use client"

import React from "react"
import { ChartRadialShape } from "@/components/charts/chart-radial-shape"
import { ChartRadarGridCircle } from "@/components/charts/chart-radar-grid-circle"

export default function CreditsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">AI Credits Usage</h1>
      <p className="text-muted-foreground">
        Track your remaining credits and usage trends
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radial Chart */}
        <ChartRadialShape />

        {/* Radar Chart */}
        <ChartRadarGridCircle />
      </div>
    </div>
  )
}

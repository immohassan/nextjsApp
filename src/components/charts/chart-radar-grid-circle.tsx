"use client"

import { TrendingUp } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { month: "Monday", credits: 186 },
  { month: "Tuesday", credits: 305 },
  { month: "Wednesday", credits: 237 },
  { month: "Thursday", credits: 273 },
  { month: "Friday", credits: 209 },
  { month: "Saturday", credits: 214 },
  { month: "Sunday", credits: 214 },
]

const chartConfig = {
  credits: { label: "credits", color: "var(--chart-1)" },
} satisfies ChartConfig

export function ChartRadarGridCircle() {
  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>Credits Usage</CardTitle>
        <CardDescription>
          Check Credits Usage over a week
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarGrid gridType="circle" />
            <PolarAngleAxis dataKey="month" />
            <Radar
              dataKey="credits"
              fill="var(--color-credits)"
              fillOpacity={0.6}
              dot={{ r: 4, fillOpacity: 1 }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% this Week <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground flex items-center gap-2 leading-none">
          Monday - Sunday
        </div>
      </CardFooter>
    </Card>
  )
}

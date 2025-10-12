"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconArrowLeft, IconClock, IconListDetails } from "@tabler/icons-react"

export default function SalesNavPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/scraper">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <IconArrowLeft className="h-4 w-4" />
            Back
          </Button>
          </Link>
          <h1 className="text-xl font-semibold">Sales Nav Search Results</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled>Start a new extraction</Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <IconListDetails className="h-4 w-4" />
            History
          </Button>
        </div>
      </div>

      {/* Body: two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Extraction setup */}
        <Card className="p-4">
          <CardHeader>
            <CardTitle>
              A. Extraction set up{" "}
              <span className="text-sm font-normal text-muted-foreground">
                Fill the form and launch the extraction
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-md border border-blue-200">
              LinkedIn only displays the first <b>2500 results</b> of a search, so we won’t be able
              to access any more than this.
            </div>

            <div>
              <label className="block font-medium mb-1">1. Give your search a name</label>
              <Input placeholder="Start typing" />
            </div>

            <div>
              <label className="block font-medium mb-1">2. Paste the LinkedIn Sales Navigator search url</label>
              <Input placeholder="Start typing" />
              <p className="text-xs text-muted-foreground mt-1">
                Input example: https://www.linkedin.com/sales/search/people#query=xyz
              </p>
            </div>

            <div>
              <label className="block font-medium mb-1">3. Connect your LinkedIn account</label>
              <div className="flex items-center gap-2 mb-2">
                <Button size="sm" variant="secondary" className="bg-pink-100 text-pink-700">
                  Download extension
                </Button>
              </div>
              <Input placeholder='Paste your "li_at" cookie' />
            </div>

            <Button className="w-full" disabled>
              Missing input
            </Button>
          </CardContent>
        </Card>

        {/* Right: Extraction progress */}
        {/* <Card className="p-4">
          <CardHeader>
            <CardTitle>
              B. Extraction progress{" "}
              <span className="text-sm font-normal text-muted-foreground">
                Extraction’s progression and results
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-md">
              <p className="font-medium">1. Validating your LinkedIn’s session cookie</p>
              <p className="text-sm text-muted-foreground">Activity will appear here</p>
            </div>

            <div className="p-4 border rounded-md">
              <p className="font-medium">2. Extracting</p>
              <p className="text-sm text-muted-foreground">Activity will appear here</p>
            </div>

            <div className="p-4 border rounded-md">
              <p className="font-medium">3. Importing results to a table</p>
              <p className="text-sm text-muted-foreground">Activity will appear here</p>
            </div>

            <Button className="w-full" variant="outline" disabled>
              See your results →
            </Button>
          </CardContent>
        </Card> */}
      </div>
    </div>
  )
}

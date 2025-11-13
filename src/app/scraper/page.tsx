// src/app/dashboard/newpage/page.tsx
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconPlus, IconDots, IconPlayerPlay } from "@tabler/icons-react"
import { FaLinkedin, FaArrowDown } from "react-icons/fa"
import { LuRadar } from "react-icons/lu"
import { MdOutlinePeopleAlt, MdOutlineBusiness } from "react-icons/md"

export default function NewDashboardPage() {
  const cards = [
    {
      title: "Scrape Sales Navigator search results",
      desc: "Extract people from a sales navigator search",
      badge: "1 Credit",
      tag: "Popular",
      icon: <MdOutlinePeopleAlt className="h-5 w-5" />,
      href: "/scraper/salesNavigator"
    },
    // {
    //   title: "Extract leads from Apollo",
    //   desc: "Extract leads from an Apollo search",
    //   badge: "Free",
    //   tag: "Popular",
    //   icon: <LuRadar className="h-5 w-5" />,
    //   href: "/scraper/salesNavigator"
    // },
    // {
    //   title: "Extract Linkedin post likers and commenters",
    //   desc: "Extract the users who have reacted or commented on a LinkedIn post",
    //   badge: "Free",
    //   icon: <FaLinkedin className="h-5 w-5 text-blue-600" />,
    //   href: "/scraper/salesNavigator"
    // },
    {
      title: "Import people as csv",
      desc: "Import from an existing spreadsheet (xlsx, csv,..) and map columns",
      badge: "Free",
      icon: <FaArrowDown className="h-5 w-5" />,
      href: "/spreadsheet-import"
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <h2 className="text-xl font-semibold">Welcome back, Muhammad!</h2>

      {/* Tabs for create / existing */}
      <Tabs defaultValue="new" className="w-full">
        <TabsList className="flex space-x-2 rounded-md border w-fit p-1">
          <TabsTrigger value="new" className="px-3 py-1.5 rounded-md border data-[state=active]:bg-muted">
            Create a new table
          </TabsTrigger>
          <TabsTrigger value="existing" className="px-3 py-1.5 rounded-md border data-[state=active]:bg-muted">
            Existing tables
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Category Tabs */}
      {/* <Tabs defaultValue="people" className="w-full">
        <TabsList className="flex gap-2">
          <TabsTrigger value="people" className="flex items-center gap-2 px-3 py-1.5 border rounded-md data-[state=active]:bg-muted">
            <MdOutlinePeopleAlt /> Find people
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center gap-2 px-3 py-1.5 border rounded-md data-[state=active]:bg-muted">
            <MdOutlineBusiness /> Find companies
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2 px-3 py-1.5 border rounded-md data-[state=active]:bg-muted">
            <LuRadar /> Monitor <Badge className="ml-1 bg-yellow-100 text-yellow-700">New</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs> */}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
        <Link key={i} href={card.href} className="block">
          <Card key={i} className="border rounded-lg shadow-sm">
            <CardHeader className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {card.icon}
                <CardTitle className="text-base font-medium">{card.title}</CardTitle>
              </div>
              {card.tag && <Badge className="bg-purple-100 text-purple-700">{card.tag}</Badge>}
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-3">{card.desc}</CardDescription>
              <div className="flex justify-between items-center text-sm">
                <Badge variant="secondary">{card.badge}</Badge>
                <div className="flex items-center gap-2">
                  {/* <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <IconPlayerPlay size={14} /> Demo
                  </Button> */}
                  {/* <Button variant="ghost" size="sm"><IconPlus size={14} /></Button>
                  <Button variant="ghost" size="sm"><IconDots size={14} /></Button> */}
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { searchName, searchUrl, liAt } = await req.json()

    // Replace with your actual Apify Actor ID and token
    const APIFY_TOKEN = "apify_api_mp7QiWgpwJbYI1KaOsfMuG3ynBdFMt2cMnxW";
    const ACTOR_ID = ""

    // Trigger actor run
    const runRes = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchName,
        searchUrl,
        liAt
      }),
    })
    const runData = await runRes.json()
    const runId = runData.data.id

    // Wait until run completes
    let datasetUrl = ""
    while (true) {
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`)
      const statusData = await statusRes.json()
      if (["SUCCEEDED", "FAILED", "TIMED-OUT", "ABORTED"].includes(statusData.data.status)) {
        if (statusData.data.status === "SUCCEEDED") {
          datasetUrl = statusData.data.defaultDatasetId
        }
        break
      }
      await new Promise(r => setTimeout(r, 5000))
    }

    // Fetch results
    if (datasetUrl) {
      const resultsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetUrl}/items?clean=true&token=${APIFY_TOKEN}`)
      const data = await resultsRes.json()
      return NextResponse.json({ success: true, data })
    } else {
      return NextResponse.json({ success: false, message: "Scraping failed" })
    }
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}

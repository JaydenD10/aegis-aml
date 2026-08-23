import { redirect } from "next/navigation"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tx_id = searchParams.get("tx") || searchParams.get("tx_id")
  if (tx_id && tx_id.trim()) {
    redirect(`/explainability/${encodeURIComponent(tx_id.trim())}`)
  }
  redirect("/explainability")
}

import { redirect } from "next/navigation"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const accountId = searchParams.get("account") || searchParams.get("accountId")
  if (accountId && accountId.trim()) {
    redirect(`/drift/${encodeURIComponent(accountId.trim())}`)
  }
  redirect("/drift")
}

// app/api/mock-data/[...key]/route.ts

import { readFile } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string[] } }
) {
  // Hard stop in production — this route should never be reachable
  if (process.env.DATA_SOURCE !== 'local') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const key = params.key.join('/')
  
  // Prevent path traversal — only serve from mock-data directory
  const safePath = path.join(process.cwd(), 'mock-data', key)
  if (!safePath.startsWith(path.join(process.cwd(), 'mock-data'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const file = await readFile(safePath)
    return new NextResponse(file, {
      headers: { 'Content-Type': 'application/octet-stream' }
    })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
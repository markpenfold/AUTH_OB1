'use client'

import { useState } from 'react'
import * as duckdb from '@duckdb/duckdb-wasm'

type Slice = {
  id: string
  name: string
  description: string
  date_range: string
  row_count: number
  size_mb: number
}

export function SliceExplorer({ 
  slices,
  userId
}: { 
  slices: Slice[]
  userId: string
}) {
  const [selectedSlice, setSelectedSlice] = useState<Slice | null>(null)
  const [loading, setLoading] = useState(false)
  const [queryResults, setQueryResults] = useState(null)

  async function handleSliceSelect(slice: Slice) {
    setLoading(true)
    setSelectedSlice(slice)

    // Call the Route Handler — this is where auth is re-verified server-side
    const response = await fetch(`/api/data/slice-url?sliceId=${slice.id}`)
    
    if (!response.ok) {
      // Handle 401 (not authed) or 403 (not entitled)
      setLoading(false)
      return
    }

    const { url, schema } = await response.json()

    // Load into DuckDB WASM
    // ... duckdb initialisation and query logic here

    setLoading(false)
  }

  return (
    <div>
      <div className="slice-list">
        {slices.map(slice => (
          <button 
            key={slice.id}
            onClick={() => handleSliceSelect(slice)}
          >
            <strong>{slice.name}</strong>
            <span>{slice.description}</span>
            <span>{slice.size_mb}mb · {slice.row_count.toLocaleString()} rows</span>
          </button>
        ))}
      </div>

      {loading && <div>Loading slice...</div>}
      {queryResults && <div>{/* render results */}</div>}
    </div>
  )
}
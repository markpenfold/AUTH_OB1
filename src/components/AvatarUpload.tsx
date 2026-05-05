'use client'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function AvatarUpload({ userId }: { userId: string }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // 1. Just "Capture" the file when they pick it
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const MAX_FILE_SIZE = 512000
    const file = event.target.files?.[0]
    if (!file) return

    // CHECK SIZE HERE - inside the handler
    if (file.size > MAX_FILE_SIZE) {
        alert("File is too large! Please choose an image under 500 KB.")
        event.target.value = "" // Reset the actual HTML input
        setSelectedFile(null)
        return
      }

      setSelectedFile(file)

  }

  



  // 2. Only "Upload" when they click the actual button
  const startUpload = async () => {
    if (!selectedFile) return
    
    setUploading(true)
    const supabase = createClient()
    const filePath = `${userId}/avatar-${Date.now()}.png`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, selectedFile)

    setUploading(false)
    if (error) alert("Upload failed")
    else {
        alert("Success!")
        setSelectedFile(null) // Clear selection
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <input type="file" onChange={handleFileSelect} accept="image/*" />
      
      {selectedFile && (
        <button 
          onClick={startUpload} 
          disabled={uploading}
          className="bg-blue-500 text-white p-2 rounded"
        >
          {uploading ? 'Uploading...' : 'Confirm & Save Avatar'}
        </button>
      )}
    </div>
  )
}
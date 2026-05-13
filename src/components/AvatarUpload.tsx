'use client'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { avatarSchema } from "@/lib/validations/primitives";
import styles from '@/app/styles/styles.module.css';


export default function AvatarUpload({ userId }: { userId: string }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false)

  // 1. Just "Capture" the file when they pick it
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null); // Reset errors on new selection
    const file = event.target.files?.[0]
    if (!file) return

    // VALIDATE WITH ZOD
    const result = avatarSchema.safeParse({ image: file });

    // HANDLE ERRORS
    if (!result.success) {
      // Get the first error message from the Zod result
      setErrorMsg(result.error.issues[0].message);
      event.target.value = ""; // Reset HTML input
      setSelectedFile(null);
      return;
    }

      setSelectedFile(file)

  }

  



  // 2. Only "Upload" when they click the actual button
  const startUpload = async () => {
    if (!selectedFile) return
    
    setUploading(true)
    const supabase = createClient()
    const filePath = `${userId}/avatar.png`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, selectedFile, {
        upsert: true // This overwrites the old file if it exists
      });

    setUploading(false)


    if (error) alert("Upload failed. Please try again.")
    else {
        alert("Avatar updated successfully!")
        setSelectedFile(null) // Clear selection
    }
  }

  return (
    <div className={styles.uploader}>
     <label className={styles.loading_label}>Profile Picture</label>
      
      <input 
        type="file" 
        onChange={handleFileSelect} 
        accept="image/*"
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      
      {/* ERROR MESSAGE DISPLAY */}
      {errorMsg && (
        <p className="text-red-500 text-xs italic">{errorMsg}</p>
      )}
      
      {selectedFile && (
        <button 
          onClick={startUpload} 
          disabled={uploading}
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition-colors disabled:bg-gray-400"
        >
          {uploading ? 'Saving...' : 'Confirm & Save Avatar'}
        </button>
      )}
    </div>
  )
}
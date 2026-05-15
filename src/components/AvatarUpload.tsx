'use client'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { avatarSchema } from "@/lib/validations/primitives"
import styles from '@/app/styles/styles.module.css'
import {BUCKET_URL} from '@/lib/constants'

export default function AvatarUpload({ userId }: { userId: string }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false)

  //Start with an empty string to avoid Hydration Mismatch
  const [version, setVersion] = useState('')

  const supabase = createClient()
  const baseUrl = `${BUCKET_URL}/${userId}/avatar.png`
  
  // Computed URL: Only adds the ?v= if version has been set (after upload)
  const previewUrl = version ? `${baseUrl}?v=${version}` : baseUrl

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
        // CACHE BUST: Only happens on the client, after the action. 
        setVersion(Date.now().toString())
        setSelectedFile(null)
    }
  }

  return (
    <div className={styles.uploader}>
     <label className={styles.loading_label}>Profile Picture</label>
      <img 
        src={previewUrl} 
        alt="Avatar" 
        className={styles.previewAvatar}
        onError={(e) => {
          // Fallback if user has no avatar yet
          (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=User';
        }}
      />
      <input 
        type="file" 
        onChange={handleFileSelect} 
        accept="image/*"
        className={styles.previewAvatar}
      />
      
      {/* ERROR MESSAGE DISPLAY */}
      {errorMsg && (
        <p className={styles.previewAvatar}>{errorMsg}</p>
      )}
      
      {selectedFile && (
        <button 
          onClick={startUpload} 
          disabled={uploading}
          className={styles.previewAvatar}
        >
          {uploading ? 'Saving...' : 'Confirm & Save Avatar'}
        </button>
      )}
    </div>
  )
}
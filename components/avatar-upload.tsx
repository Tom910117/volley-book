"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-browser"
import imageCompression from "browser-image-compression"
import { Loader2, Upload, User } from "lucide-react"
import Image from "next/image"

type Props = {
  uid: string
  url: string | null
  onUpload: (url: string) => void
}

export default function AvatarUpload({ uid, url, onUpload }: Props) {
  const supabase = createClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url)
  const [uploading, setUploading] = useState(false)

  // 📥 下載圖片 (如果有的話)
  useEffect(() => {
    if (url) downloadImage(url)
  }, [url])

  async function downloadImage(path: string) {
    try {
      // 因為我們 Bucket 設為 Public，直接組網址最快，不用 createSignedUrl
      // 這裡假設你的 bucket 叫做 'avatars'
      const { data } = supabase.storage.from("avatars").getPublicUrl(path)
      
      // 🔥 加上時間戳記，避免瀏覽器快取舊圖 (因為我們檔名都一樣)
      setAvatarUrl(`${data.publicUrl}?t=${new Date().getTime()}`)
    } catch (error) {
      console.log("Error downloading image: ", error)
    }
  }

  // 📤 上傳邏輯 (含壓縮)
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("請選擇圖片")
      }

      const file = event.target.files[0]

      // 1. 壓縮圖片
      console.log(`原始大小: ${file.size / 1024 / 1024} MB`)
      const options = {
        maxSizeMB: 0.2,          // 目標壓縮到 200KB 以下
        maxWidthOrHeight: 300,   // 限制長寬 300px
        useWebWorker: true,
        fileType: "image/webp"   // 轉成 WebP
      }
      const compressedFile = await imageCompression(file, options)
      console.log(`壓縮後大小: ${compressedFile.size / 1024 / 1024} MB`)

      // 2. 設定固定檔名 (User ID)
      // 這樣每次上傳都會覆蓋舊的，節省空間
      const filePath = `${uid}.webp`

      // 3. 上傳到 Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, compressedFile, { upsert: true }) // upsert: true 是關鍵，允許覆蓋！

      if (uploadError) throw uploadError

      // 4. 通知父元件更新資料庫
      onUpload(filePath)
      
      // 5. 更新本地預覽
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
      setAvatarUrl(`${data.publicUrl}?t=${new Date().getTime()}`) // 更新畫面

    } catch (error: any) {
      alert("上傳失敗: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group cursor-pointer">
        {/* 頭像顯示區 */}
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-16 h-16 text-gray-400" />
          )}
          
          {/* 上傳中遮罩 */}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* 隱藏的 Input + 覆蓋在上面的按鈕 */}
        <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white shadow-md hover:bg-blue-700 transition-colors cursor-pointer">
          <Upload className="w-4 h-4" />
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={uploadAvatar}
            disabled={uploading}
          />
        </label>
      </div>
      <p className="text-xs text-gray-500">建議尺寸 300x300 (WebP)</p>
    </div>
  )
}
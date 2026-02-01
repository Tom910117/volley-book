"use client"

import { Share2, Check, MessageCircle } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function ShareGameButton({ gameId, title }: { gameId: string, title: string }) {
  const [copied, setCopied] = useState(false)
  
  const getShareUrl = () => `${window.location.origin}/games/${gameId}`
  
  const handleNativeShare = async () => {
    const url = getShareUrl()
    const shareText = `🏐 缺人！快來報名：${title}\n👉 點擊報名：`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'VolleyBook', text: shareText, url: url })
        return
      } catch (err) { console.log('User cancelled') }
    }
    copyToClipboard()
  }

  const copyToClipboard = async () => {
    try {
      const url = getShareUrl()
      const shareText = `🏐 缺人！快來報名：${title}\n👉 ${url}`
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      toast.success("連結已複製！")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) { toast.error("複製失敗") }
  }

  const shareToLine = () => {
    const url = getShareUrl()
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`
    window.open(lineUrl, '_blank', 'width=600,height=500')
  }

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {/* 1. 一般分享/複製 (改成灰白色調，減少視覺干擾) */}
      <button 
        onClick={handleNativeShare}
        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all shadow-sm font-medium"
      >
        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
        {copied ? "已複製" : "複製/分享"}
      </button>

      {/* 2. Line 分享 (保留品牌綠色，但在電腦版才顯示，或是手機版也顯示強化推廣) */}
      {/* 註：這裡我去掉 hidden md:flex，讓手機版主揪也能看到專屬 Line 按鈕，方便他轉傳群組 */}
      <button
        onClick={shareToLine}
        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#06C755] text-white rounded-xl hover:bg-[#05b34c] transition-all shadow-sm font-bold"
      >
        <MessageCircle className="w-5 h-5 fill-white" /> 
        <span>LINE 揪團</span>
      </button>
    </div>
  )
}
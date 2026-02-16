"use client"

import { Share2, Check, MessageCircle, Link as LinkIcon, Facebook, X } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

export function ShareGameButton({ gameId, title }: { gameId: string, title: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState("")

  // 確保在客戶端取得正確的網址
  useEffect(() => {
    setShareUrl(`${window.location.origin}/games/${gameId}`)
  }, [gameId])
  
  const shareText = `🏐 缺人！快來報名：${title}`

  // 1. 系統原生分享 (手機端最愛)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'VolleyBook', text: shareText, url: shareUrl })
        setIsOpen(false)
      } catch (err) { console.log('User cancelled') }
    } else {
      copyToClipboard()
    }
  }

  // 2. 複製網址
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n👉 ${shareUrl}`)
      setCopied(true)
      toast.success("連結已複製！")
      setTimeout(() => {
        setCopied(false)
        setIsOpen(false)
      }, 1500)
    } catch (err) { toast.error("複製失敗") }
  }

  // 3. Line 分享
  const shareToLine = () => {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`
    window.open(lineUrl, '_blank', 'width=600,height=500')
    setIsOpen(false)
  }

  // 4. FB 分享
  const shareToFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    window.open(fbUrl, '_blank', 'width=600,height=500')
    setIsOpen(false)
  }

  return (
    <>
      {/* 觸發按鈕：低調、精緻的小圓角按鈕 */}
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2.5 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-full transition-colors"
        aria-label="分享"
      >
        <Share2 className="w-5 h-5" />
      </button>

      {/* 彈出視窗 (Modal) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
          {/* 背景點擊關閉 */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>
          
          {/* 彈窗本體 (手機版靠下，電腦版居中) */}
          <div className="relative w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            
            <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="font-bold text-zinc-800">分享球局</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-zinc-200 rounded-full transition-colors text-zinc-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-4 gap-4">
              {/* Line */}
              <button onClick={shareToLine} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-[#06C755] flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-6 h-6 fill-white" />
                </div>
                <span className="text-xs font-medium text-zinc-600">LINE</span>
              </button>

              {/* FB */}
              <button onClick={shareToFacebook} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                  <Facebook className="w-6 h-6 fill-white" />
                </div>
                <span className="text-xs font-medium text-zinc-600">Facebook</span>
              </button>

              {/* 原生分享 (如果是手機，通常會有更多選項如 IG) */}
              <button onClick={handleNativeShare} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                  <Share2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-zinc-600">更多</span>
              </button>

              {/* 複製連結 */}
              <button onClick={copyToClipboard} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 group-hover:bg-zinc-200 transition-colors">
                  {copied ? <Check className="w-6 h-6 text-green-600" /> : <LinkIcon className="w-5 h-5" />}
                </div>
                <span className="text-xs font-medium text-zinc-600">{copied ? "已複製" : "複製連結"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
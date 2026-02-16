"use client"

import { useEffect, useRef } from "react"
// 🌟 改變 1：我們這次引入純底層的 Html5Qrcode
import { Html5Qrcode } from "html5-qrcode"
import { Camera, X } from "lucide-react"

type Props = {
  onScanSuccess: (decodedText: string) => void
  onClose: () => void
}

export default function QRScanner({ onScanSuccess, onClose }: Props) {
  // 防止 React 嚴格模式重複啟動相機的鎖
  const isMounted = useRef(false)
  // 存放相機實體，方便卸載時呼叫停止
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    // 🌟 改變 2：終極防禦！如果已經啟動過，絕對不執行第二次 (解決雙重畫面)
    if (isMounted.current) return
    isMounted.current = true

    // 實例化底層引擎
    const html5QrCode = new Html5Qrcode("reader")
    html5QrCodeRef.current = html5QrCode

    // 🌟 改變 3：直接控制硬體啟動
    html5QrCode.start(
      { facingMode: "environment" }, // 強制使用手機後置鏡頭
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 } 
      },
      (decodedText) => {
        // 掃描成功時：先立刻「關閉硬體」，再執行後續 API 更新
        if (html5QrCode.isScanning) {
          html5QrCode.stop().then(() => {
            html5QrCode.clear()
            onScanSuccess(decodedText)
          }).catch(err => console.error("停止相機失敗", err))
        }
      },
      (errorMessage) => {
        // 忽略掃描過程中的尋找錯誤
      }
    ).catch((err) => {
      console.error("相機啟動失敗或權限被拒絕", err)
    })

    // 🌟 改變 4：元件卸載時，強制切斷硬體連線 (解決鏡頭關不掉)
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop()
          .then(() => html5QrCodeRef.current?.clear())
          .catch(err => console.error("卸載清理失敗", err))
      }
    }
  }, [onScanSuccess]) // 依賴陣列加上 onScanSuccess

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden relative shadow-2xl">
        
        {/* 頂部標題 */}
        <div className="bg-zinc-900 text-white p-4 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" /> 掃描球友護照
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-zinc-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* 掃描器畫面本體 */}
        <div className="p-4 bg-zinc-100">
          <div 
            id="reader" 
            className="w-full rounded-xl overflow-hidden border-2 border-dashed border-zinc-300 bg-white shadow-inner"
          ></div>
        </div>
        
        <div className="p-4 text-center text-sm font-medium text-zinc-500 bg-white">
          請將球友的手機螢幕對準掃描框
        </div>
        
      </div>
    </div>
  )
}
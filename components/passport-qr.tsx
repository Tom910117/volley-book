"use client"

import { QRCodeSVG } from "qrcode.react"
import { ScanFace } from "lucide-react"

export default function PassportQR({ userId }: { userId: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex flex-col items-center justify-center space-y-4">
      <div className="text-center space-y-1">
        <h3 className="font-bold text-gray-800 flex items-center justify-center gap-2">
          <ScanFace className="w-5 h-5 text-blue-600" />
          我的專屬報到碼
        </h3>
        <p className="text-xs text-gray-500">
          打球時請出示此條碼給主揪掃描
        </p>
      </div>

      {/* QR Code 本體 */}
      <div className="bg-white p-4 rounded-xl shadow-inner border-2 border-dashed border-gray-200">
        <QRCodeSVG 
          value={userId} // 這裡藏著使用者的唯一 ID
          size={160}
          bgColor={"#ffffff"}
          fgColor={"#000000"}
          level={"H"} // 高容錯率，稍微遮擋也能掃
          includeMargin={false}
        />
      </div>
      
      <p className="text-[10px] text-gray-300 font-mono text-center break-all w-48">
        {userId}
      </p>
    </div>
  )
}
// components/update-game-button.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UpdateGameForm } from "@/components/update-game-form" // 確保路徑正確
import { PenLine } from "lucide-react" // 引入帥氣的編輯圖示

type Props = {
  game: any
  isLocked: boolean
  existingGames: any[]
}

export function UpdateGameButton({ game, isLocked, existingGames }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button 
        variant="outline" 
        className="flex-1 bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50 hover:text-black gap-2 shadow-sm"
        onClick={() => setIsOpen(true)}
      >
        <PenLine className="w-4 h-4" /> {/* 加上這行 */}
        編輯球局
      </Button>

      {/* 呼叫我們寫好的表單元件 */}
      <UpdateGameForm 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        game={game}
        isLocked={isLocked}
        existingGames={existingGames}
      />
    </>
  )
}
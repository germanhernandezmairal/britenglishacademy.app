"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, Circle } from "lucide-react"
import { toggleLessonCompletion } from "@/app/actions/lessons"

export function CompletionButton({
  lessonId,
  isCompleted: initialCompleted,
}: {
  lessonId: string
  isCompleted: boolean
}) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      const prev = completed
      setCompleted(!prev)
      const result = await toggleLessonCompletion(lessonId)
      if ("error" in result && result.error) setCompleted(prev)
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-semibold text-sm transition-all disabled:opacity-60"
      style={
        completed
          ? { background: "#D1FAE5", color: "#16A34A", border: "2px solid #6EE7B7" }
          : { background: "var(--color-primary)", color: "white", border: "2px solid transparent" }
      }
    >
      {completed ? (
        <>
          <CheckCircle2 size={18} />
          Lección completada — haz clic para desmarcar
        </>
      ) : (
        <>
          <Circle size={18} />
          Marcar como completada
        </>
      )}
    </button>
  )
}

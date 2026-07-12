"use client"

import { type MouseEvent, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

type Props = {
  text: string
  className?: string
}

/**
 * Однострочный текст с обрезкой в троеточие. Если текст реально обрезан, нажатие показывает
 * подсказку с полным значением и не «проваливается» в ссылку-обёртку; целиком видимый текст
 * на клики не реагирует и ведёт себя как обычный span.
 */
export function TruncatedText({ text, className }: Props) {
  const wrapRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    // pointerdown, а не click: подсказка закрывается до того, как клик дойдёт до ссылки под ней.
    const close = (e: Event) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", close)
    document.addEventListener("scroll", close, true)
    return () => {
      document.removeEventListener("pointerdown", close)
      document.removeEventListener("scroll", close, true)
    }
  }, [open])

  function onClick(e: MouseEvent) {
    const el = textRef.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    e.preventDefault()
    e.stopPropagation()
    setOpen((v) => !v)
  }

  return (
    <span ref={wrapRef} className={cn("relative block min-w-0", className)} onClick={onClick}>
      <span ref={textRef} className="block truncate">
        {text}
      </span>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1.5 block w-max max-w-[240px] whitespace-normal rounded-md bg-foreground px-3 py-2 text-[12.5px] font-semibold leading-snug text-background shadow-card"
        >
          {text}
        </span>
      )}
    </span>
  )
}

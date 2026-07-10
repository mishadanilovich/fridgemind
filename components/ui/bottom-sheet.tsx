"use client"

import type { ReactNode } from "react"

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** Оранжевый надзаголовок над названием ("Изменить продукт" и т.п.). */
  eyebrow?: string
  description?: string
  children: ReactNode
}

/** Ручка-полоска нижнего шита — общая и для BottomSheet, и для кастомных шитов. */
export function SheetHandle() {
  return <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-tan-dashed" />
}

export function BottomSheet({ open, onOpenChange, title, eyebrow, description, children }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        hideClose
        aria-describedby={description ? undefined : ""}
        className="rounded-t-sheet border-0 bg-background px-5 pb-7 pt-3.5"
      >
        <SheetHandle />
        {eyebrow && (
          <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-accent">
            {eyebrow}
          </div>
        )}
        <SheetTitle className="mb-3.5 font-heading text-xl font-bold text-foreground">
          {title}
        </SheetTitle>
        {description && (
          <SheetDescription className="-mt-2 mb-3.5 text-[13px] font-medium">
            {description}
          </SheetDescription>
        )}
        {children}
      </SheetContent>
    </Sheet>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Sonner
      theme="system"
      className="toaster group"
      toastOptions={{
        style: {
          background: "hsl(var(--popover))",
          color: "hsl(var(--popover-foreground))",
          border: "1px solid hsl(var(--border))",
        },
        duration: 4000, // Auto-close after 4 seconds
        closeButton: true,
      }}
      {...props}
    />
  )
}

export { Toaster }

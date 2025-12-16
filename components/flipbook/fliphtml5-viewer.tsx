"use client"

import { useEffect, useRef } from "react"

interface FlipHTML5ViewerProps {
  bookId: string
  width?: string
  height?: string
}

export function FlipHTML5Viewer({ bookId, width = "100%", height = "600px" }: FlipHTML5ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load FlipHTML5 script dynamically
    const script = document.createElement("script")
    script.src = "https://online.fliphtml5.com/js/embed.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  return (
    <div className="w-full h-full flex items-center justify-center bg-background">
      <div
        ref={containerRef}
        className="fliphtml5-widget"
        style={{
          width,
          height,
          maxWidth: "100%",
        }}
      >
        <iframe
          src={`https://online.fliphtml5.com/widget/${bookId}`}
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          allow="autoplay"
          title="FlipHTML5 Viewer"
          style={{
            border: "none",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
        />
      </div>
    </div>
  )
}

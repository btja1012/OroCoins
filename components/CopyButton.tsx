'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
        copied
          ? 'bg-emerald-500/20 text-emerald-400'
          : 'bg-zinc-800 text-zinc-400 hover:text-amber-400 hover:bg-zinc-700'
      }`}
      title="Copiar"
    >
      {copied ? (
        <>
          <Check size={13} /> Copiado
        </>
      ) : (
        <>
          <Copy size={13} /> Copiar
        </>
      )}
    </button>
  )
}

import { useEffect, useRef, useState } from 'react'
import { loadCustomPortrait, subscribeCustomPortraits } from '../lib/customPortraits.ts'

const extensions = ['webp', 'png'] as const
const closePortraitNames = new Set(['芙宁娜', '纳西妲', '达达利亚'])

function portraitUrl(name: string, extension: (typeof extensions)[number]): string {
  const base = import.meta.env.BASE_URL
  return `${base}portraits/${encodeURIComponent(name)}.${extension}`
}

function PortraitImage({ name }: { name: string }) {
  const [customUrl, setCustomUrl] = useState<string | null>(null)
  const [extensionIndex, setExtensionIndex] = useState(0)
  const [loadedSrc, setLoadedSrc] = useState('')
  const customRef = useRef<string | null>(null)
  const extension = extensions[extensionIndex]
  const src = customUrl ?? (extension ? portraitUrl(name, extension) : '')

  useEffect(() => {
    let cancelled = false
    let generation = 0
    let objectUrl: string | null = null
    const load = () => {
      const ticket = ++generation
      void loadCustomPortrait(name)
        .then((blob) => {
          if (cancelled || ticket !== generation) return
          const nextUrl = blob ? URL.createObjectURL(blob) : null
          if (objectUrl && objectUrl !== nextUrl) URL.revokeObjectURL(objectUrl)
          objectUrl = nextUrl
          if (customRef.current === nextUrl) return
          customRef.current = nextUrl
          setCustomUrl(nextUrl)
          if (nextUrl) setExtensionIndex(0)
        })
        .catch(() => {})
    }
    load()
    const unsubscribe = subscribeCustomPortraits(load)
    return () => {
      cancelled = true
      unsubscribe()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [name])

  useEffect(() => {
    if (!src || customUrl) return
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    document.head.appendChild(link)
    return () => link.remove()
  }, [src, customUrl])

  if (!src) return null

  return (
    <img
      className={customUrl || !closePortraitNames.has(name) ? 'portrait' : 'portrait portrait-close'}
      src={src}
      alt=""
      decoding="async"
      fetchPriority="high"
      style={{ opacity: loadedSrc === src ? 1 : 0 }}
      onLoad={() => setLoadedSrc(src)}
      onError={() => {
        if (customUrl) return
        setExtensionIndex((current) => current + 1)
      }}
    />
  )
}

export function UpPortrait({ name }: { name: string }) {
  const trimmed = name.trim()
  if (!trimmed) return null
  return <PortraitImage key={trimmed} name={trimmed} />
}

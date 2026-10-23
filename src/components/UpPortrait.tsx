import { useEffect, useState } from 'react'

const extensions = ['webp', 'png'] as const
const closePortraitNames = new Set(['芙宁娜', '纳西妲', '达达利亚'])

function portraitUrl(name: string, extension: (typeof extensions)[number]): string {
  const base = import.meta.env.BASE_URL
  return `${base}portraits/${encodeURIComponent(name)}.${extension}`
}

function PortraitImage({ name }: { name: string }) {
  const [extensionIndex, setExtensionIndex] = useState(0)
  const [ready, setReady] = useState(false)
  const extension = extensions[extensionIndex]

  useEffect(() => {
    if (!extension) return
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = portraitUrl(name, extension)
    document.head.appendChild(link)
    return () => link.remove()
  }, [name, extension])

  if (!extension) return null

  return (
    <img
      className={closePortraitNames.has(name) ? 'portrait portrait-close' : 'portrait'}
      src={portraitUrl(name, extension)}
      alt=""
      decoding="async"
      fetchPriority="high"
      style={{ opacity: ready ? 1 : 0 }}
      onLoad={() => setReady(true)}
      onError={() => {
        setReady(false)
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

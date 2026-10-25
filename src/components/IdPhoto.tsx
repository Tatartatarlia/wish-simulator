import { useEffect, useRef, useState } from 'react'
import { loadCustomIdPhoto, subscribeCustomIdPhotos } from '../lib/customIdPhotos.ts'

const bundledExtensions = ['webp', 'png'] as const

function bundledUrl(name: string, extension: (typeof bundledExtensions)[number]): string {
  return `${import.meta.env.BASE_URL}id-photos/${encodeURIComponent(name)}.${extension}`
}

export function IdPhotoFace({ name, className = 'id-face' }: { name: string; className?: string }) {
  const trimmed = name.trim()
  const [customUrl, setCustomUrl] = useState<string | null>(null)
  const [customReady, setCustomReady] = useState(false)
  const [bundled, setBundled] = useState<string | null>(null)
  const customRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let generation = 0
    let objectUrl: string | null = null
    const load = () => {
      const ticket = ++generation
      void loadCustomIdPhoto(trimmed)
        .then((blob) => {
          if (cancelled || ticket !== generation) return
          const nextUrl = blob ? URL.createObjectURL(blob) : null
          if (objectUrl && objectUrl !== nextUrl) URL.revokeObjectURL(objectUrl)
          objectUrl = nextUrl
          if (customRef.current !== nextUrl) {
            customRef.current = nextUrl
            setCustomUrl(nextUrl)
          }
          setCustomReady(true)
        })
        .catch(() => {
          if (!cancelled && ticket === generation) setCustomReady(true)
        })
    }
    setCustomReady(false)
    load()
    const unsubscribe = subscribeCustomIdPhotos(load)
    return () => {
      cancelled = true
      unsubscribe()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [trimmed])

  useEffect(() => {
    if (!trimmed) {
      setBundled(null)
      return
    }
    let cancelled = false
    let index = 0
    const image = new Image()
    const tryNext = () => {
      const extension = bundledExtensions[index]
      if (!extension) {
        if (!cancelled) setBundled(null)
        return
      }
      image.src = bundledUrl(trimmed, extension)
    }
    image.onload = () => {
      if (!cancelled) setBundled(image.src)
    }
    image.onerror = () => {
      index += 1
      tryNext()
    }
    tryNext()
    return () => {
      cancelled = true
    }
  }, [trimmed])

  const src = customUrl ?? (customReady ? bundled : null)
  if (!src) return null
  return <img className={className} src={src} alt="" />
}

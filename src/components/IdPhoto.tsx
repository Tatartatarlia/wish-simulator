import { memo, useEffect, useState } from 'react'
import { loadCustomIdPhoto, subscribeCustomIdPhotos } from '../lib/customIdPhotos.ts'

const bundledExtensions = ['webp', 'png'] as const

type FaceCache = {
  customUrl: string | null
  customReady: boolean
  bundled: string | null
  bundledChecked: boolean
  blobSize: number
  blobType: string
}

const faceCache = new Map<string, FaceCache>()

function bundledUrl(name: string, extension: (typeof bundledExtensions)[number]): string {
  return `${import.meta.env.BASE_URL}id-photos/${encodeURIComponent(name)}.${extension}`
}

function cachedFace(name: string): FaceCache {
  return (
    faceCache.get(name) ?? {
      customUrl: null,
      customReady: false,
      bundled: null,
      bundledChecked: false,
      blobSize: -1,
      blobType: '',
    }
  )
}

function storeFace(name: string, patch: Partial<FaceCache>): FaceCache {
  const next = { ...cachedFace(name), ...patch }
  faceCache.set(name, next)
  return next
}

function IdPhotoFaceInner({ name, className = 'id-face' }: { name: string; className?: string }) {
  const trimmed = name.trim()
  const known = cachedFace(trimmed)
  const [customUrl, setCustomUrl] = useState<string | null>(known.customUrl)
  const [customReady, setCustomReady] = useState(known.customReady)
  const [bundled, setBundled] = useState<string | null>(known.bundled)

  useEffect(() => {
    let cancelled = false
    let generation = 0
    const load = () => {
      const ticket = ++generation
      void loadCustomIdPhoto(trimmed)
        .then((blob) => {
          if (cancelled || ticket !== generation) return
          const previous = cachedFace(trimmed)
          if (!blob) {
            if (previous.customUrl) URL.revokeObjectURL(previous.customUrl)
            storeFace(trimmed, { customUrl: null, customReady: true, blobSize: -1, blobType: '' })
            setCustomUrl(null)
            setCustomReady(true)
            return
          }
          if (previous.customUrl && previous.blobSize === blob.size && previous.blobType === blob.type) {
            storeFace(trimmed, { customReady: true })
            setCustomUrl(previous.customUrl)
            setCustomReady(true)
            return
          }
          const nextUrl = URL.createObjectURL(blob)
          if (previous.customUrl) URL.revokeObjectURL(previous.customUrl)
          storeFace(trimmed, { customUrl: nextUrl, customReady: true, blobSize: blob.size, blobType: blob.type })
          setCustomUrl(nextUrl)
          setCustomReady(true)
        })
        .catch(() => {
          if (cancelled || ticket !== generation) return
          storeFace(trimmed, { customReady: true })
          setCustomReady(true)
        })
    }
    const current = cachedFace(trimmed)
    if (current.customReady) {
      setCustomUrl(current.customUrl)
      setCustomReady(true)
    }
    load()
    const unsubscribe = subscribeCustomIdPhotos((changed) => {
      if (changed === trimmed) load()
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [trimmed])

  useEffect(() => {
    if (!trimmed) {
      setBundled(null)
      return
    }
    const current = cachedFace(trimmed)
    if (current.bundledChecked) {
      setBundled(current.bundled)
      return
    }
    let cancelled = false
    let index = 0
    const image = new Image()
    const tryNext = () => {
      const extension = bundledExtensions[index]
      if (!extension) {
        if (cancelled) return
        storeFace(trimmed, { bundled: null, bundledChecked: true })
        setBundled(null)
        return
      }
      image.src = bundledUrl(trimmed, extension)
    }
    image.onload = () => {
      if (cancelled) return
      storeFace(trimmed, { bundled: image.src, bundledChecked: true })
      setBundled(image.src)
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

export const IdPhotoFace = memo(IdPhotoFaceInner)

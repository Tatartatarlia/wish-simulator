import { useEffect, useState } from 'react'
import { deleteCustomIdPhoto, loadCustomIdPhoto, saveCustomIdPhoto, subscribeCustomIdPhotos } from '../lib/customIdPhotos.ts'
import { IdPhotoFace } from './IdPhoto.tsx'

const bundledExtensions = ['webp', 'png'] as const

function bundledUrl(name: string, extension: (typeof bundledExtensions)[number]): string {
  return `${import.meta.env.BASE_URL}id-photos/${encodeURIComponent(name)}.${extension}`
}

export function IdPhotoUpload({ name, rarity }: { name: string; rarity: 4 | 5 | null }) {
  const trimmed = name.trim()
  const [customUrl, setCustomUrl] = useState<string | null>(null)
  const [bundled, setBundled] = useState<string | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setCustomUrl(null)
    let cancelled = false
    let generation = 0
    let objectUrl: string | null = null
    const load = () => {
      const ticket = ++generation
      void loadCustomIdPhoto(trimmed).then((blob) => {
        if (cancelled || ticket !== generation) return
        if (objectUrl) URL.revokeObjectURL(objectUrl)
        objectUrl = blob ? URL.createObjectURL(blob) : null
        setCustomUrl(objectUrl)
      })
    }
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
    setBundled(undefined)
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

  const upload = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      await saveCustomIdPhoto(trimmed, file)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '上传失败')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    setError('')
    try {
      await deleteCustomIdPhoto(trimmed)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '删除失败')
    } finally {
      setBusy(false)
    }
  }

  const frameClass = rarity === 5 || rarity === 4 ? `id-photo rarity-${rarity}` : 'id-photo'

  return (
    <div className="portrait-upload id-photo-upload">
      <div className={frameClass}>{trimmed ? <IdPhotoFace name={trimmed} /> : <span>无证件照</span>}</div>
      <div className="portrait-upload-copy">
        <p className="fine">
          {trimmed
            ? customUrl
              ? `「${trimmed}」正在使用你上传的证件照。删掉后会回到自带证件照，自带的那张不会被删掉。`
              : bundled
                ? `「${trimmed}」正在使用自带证件照。自带证件照不能删除；上传后会优先显示你的图片。`
                : bundled === undefined
                  ? `正在查看「${trimmed}」的证件照。`
                  : `「${trimmed}」还没有自带证件照。可以上传一张，之后也能删掉这张上传的图片。`
            : '先选择角色，再上传证件照。'}
        </p>
        {trimmed && customUrl && rarity === null && (
          <p className="fine">「{trimmed}」还不在卡池里。之后用这个名字新增角色时，会直接使用这张证件照。</p>
        )}
        <div className="editor-actions">
          <label className={`text-btn solid ${!trimmed || busy ? 'is-disabled' : ''}`}>
            上传证件照
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
              disabled={!trimmed || busy}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                void upload(file)
              }}
            />
          </label>
          {customUrl && (
            <button type="button" className="text-btn" disabled={busy} onClick={() => void remove()}>
              删除上传的证件照
            </button>
          )}
        </div>
        {error && <p className="form-error">{error}</p>}
      </div>
    </div>
  )
}

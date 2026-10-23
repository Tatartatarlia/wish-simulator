import { useEffect, useState } from 'react'
import { deleteCustomPortrait, loadCustomPortrait, saveCustomPortrait, subscribeCustomPortraits } from '../lib/customPortraits.ts'

const bundledExtensions = ['webp', 'png'] as const

function bundledUrl(name: string, extension: (typeof bundledExtensions)[number]): string {
  return `${import.meta.env.BASE_URL}portraits/${encodeURIComponent(name)}.${extension}`
}

export function PortraitUpload({ name }: { name: string }) {
  const trimmed = name.trim()
  const [customUrl, setCustomUrl] = useState<string | null>(null)
  const [bundled, setBundled] = useState<string | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    let generation = 0
    let objectUrl: string | null = null
    const load = () => {
      const ticket = ++generation
      void loadCustomPortrait(trimmed).then((blob) => {
        if (cancelled || ticket !== generation) return
        if (objectUrl) URL.revokeObjectURL(objectUrl)
        objectUrl = blob ? URL.createObjectURL(blob) : null
        setCustomUrl(objectUrl)
      })
    }
    load()
    const unsubscribe = subscribeCustomPortraits(load)
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

  const preview = customUrl ?? bundled

  const upload = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      await saveCustomPortrait(trimmed, file)
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
      await deleteCustomPortrait(trimmed)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '删除失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="portrait-upload">
      <div className="portrait-preview-frame">
        {preview ? <img src={preview} alt="" /> : <span>无立绘</span>}
      </div>
      <div className="portrait-upload-copy">
        <p className="fine">
          {trimmed
            ? customUrl
              ? `「${trimmed}」正在使用你上传的立绘。删掉后会回到自带立绘，自带的那张不会被删掉。`
              : bundled
                ? `「${trimmed}」正在使用自带立绘。自带立绘不能删除；上传后会优先显示你的图片。`
                : bundled === undefined
                  ? `正在查看「${trimmed}」的立绘。`
                  : `「${trimmed}」还没有自带立绘。可以上传一张，之后也能删掉这张上传的图片。`
            : '先选择五星角色，再上传立绘。'}
        </p>
        <div className="editor-actions">
          <label className={`text-btn solid ${!trimmed || busy ? 'is-disabled' : ''}`}>
            上传立绘
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
              删除上传的立绘
            </button>
          )}
        </div>
        {error && <p className="form-error">{error}</p>}
      </div>
    </div>
  )
}

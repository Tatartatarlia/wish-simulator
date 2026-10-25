const databaseName = 'wish-simulator-id-photos'
const storeName = 'images'
const maxBytes = 20 * 1024 * 1024
const maxEdge = 512

const listeners = new Set<(name: string) => void>()

function notify(name: string): void {
  for (const listener of listeners) listener(name)
}

export function subscribeCustomIdPhotos(listener: (name: string) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

let opening: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
  if (opening) return opening
  opening = new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(storeName)) database.createObjectStore(storeName)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      opening = null
      reject(request.error ?? new Error('打不开证件照存储'))
    }
  })
  return opening
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('证件照存储失败'))
  })
}

export async function loadCustomIdPhoto(name: string): Promise<Blob | null> {
  const key = name.trim()
  if (!key) return null
  const database = await openDatabase()
  const result = await requestResult(database.transaction(storeName).objectStore(storeName).get(key))
  return result instanceof Blob ? result : null
}

async function shrinkIdPhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('请选择图片文件')
  if (file.size > maxBytes) throw new Error('图片太大，请换一张 20MB 以内的')
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / bitmap.width, maxEdge / bitmap.height)
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error('无法处理这张图片')
  }
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const webp = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9))
  if (webp) return webp
  const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (png) return png
  throw new Error('无法处理这张图片')
}

export async function saveCustomIdPhoto(name: string, file: File): Promise<void> {
  const key = name.trim()
  if (!key) throw new Error('先选择角色，再上传证件照')
  const blob = await shrinkIdPhoto(file)
  const database = await openDatabase()
  const store = database.transaction(storeName, 'readwrite').objectStore(storeName)
  await requestResult(store.put(blob, key))
  notify(key)
}

export async function deleteCustomIdPhoto(name: string): Promise<void> {
  const key = name.trim()
  if (!key) return
  const database = await openDatabase()
  const store = database.transaction(storeName, 'readwrite').objectStore(storeName)
  await requestResult(store.delete(key))
  notify(key)
}

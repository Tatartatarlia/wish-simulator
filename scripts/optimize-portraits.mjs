import { mkdir, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const extensions = new Set(['.png', '.jpg', '.jpeg', '.webp'])

async function optimizeFolder(sourceDir, outputDir, maxWidth, maxHeight, trimAlpha) {
  await mkdir(sourceDir, { recursive: true })
  await mkdir(outputDir, { recursive: true })
  const entries = await readdir(sourceDir)
  let written = 0

  for (const entry of entries) {
    const extension = path.extname(entry).toLowerCase()
    if (!extensions.has(extension)) continue
    const name = path.basename(entry, path.extname(entry)).trim()
    if (!name) continue

    const sourcePath = path.join(sourceDir, entry)
    const outputPath = path.join(outputDir, `${name}.webp`)
    const sourceStat = await stat(sourcePath)
    const outputStat = await stat(outputPath).catch(() => null)
    if (outputStat && outputStat.mtimeMs >= sourceStat.mtimeMs) continue

    const meta = await sharp(sourcePath).rotate().metadata()
    let pipeline = sharp(sourcePath).rotate()
    if (trimAlpha && meta.hasAlpha) pipeline = pipeline.trim({ threshold: 10 })
    await pipeline
      .resize({ width: maxWidth, height: maxHeight, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 72, effort: 5, alphaQuality: 75 })
      .toFile(outputPath)
    written += 1
  }

  return written
}

/** 立绘铺在卡池右侧，证件照显示在仓库方框里。小图不放大。 */
export async function optimizePortraits() {
  const portraits = await optimizeFolder(
    path.join(root, 'portraits-src'),
    path.join(root, 'public', 'portraits'),
    1280,
    860,
    true,
  )
  const photos = await optimizeFolder(
    path.join(root, 'id-photos-src'),
    path.join(root, 'public', 'id-photos'),
    384,
    384,
    false,
  )
  return portraits + photos
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const written = await optimizePortraits()
  console.log(written === 0 ? 'portraits up to date' : `optimized ${written} portrait(s)`)
}

import { mkdir, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = path.join(root, 'portraits-src')
const outputDir = path.join(root, 'public', 'portraits')
const extensions = new Set(['.png', '.jpg', '.jpeg', '.webp'])

/** 立绘在卡面上大约铺满右半边。限制长边，避免把小图放大，也把大幅原图压下来。 */
const maxWidth = 1280
const maxHeight = 860

export async function optimizePortraits() {
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
    if (meta.hasAlpha) pipeline = pipeline.trim({ threshold: 10 })
    await pipeline
      .resize({ width: maxWidth, height: maxHeight, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 72, effort: 5, alphaQuality: 75 })
      .toFile(outputPath)
    written += 1
  }

  return written
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const written = await optimizePortraits()
  console.log(written === 0 ? 'portraits up to date' : `optimized ${written} portrait(s)`)
}

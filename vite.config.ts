import { spawn } from 'node:child_process'
import { mkdirSync, watch } from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function runOptimize(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.resolve('scripts/optimize-portraits.mjs')], {
      stdio: 'inherit',
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`立绘压缩失败，退出码 ${code}`))
    })
  })
}

function portraitsPlugin(): Plugin {
  return {
    name: 'optimize-portraits',
    async buildStart() {
      await runOptimize()
    },
    configureServer(server) {
      const sourceDir = path.resolve('portraits-src')
      mkdirSync(sourceDir, { recursive: true })
      let timer: NodeJS.Timeout | undefined
      const watcher = watch(sourceDir, () => {
        clearTimeout(timer)
        timer = setTimeout(() => {
          void runOptimize()
            .then(() => server.ws.send({ type: 'full-reload' }))
            .catch((error: unknown) => {
              server.config.logger.error(error instanceof Error ? error.message : String(error))
            })
        }, 200)
      })
      server.httpServer?.on('close', () => watcher.close())
    },
  }
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/wish-simulator/' : '/',
  plugins: [portraitsPlugin(), react()],
}))

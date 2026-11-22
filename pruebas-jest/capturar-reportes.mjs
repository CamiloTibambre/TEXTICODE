// Renderiza los reportes de resultados reales de Jest con un navegador independiente.
// No dibuja ni simula una terminal. Las capturas se identifican como reporte HTML.
import { spawn } from 'node:child_process'
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const dir = path.resolve(import.meta.dirname, 'evidencias')
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9339', `--user-data-dir=${path.join(dir, 'perfil-render')}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
let ws
try {
  let targets
  for (let i = 0; i < 60; i++) {
    try { targets = await (await fetch('http://127.0.0.1:9339/json')).json(); break } catch { await new Promise(r => setTimeout(r, 500)) }
  }
  if (!targets) throw new Error('No se inició el navegador para capturar los reportes')
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
  let id = 0
  const pending = new Map()
  ws.onmessage = e => {
    const msg = JSON.parse(e.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id); pending.delete(msg.id)
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
    }
  }
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const key = ++id; pending.set(key, { resolve, reject }); ws.send(JSON.stringify({ id: key, method, params }))
  })
  await call('Page.enable')
  await call('Emulation.setDeviceMetricsOverride', { width: 1200, height: 1100, deviceScaleFactor: 1, mobile: false })
  for (const file of (await readdir(dir)).filter(f => /^RF-\d+-\d+\.html$/.test(f)).sort()) {
    await call('Page.navigate', { url: pathToFileURL(path.join(dir, file)).href })
    for (let i = 0; i < 40; i++) {
      const r = await call('Runtime.evaluate', { expression: 'document.readyState === "complete"' })
      if (r.result.value) break
      await new Promise(r => setTimeout(r, 100))
    }
    const layout = await call('Page.getLayoutMetrics')
    const height = Math.ceil(layout.cssContentSize.height)
    const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1200, height, scale: 1 } })
    await writeFile(path.join(dir, file.replace('.html', '.png')), Buffer.from(shot.data, 'base64'))
    process.stdout.write(`Captura ${file.replace('.html', '.png')}\n`)
  }
  // Cierra todas las ventanas del perfil temporal creado por este proceso.
  await Promise.race([call('Browser.close').catch(() => {}), new Promise(resolve => setTimeout(resolve, 1000))])
} finally {
  if (ws) ws.close()
  browser.kill()
  setTimeout(() => process.exit(0), 1000)
}

import puppeteer from 'puppeteer'
const BASE = 'http://localhost:3000'
const SHOTS = '/tmp/screenshots'

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 30000 })
await page.type('input[type="email"]', 'admin@agency.dev')
await page.type('input[type="password"]', 'admin1234!')
await page.click('button[type="submit"]')
await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})
await new Promise(r => setTimeout(r, 2000))

async function ensureDemoMode() {
  await page.evaluate(() => {
    localStorage.setItem('demo-mode', 'true')
    localStorage.setItem('theme-preference', 'light')
    document.documentElement.classList.remove('dark')
  })
}

async function shot(url, name, full = false) {
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle2', timeout: 30000 })
  // Re-set localStorage on each page (in case app cleared it) then reload
  await ensureDemoMode()
  await page.reload({ waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 3500))
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: full })
  console.log('✓', name)
}

// Prime the storage
await ensureDemoMode()

await shot('/projects/demo-proj-001/documents', '50-demo-documents')
await shot('/projects/demo-proj-001/documents/demo-doc-001', '51-demo-doc-detail')
await shot('/projects/demo-proj-001/source', '52-demo-source')
await shot('/projects/demo-proj-001/source/pr/48', '53-demo-pr', true)

await browser.close()
console.log('Done')

import puppeteer from 'puppeteer'

const BASE = 'http://localhost:3000'
const SHOTS_DIR = '/tmp/screenshots'

async function snap(page, name) {
  await new Promise((r) => setTimeout(r, 1500))
  await page.screenshot({ path: `${SHOTS_DIR}/${name}.png`, fullPage: false })
  console.log(`✓ ${name}`)
}

async function visit(page, url, name) {
  try {
    await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle2', timeout: 30000 })
  } catch {
    await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  }
  await snap(page, name)
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem('theme-preference', t)
    document.documentElement.classList.toggle('dark', t === 'dark')
  }, theme)
  await new Promise((r) => setTimeout(r, 500))
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 30000 })
  await page.type('input[type="email"]', 'admin@agency.dev')
  await page.type('input[type="password"]', 'admin1234!')
  await page.click('button[type="submit"]')
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  // Public pages
  await visit(page, '/login', '01-login')
  await visit(page, '/demo', '02-demo-index')
  await visit(page, '/demo/project-kickoff', '03-demo-player')
  await visit(page, '/portal/login', '04-portal-login')

  // Login
  await login(page)

  // Light mode screens
  await setTheme(page, 'light')
  await visit(page, '/dashboard', '10-dashboard-light')
  await visit(page, '/projects', '11-projects')
  await visit(page, '/messages', '12-messages')
  await visit(page, '/agents', '13-agents')
  await visit(page, '/crm', '14-crm')
  await visit(page, '/feedback', '15-feedback-global')
  await visit(page, '/admin/ops', '16-admin-ops')
  await visit(page, '/settings', '17-settings')
  await visit(page, '/settings/manual', '18-settings-manual')

  // Dark mode comparison
  await setTheme(page, 'dark')
  await visit(page, '/dashboard', '20-dashboard-dark')
  await visit(page, '/admin/ops', '21-admin-ops-dark')
  await visit(page, '/demo', '22-demo-dark')

  await browser.close()
  console.log(`\nDone — ${SHOTS_DIR}/`)
}

main().catch((e) => {
  console.error('ERROR:', e.message)
  process.exit(1)
})

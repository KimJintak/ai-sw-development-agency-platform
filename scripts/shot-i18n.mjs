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

async function setLocale(loc) {
  await page.evaluate((l) => {
    localStorage.setItem('app-locale', l)
    localStorage.setItem('demo-mode', 'true')
    localStorage.setItem('theme-preference', 'light')
  }, loc)
}

// ko
await setLocale('ko')
await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2', timeout: 30000 })
await setLocale('ko')
await page.reload({ waitUntil: 'networkidle2', timeout: 30000 })
await new Promise(r => setTimeout(r, 3000))
await page.screenshot({ path: `${SHOTS}/110-dashboard-ko.png`, fullPage: false })
console.log('✓ 110-dashboard-ko')

// en
await setLocale('en')
await page.reload({ waitUntil: 'networkidle2', timeout: 30000 })
await new Promise(r => setTimeout(r, 2000))
await page.screenshot({ path: `${SHOTS}/111-dashboard-en.png`, fullPage: false })
console.log('✓ 111-dashboard-en')

// vi
await setLocale('vi')
await page.reload({ waitUntil: 'networkidle2', timeout: 30000 })
await new Promise(r => setTimeout(r, 2000))
await page.screenshot({ path: `${SHOTS}/112-dashboard-vi.png`, fullPage: false })
console.log('✓ 112-dashboard-vi')

await browser.close()

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

await page.evaluate(() => {
  localStorage.setItem('demo-mode', 'true')
  localStorage.setItem('app-locale', 'ko')
  localStorage.setItem('theme-preference', 'light')
})

await page.goto(`${BASE}/projects/demo-proj-001/chat`, { waitUntil: 'networkidle2', timeout: 30000 })
await page.evaluate(() => localStorage.setItem('demo-mode', 'true'))
await page.reload({ waitUntil: 'networkidle2', timeout: 30000 })
await new Promise(r => setTimeout(r, 4000))

// Hover over the first USER message to reveal the Q&A capture button
await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll('.group'))
  if (rows.length > 1) {
    const ev = new MouseEvent('mouseenter', { bubbles: true })
    rows[1].dispatchEvent(ev)
  }
})
await new Promise(r => setTimeout(r, 1000))

// Click the Q&A capture button on first USER message
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button[title="이 메시지를 Q&A 질문으로 담기"]'))
  if (btns.length > 0) btns[0].click()
})
await new Promise(r => setTimeout(r, 2000))

await page.screenshot({ path: `${SHOTS}/120-qna-capture-modal.png`, fullPage: false })
console.log('✓ 120-qna-capture-modal')

await browser.close()

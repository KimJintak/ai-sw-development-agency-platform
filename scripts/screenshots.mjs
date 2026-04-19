import puppeteer from 'puppeteer'

const BASE = 'http://localhost:3000'
const SHOTS_DIR = '/tmp/screenshots'

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  // 1. Login page
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 30000 })
  await page.screenshot({ path: `${SHOTS_DIR}/01-login.png` })
  console.log('✓ 01-login')

  // 2. Login as admin
  await page.type('input[type="email"]', 'admin@agency.dev')
  await page.type('input[type="password"]', 'admin1234!')
  await page.click('button[type="submit"]')
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})
  await new Promise(r => setTimeout(r, 3000))
  await page.screenshot({ path: `${SHOTS_DIR}/02-dashboard.png` })
  console.log('✓ 02-dashboard')

  // 3. Projects
  await page.goto(`${BASE}/projects`, { waitUntil: 'networkidle2', timeout: 15000 })
  await new Promise(r => setTimeout(r, 2000))
  await page.screenshot({ path: `${SHOTS_DIR}/03-projects.png` })
  console.log('✓ 03-projects')

  // 4. Messages (inbox)
  await page.goto(`${BASE}/messages`, { waitUntil: 'networkidle2', timeout: 15000 })
  await new Promise(r => setTimeout(r, 2000))
  await page.screenshot({ path: `${SHOTS_DIR}/04-messages.png` })
  console.log('✓ 04-messages')

  // 5. Agents
  await page.goto(`${BASE}/agents`, { waitUntil: 'networkidle2', timeout: 15000 })
  await new Promise(r => setTimeout(r, 2000))
  await page.screenshot({ path: `${SHOTS_DIR}/05-agents.png` })
  console.log('✓ 05-agents')

  // 6. Admin Ops
  await page.goto(`${BASE}/admin/ops`, { waitUntil: 'networkidle2', timeout: 15000 })
  await new Promise(r => setTimeout(r, 2000))
  await page.screenshot({ path: `${SHOTS_DIR}/06-admin-ops.png` })
  console.log('✓ 06-admin-ops')

  // 7. Demo Tour index
  await page.goto(`${BASE}/demo`, { waitUntil: 'networkidle2', timeout: 15000 })
  await new Promise(r => setTimeout(r, 2000))
  await page.screenshot({ path: `${SHOTS_DIR}/07-demo-index.png` })
  console.log('✓ 07-demo-index')

  // 8. Demo scenario player
  await page.goto(`${BASE}/demo/project-kickoff`, { waitUntil: 'networkidle2', timeout: 15000 })
  await new Promise(r => setTimeout(r, 2000))
  await page.screenshot({ path: `${SHOTS_DIR}/08-demo-player.png` })
  console.log('✓ 08-demo-player')

  // 9. Demo - click play and wait
  const playBtn = await page.$('button')
  if (playBtn) {
    await playBtn.click()
    await new Promise(r => setTimeout(r, 8000))
    await page.screenshot({ path: `${SHOTS_DIR}/09-demo-playing.png` })
    console.log('✓ 09-demo-playing')
  }

  // 10. CRM
  await page.goto(`${BASE}/crm`, { waitUntil: 'networkidle2', timeout: 15000 })
  await new Promise(r => setTimeout(r, 2000))
  await page.screenshot({ path: `${SHOTS_DIR}/10-crm.png` })
  console.log('✓ 10-crm')

  // 11. Portal login (no login needed)
  await page.goto(`${BASE}/portal/login`, { waitUntil: 'networkidle2', timeout: 15000 })
  await new Promise(r => setTimeout(r, 2000))
  await page.screenshot({ path: `${SHOTS_DIR}/11-portal-login.png` })
  console.log('✓ 11-portal-login')

  await browser.close()
  console.log(`\nDone — screenshots saved to ${SHOTS_DIR}/`)
}

main().catch(console.error)

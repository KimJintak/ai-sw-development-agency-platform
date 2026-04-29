import puppeteer from 'puppeteer'

const BASE  = 'http://localhost:3000'
const OUT   = '/tmp/screenshots'
const EMAIL = 'admin@agency.dev'
const PASS  = 'admin1234!'
const PROJECT_ID = 'cmogksz4x0000pd1agjk0y6lu'

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

// 로그인
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 30000 })
await page.type('input[type="email"]', EMAIL)
await page.type('input[type="password"]', PASS)
await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(()=>{}),
  page.click('button[type="submit"]'),
])
await new Promise(r => setTimeout(r, 2000))

async function shot(url, filename) {
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle2', timeout: 20000 })
  await new Promise(r => setTimeout(r, 1500))
  await page.screenshot({ path: `${OUT}/${filename}`, fullPage: false })
  console.log(`✅ ${filename}`)
}

// 핵심 화면 캡처
await shot('/dashboard',                           'crm-01-dashboard.png')
await shot('/projects',                            'crm-02-projects.png')
await shot(`/projects/${PROJECT_ID}`,              'crm-03-project-detail.png')
await shot(`/projects/${PROJECT_ID}/wbs`,          'crm-04-wbs.png')
await shot(`/projects/${PROJECT_ID}/requirements`, 'crm-05-requirements.png')
await shot(`/projects/${PROJECT_ID}/links`,        'crm-06-links.png')

await browser.close()
console.log('완료')

import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

test.describe('Public Pages', () => {
  test('Home page loads with hero content', async ({ page, context }) => {
    await context.clearCookies()
    await page.goto(BASE)
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('text=Thrive').first()).toBeVisible({ timeout: 15000 })
    await page.screenshot({ path: 'e2e/screenshots/home.png', fullPage: true })
  })

  test('Coaching page loads and shows trainers or empty state', async ({ page }) => {
    await page.goto(`${BASE}/coaching`)
    await page.waitForTimeout(5000)
    await page.screenshot({ path: 'e2e/screenshots/coaching.png', fullPage: true })
    const hasCards = await page.locator('[class*="card"], [class*="trainer"], [class*="glass"]').count()
    const hasEmpty = await page.locator('text=No trainers').isVisible().catch(() => false)
    expect(hasCards > 0 || hasEmpty).toBe(true)
  })

  test('Exercises page loads with exercise cards or fallback', async ({ page }) => {
    await page.goto(`${BASE}/exercises`)
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'e2e/screenshots/exercises.png', fullPage: true })
    const hasPushUp = await page.locator('text=Push-Up').first().isVisible().catch(() => false)
    const hasSquat = await page.locator('text=Squat').first().isVisible().catch(() => false)
    expect(hasPushUp || hasSquat).toBe(true)
  })

  test('Nutrition page loads without infinite spinner', async ({ page }) => {
    await page.goto(`${BASE}/nutrition`)
    await page.waitForTimeout(8000)
    await page.screenshot({ path: 'e2e/screenshots/nutrition.png', fullPage: true })
    const hasSpinner = await page.locator('text=Loading your meal plan').isVisible().catch(() => false)
    expect(hasSpinner).toBe(false)
  })

  test('Subscription page shows pricing tiers', async ({ page }) => {
    await page.goto(`${BASE}/subscription`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'e2e/screenshots/subscription.png', fullPage: true })
    await expect(page.locator('text=Pro').first()).toBeVisible()
    await expect(page.locator('text=Basic').first()).toBeVisible()
  })

  test('Exercise check page loads', async ({ page }) => {
    await page.goto(`${BASE}/exercise-check`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'e2e/screenshots/exercise-check.png', fullPage: true })
    const hasChecker = await page.locator('text=AI Form Checker').isVisible().catch(() => false)
    const hasExercise = await page.locator('text=Exercise').first().isVisible().catch(() => false)
    expect(hasChecker || hasExercise).toBe(true)
  })
})

test.describe('Auth Flows', () => {
  const ts = Date.now()
  const email = `test${ts}@test.com`
  const password = 'TestPass123!'

  test('Login page loads correctly', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'e2e/screenshots/login.png' })
    await expect(page.locator('input[type="email"]').first()).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })

  test('Signup page loads correctly', async ({ page }) => {
    await page.goto(`${BASE}/signup`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'e2e/screenshots/signup.png' })
    await expect(page.locator('input[type="email"]').first()).toBeVisible()
  })

  test('Complete signup flow works', async ({ page }) => {
    await page.goto(`${BASE}/signup`)
    await page.waitForLoadState('networkidle')

    const nameInput = page.locator('input[name="fullName"], input[placeholder*="name" i]').first()
    if (await nameInput.isVisible()) await nameInput.fill('Test User')

    await page.locator('input[type="email"]').first().fill(email)
    await page.locator('input[type="password"]').first().fill(password)

    const confirm = page.locator('input[name="confirmPassword"], input[placeholder*="confirm" i]').first()
    if (await confirm.isVisible()) await confirm.fill(password)

    const terms = page.locator('input[type="checkbox"]').first()
    if (await terms.isVisible()) await terms.check()

    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/auth/register'), { timeout: 30000 }),
      page.locator('button[type="submit"]').first().click()
    ])

    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'e2e/screenshots/after-signup.png' })

    expect(response.status()).toBeLessThan(500)
    console.log('Signup response:', response.status())
  })

  test('Login with wrong password shows error', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.locator('input[type="email"]').first().fill('wrong@test.com')
    await page.locator('input[type="password"]').first().fill('wrongpassword')
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'e2e/screenshots/login-error.png' })
    expect(page.url()).toContain('/login')
  })
})

test.describe('Route Protection', () => {
  for (const route of ['/my-fitness', '/trainer-dashboard', '/admin', '/gym-owner', '/chat', '/settings']) {
    test(`${route} redirects unauthenticated users`, async ({ page }) => {
      await page.goto(BASE + route)
      await page.waitForTimeout(2000)
      const url = page.url()
      const redirected = url.includes('/login') || url === BASE + '/' || url === BASE
      if (!redirected) await page.screenshot({ path: `e2e/screenshots/FAIL-${route.replace('/', '')}.png` })
      expect(redirected).toBe(true)
    })
  }
})

test.describe('Navigation', () => {
  test('Navbar is present and links work', async ({ page, context }) => {
    await context.clearCookies()
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(BASE)
    await page.waitForLoadState('domcontentloaded')

    const coachingLink = page.locator('nav a[href="/coaching"]').first()
    await expect(coachingLink).toBeVisible()
    await Promise.all([
      page.waitForURL('**/coaching', { timeout: 10000 }),
      coachingLink.click(),
    ])
    expect(page.url()).toContain('/coaching')
  })

  test('AI chatbot button is visible', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')
    const chatBtn = page.locator('[aria-label="AI Fitness Coach"]')
    await expect(chatBtn).toBeVisible()
    await chatBtn.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'e2e/screenshots/ai-chatbot.png' })
    const chatWindow = page.locator('text=T.E.S.T. AI Coach')
    await expect(chatWindow).toBeVisible()
  })

  test('Mobile bottom nav shows on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'e2e/screenshots/mobile-home.png' })
  })
})

test.describe('API Routes', () => {
  test('Health endpoint responds', async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`)
    expect(res.status()).toBe(200)
  })

  test('Trainers endpoint responds', async ({ request }) => {
    const res = await request.get(`${BASE}/api/trainers`)
    expect(res.status()).toBeLessThan(500)
  })

  test('Auth/me returns 401 without cookie', async ({ request }) => {
    const res = await request.get(`${BASE}/api/auth/me`)
    expect(res.status()).toBe(401)
  })

  test('Protected routes return 401 without auth', async ({ request }) => {
    for (const path of ['/api/relationships', '/api/chat/conversations', '/api/admin/stats']) {
      const res = await request.get(`${BASE}${path}`)
      expect(res.status()).toBe(401)
    }
  })

  test('AI chat endpoint responds', async ({ request }) => {
    const res = await request.post(`${BASE}/api/ai/chat`, {
      data: { message: 'How many sets for squats?', history: [] }
    })
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data.reply).toBeTruthy()
  })
})

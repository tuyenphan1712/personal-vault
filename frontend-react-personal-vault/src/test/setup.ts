import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import i18n from '@/shared/i18n'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './msw/server'

// Tests assert on rendered copy, so pin the language deterministically instead of
// inheriting whatever `vi` default a fresh jsdom localStorage would otherwise pick.
void i18n.changeLanguage('en')

// `@testing-library/react`'s auto-cleanup only self-registers when it detects a global
// `afterEach` — this project runs Vitest without `globals: true`, so it's wired manually.
afterEach(() => cleanup())

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

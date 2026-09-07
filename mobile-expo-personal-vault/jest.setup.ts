import i18n from './src/shared/i18n'
import { server } from './src/shared/testing/msw/server'

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

beforeAll(async () => {
  server.listen({ onUnhandledRequest: 'error' })
  // Pin the shared i18next singleton to English so existing assertions against the
  // original hardcoded English copy (e.g. `getByText('Log in')`) keep passing once a
  // screen switches to `t()` — the `en` resources are 1:1 copies of those literals.
  await i18n.changeLanguage('en')
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

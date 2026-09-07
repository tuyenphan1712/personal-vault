const STORAGE_KEY = 'vault-language'

interface AsyncStorageLike {
  clear: () => Promise<void>
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
}

function requireAsyncStorage(): AsyncStorageLike {
  return require('@react-native-async-storage/async-storage')
}

// jest.resetModules() gives '../index' a fresh copy of the AsyncStorage mock module
// (separate internal store from any reference imported before the reset), so every
// test that needs to inspect storage must re-require AsyncStorage in the same pass.
function freshImport(): {
  i18next: typeof import('../index').default
  loadPersistedLanguage: typeof import('../index').loadPersistedLanguage
  setLanguage: typeof import('../index').setLanguage
  AsyncStorage: AsyncStorageLike
} {
  jest.resetModules()
  const mod = require('../index')
  return {
    i18next: mod.default,
    loadPersistedLanguage: mod.loadPersistedLanguage,
    setLanguage: mod.setLanguage,
    AsyncStorage: requireAsyncStorage(),
  }
}

beforeEach(async () => {
  await requireAsyncStorage().clear()
})

describe('i18n', () => {
  it('defaults to vi', () => {
    const { i18next } = freshImport()

    expect(i18next.language).toBe('vi')
  })

  it('translates a known key in vi', () => {
    const { i18next } = freshImport()

    expect(i18next.t('common:actions.save')).toBe('Lưu')
  })

  it('leaves vi in place when loadPersistedLanguage finds nothing stored', async () => {
    const { i18next, loadPersistedLanguage } = freshImport()

    await loadPersistedLanguage()

    expect(i18next.language).toBe('vi')
  })

  it('setLanguage switches language, persists it, and updates translations', async () => {
    const { i18next, setLanguage, AsyncStorage } = freshImport()

    await setLanguage('en')

    expect(i18next.language).toBe('en')
    expect(i18next.t('common:actions.save')).toBe('Save')
    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBe('en')
  })

  it('loadPersistedLanguage restores a previously persisted choice on a fresh call', async () => {
    const { i18next, loadPersistedLanguage, AsyncStorage } = freshImport()
    await AsyncStorage.setItem(STORAGE_KEY, 'en')

    await loadPersistedLanguage()

    expect(i18next.language).toBe('en')
  })
})

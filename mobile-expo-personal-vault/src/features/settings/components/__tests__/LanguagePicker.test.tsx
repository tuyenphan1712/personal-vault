import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import i18n from '@/src/shared/i18n'
import { LanguagePicker } from '../LanguagePicker'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('LanguagePicker', () => {
  it('shows the current language label', async () => {
    await renderWithProviders(<LanguagePicker />)

    expect(screen.getByText('English')).toBeTruthy()
  })

  it('opens a list of supported languages and switches language on selection', async () => {
    await renderWithProviders(<LanguagePicker />)

    fireEvent.press(screen.getByRole('button', { name: 'Display language' }))

    fireEvent.press(await screen.findByText('Vietnamese'))

    await waitFor(() => expect(i18n.language).toBe('vi'))
  })
})

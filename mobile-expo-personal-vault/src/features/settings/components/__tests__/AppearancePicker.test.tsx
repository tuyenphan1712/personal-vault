import { fireEvent, screen } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { useThemeStore } from '@/src/shared/theme/theme.store'
import { AppearancePicker } from '../AppearancePicker'

beforeEach(() => {
  useThemeStore.setState({ mode: 'system', hasHydrated: true })
})

describe('AppearancePicker', () => {
  it('renders one option per theme mode', async () => {
    await renderWithProviders(<AppearancePicker />)

    expect(screen.getByText('Light')).toBeTruthy()
    expect(screen.getByText('Dark')).toBeTruthy()
    expect(screen.getByText('System')).toBeTruthy()
  })

  it('marks the current mode as selected', async () => {
    useThemeStore.setState({ mode: 'dark', hasHydrated: true })
    await renderWithProviders(<AppearancePicker />)

    expect(screen.getByRole('button', { name: 'Dark' }).props.accessibilityState).toMatchObject({ selected: true })
    expect(screen.getByRole('button', { name: 'Light' }).props.accessibilityState).toMatchObject({ selected: false })
    expect(screen.getByRole('button', { name: 'System' }).props.accessibilityState).toMatchObject({ selected: false })
  })

  it('calls setMode with the pressed option', async () => {
    await renderWithProviders(<AppearancePicker />)

    fireEvent.press(screen.getByRole('button', { name: 'Dark' }))

    expect(useThemeStore.getState().mode).toBe('dark')
  })
})

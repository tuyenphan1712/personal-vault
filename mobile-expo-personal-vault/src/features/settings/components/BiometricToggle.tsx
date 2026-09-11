import { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/src/features/auth/stores/auth.store'
import { getBiometricAvailability, type BiometricAvailability } from '@/src/shared/lib/auth/biometricAdapter'
import { clearBiometricCredential, saveBiometricCredential } from '@/src/shared/lib/auth/biometricCredentialStore'
import { Button } from '@/src/shared/components/Button'
import { TextField } from '@/src/shared/components/TextField'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { useBiometricStore } from '../stores/biometric.store'

export function BiometricToggle() {
  const { colors, fonts, radii } = useTheme()
  const { t } = useTranslation('settings')
  const phone = useAuthStore((state) => state.user?.phone)
  const enabled = useBiometricStore((state) => state.enabled)
  const setEnabled = useBiometricStore((state) => state.setEnabled)

  const [availability, setAvailability] = useState<BiometricAvailability | 'checking'>('checking')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [password, setPassword] = useState('')

  useEffect(() => {
    let cancelled = false
    getBiometricAvailability().then((result) => {
      if (!cancelled) {
        setAvailability(result)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.surface,
          borderRadius: radii.md,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        rowLabel: {
          fontFamily: fonts.sans,
          fontSize: 14,
          color: colors.ink,
        },
        backdrop: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'flex-end',
        },
        sheet: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: radii.lg,
          borderTopRightRadius: radii.lg,
          padding: 20,
          gap: 14,
        },
        sheetTitle: {
          fontFamily: fonts.sansSemiBold,
          fontSize: 16,
          color: colors.ink,
        },
        actions: {
          flexDirection: 'row',
          gap: 10,
        },
        actionButton: {
          flex: 1,
        },
      }),
    [colors, fonts, radii],
  )

  function closeConfirm() {
    setIsConfirmOpen(false)
    setPassword('')
  }

  function handleValueChange(value: boolean) {
    if (value) {
      setIsConfirmOpen(true)
      return
    }
    clearBiometricCredential()
    setEnabled(false)
  }

  async function handleConfirm() {
    if (phone) {
      await saveBiometricCredential({ phone, password })
    }
    setEnabled(true)
    closeConfirm()
  }

  if (availability !== 'available') {
    return null
  }

  return (
    <>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{t('biometric.toggleLabel')}</Text>
        <Switch value={enabled} onValueChange={handleValueChange} />
      </View>

      <Modal visible={isConfirmOpen} transparent animationType="fade" onRequestClose={closeConfirm}>
        <Pressable style={styles.backdrop} onPress={closeConfirm}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('biometric.confirmModal.title')}</Text>
            <TextField
              label={t('biometric.confirmModal.passwordLabel')}
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
            <View style={styles.actions}>
              <Button
                variant="outline"
                label={t('biometric.confirmModal.cancel')}
                onPress={closeConfirm}
                style={styles.actionButton}
              />
              <Button label={t('biometric.confirmModal.confirm')} onPress={handleConfirm} style={styles.actionButton} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

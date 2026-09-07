import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/src/shared/theme/ThemeProvider'

interface BirthdayFieldProps {
  value: Date | null
  onChange: (date: Date) => void
  error?: string
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function BirthdayField({ value, onChange, error }: BirthdayFieldProps) {
  const { colors, fonts } = useTheme()
  const { t } = useTranslation('profile')
  const [showIosPicker, setShowIosPicker] = useState(false)

  function openPicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: value ?? new Date(),
        mode: 'date',
        maximumDate: new Date(),
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            onChange(selectedDate)
          }
        },
      })
    } else {
      setShowIosPicker(true)
    }
  }

  const styles = StyleSheet.create({
    label: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.mist,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 9,
      paddingHorizontal: 13,
      paddingVertical: 12,
    },
    inputError: {
      borderColor: colors.danger,
    },
    valueText: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: colors.ink,
    },
    placeholderText: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: colors.muted,
    },
    errorText: {
      fontFamily: fonts.sans,
      fontSize: 13,
      color: colors.danger,
    },
  })

  return (
    <View style={{ gap: 5, alignSelf: 'stretch' }}>
      <Text style={styles.label}>{t('birthdayFieldLabel')}</Text>
      <Pressable accessibilityRole="button" onPress={openPicker} style={[styles.input, error && styles.inputError]}>
        <Text style={value ? styles.valueText : styles.placeholderText}>
          {value ? formatDate(value) : t('birthdaySelect')}
        </Text>
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {Platform.OS === 'ios' && showIosPicker ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display="spinner"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              onChange(selectedDate)
            }
            setShowIosPicker(false)
          }}
        />
      ) : null}
    </View>
  )
}

export { formatDate as formatBirthday }

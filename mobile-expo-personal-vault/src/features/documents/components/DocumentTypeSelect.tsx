import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/src/shared/components/TextField'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { DOC_TYPE_CATEGORY_VALUES } from '../utils/documentValidation'

interface DocumentTypeSelectProps {
  value: string
  onChange: (value: string) => void
}

export function DocumentTypeSelect({ value, onChange }: DocumentTypeSelectProps) {
  const { colors, fonts, radii } = useTheme()
  const { t } = useTranslation('documents')
  const isMatchedCategory = DOC_TYPE_CATEGORY_VALUES.includes(value as (typeof DOC_TYPE_CATEGORY_VALUES)[number])
  const [isOther, setIsOther] = useState(Boolean(value) && !isMatchedCategory)

  const styles = useMemo(
    () =>
      StyleSheet.create({
    container: {
      gap: 8,
    },
    label: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.mist,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      borderRadius: radii.pill,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    chipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    chipText: {
      fontFamily: fonts.sans,
      fontSize: 12.5,
      color: colors.muted,
    },
    chipTextSelected: {
      fontFamily: fonts.sansSemiBold,
      color: colors.primaryDark,
    },
  }),
  [colors, fonts, radii],
  )

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('docType.label')}</Text>
      <View style={styles.chips}>
        {DOC_TYPE_CATEGORY_VALUES.map((categoryValue) => {
          const selected = !isOther && value === categoryValue
          return (
            <Pressable
              key={categoryValue}
              accessibilityRole="button"
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => {
                setIsOther(false)
                onChange(categoryValue)
              }}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {t(`docType.categories.${categoryValue}`)}
              </Text>
            </Pressable>
          )
        })}
        <Pressable
          accessibilityRole="button"
          style={[styles.chip, isOther && styles.chipSelected]}
          onPress={() => {
            setIsOther(true)
            onChange('')
          }}
        >
          <Text style={[styles.chipText, isOther && styles.chipTextSelected]}>{t('docType.other')}</Text>
        </Pressable>
      </View>

      {isOther ? (
        <TextField
          label={t('docType.customLabel')}
          placeholder={t('docType.customPlaceholder')}
          value={value}
          onChangeText={onChange}
        />
      ) : null}
    </View>
  )
}

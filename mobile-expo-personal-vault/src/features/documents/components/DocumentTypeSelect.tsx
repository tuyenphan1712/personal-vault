import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { TextField } from '@/src/shared/components/TextField'
import { colors, fonts, radii } from '@/src/shared/theme/tokens'
import { DOC_TYPE_CATEGORIES } from '../utils/documentValidation'

interface DocumentTypeSelectProps {
  value: string
  onChange: (value: string) => void
}

export function DocumentTypeSelect({ value, onChange }: DocumentTypeSelectProps) {
  const matchedCategory = DOC_TYPE_CATEGORIES.find((category) => category.value === value)
  const [isOther, setIsOther] = useState(Boolean(value) && !matchedCategory)

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Category (optional)</Text>
      <View style={styles.chips}>
        {DOC_TYPE_CATEGORIES.map((category) => {
          const selected = !isOther && value === category.value
          return (
            <Pressable
              key={category.value}
              accessibilityRole="button"
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => {
                setIsOther(false)
                onChange(category.value)
              }}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{category.label}</Text>
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
          <Text style={[styles.chipText, isOther && styles.chipTextSelected]}>Other</Text>
        </Pressable>
      </View>

      {isOther ? (
        <TextField
          label="Custom category"
          placeholder="e.g. Insurance"
          value={value}
          onChangeText={onChange}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
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
})

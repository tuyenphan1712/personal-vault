import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'
import { colors, fonts, radii } from '../theme/tokens'

type ButtonVariant = 'primary' | 'outline' | 'outlineDanger'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  isLoading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

export function Button({ label, onPress, variant = 'primary', isLoading = false, disabled = false, style }: ButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.base, variantStyles[variant], isDisabled && styles.disabled, style]}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.surface : colors.primaryDark} />
      ) : (
        <Text style={[styles.label, labelVariantStyles[variant]]}>{label}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.sm,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14.5,
  },
  disabled: {
    opacity: 0.6,
  },
})

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  outlineDanger: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.danger,
  },
})

const labelVariantStyles = StyleSheet.create({
  primary: {
    color: colors.surface,
  },
  outline: {
    color: colors.primaryDark,
  },
  outlineDanger: {
    color: colors.danger,
  },
})

import { Text, TextInput, View, type TextInputProps } from 'react-native'
import { colors, fonts } from '../theme/tokens'

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string
  error?: string
}

export function TextField({ label, error, ...inputProps }: TextFieldProps) {
  return (
    <View style={{ gap: 5, alignSelf: 'stretch' }}>
      <Text style={{ fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.mist }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.line,
          borderRadius: 9,
          paddingHorizontal: 13,
          paddingVertical: 11,
          fontSize: 14,
          fontFamily: fonts.sans,
          color: colors.ink,
        }}
        {...inputProps}
      />
      {error ? (
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.danger }}>{error}</Text>
      ) : null}
    </View>
  )
}

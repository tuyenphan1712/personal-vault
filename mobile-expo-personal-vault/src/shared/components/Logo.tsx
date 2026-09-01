import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg'
import { colors } from '../theme/tokens'

interface LogoProps {
  width?: number
  height?: number
  showWordmark?: boolean
}

// Ported 1:1 from the web client's shared/components/Logo.tsx so both clients show the same mark.
export function Logo({ width = 176, height = 32, showWordmark = true }: LogoProps) {
  if (!showWordmark) {
    return (
      <Svg width={height} height={height} viewBox="0 0 48 48" fill="none">
        <Circle cx={24} cy={24} r={19} stroke={colors.ink} strokeWidth={1.6} />
        <Circle cx={24} cy={24} r={13.5} stroke="#b08442" strokeWidth={1.1} strokeDasharray="1.4 3.2" strokeLinecap="round" />
        <Path d="M16.5 20.5 L24 28.5 L31.5 20.5" stroke={colors.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M24 28.5 V34" stroke="#b08442" strokeWidth={2.4} strokeLinecap="round" />
      </Svg>
    )
  }

  return (
    <Svg width={width} height={height} viewBox="0 0 260 48" fill="none">
      <Circle cx={24} cy={24} r={19} stroke={colors.ink} strokeWidth={1.6} />
      <Circle cx={24} cy={24} r={13.5} stroke="#b08442" strokeWidth={1.1} strokeDasharray="1.4 3.2" strokeLinecap="round" />
      <Path d="M16.5 20.5 L24 28.5 L31.5 20.5" stroke={colors.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M24 28.5 V34" stroke="#b08442" strokeWidth={2.4} strokeLinecap="round" />
      <SvgText x={56} y={26} fontFamily="Newsreader_400Regular" fontSize={23} fill={colors.ink} letterSpacing={-0.2}>
        Personal Vault
      </SvgText>
      <SvgText x={56.5} y={39} fontFamily="IBMPlexSans_500Medium" fontSize={8.5} letterSpacing={2.2} fill={colors.muted}>
        SEALED BEFORE IT LEAVES
      </SvgText>
    </Svg>
  )
}

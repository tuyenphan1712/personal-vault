import { describe, expect, it } from 'vitest'
import { getPasswordStrength } from './passwordStrength'

describe('getPasswordStrength', () => {
  it.each([
    ['', 'weak'],
    ['abc', 'weak'],
    ['alllowercase', 'weak'],
    ['abcdefghij1', 'medium'],
    ['abcdefgh1!', 'medium'],
    ['abcdefghij1!', 'strong'],
    ['abcdefghijklmnop1', 'strong'],
  ] as const)('classifies %j as %s', (password, expected) => {
    expect(getPasswordStrength(password)).toBe(expected)
  })
})

import { describe, it, expect } from 'vitest'
import { getTranslation, translations } from '../renderer/src/i18n'

describe('i18n Translations and Interpolation', () => {
  it('returns Persian translation by default or when requested', () => {
    const text = getTranslation('fa', 'appTitle')
    expect(text).toBe('برنامه رشد فردی و وظایف')
  })

  it('returns English translation when locale is en', () => {
    const text = getTranslation('en', 'appTitle')
    expect(text).toBe('Personal Growth & Agile Todo')
  })

  it('replaces placeholder parameters properly', () => {
    const textFa = getTranslation('fa', 'cycleRemainingDays', { days: 45 })
    expect(textFa).toBe('45 روز باقی‌مانده از دوره')

    const textEn = getTranslation('en', 'cycleRemainingDays', { days: 45 })
    expect(textEn).toBe('45 days remaining')
  })

  it('has matching translation keys across fa and en', () => {
    const faKeys = Object.keys(translations.fa).sort()
    const enKeys = Object.keys(translations.en).sort()
    expect(faKeys).toEqual(enKeys)
  })
})

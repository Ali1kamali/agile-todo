import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { SettingsSidebar } from '../renderer/src/components/SettingsSidebar'
import { I18nProvider } from '../renderer/src/i18n/I18nContext'
import { ThemeProvider } from '../renderer/src/theme/ThemeContext'

describe('SettingsSidebar Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ThemeProvider>
        <I18nProvider>
          <SettingsSidebar isOpen={false} onClose={() => {}} />
        </I18nProvider>
      </ThemeProvider>
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders settings options when isOpen is true', () => {
    render(
      <ThemeProvider>
        <I18nProvider>
          <SettingsSidebar isOpen={true} onClose={() => {}} />
        </I18nProvider>
      </ThemeProvider>
    )
    expect(screen.getByText('تنظیمات')).toBeInTheDocument()
    expect(screen.getByText('زبان برنامه')).toBeInTheDocument()
    expect(screen.getByText('حالت نمایش')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn()
    render(
      <ThemeProvider>
        <I18nProvider>
          <SettingsSidebar isOpen={true} onClose={handleClose} />
        </I18nProvider>
      </ThemeProvider>
    )

    const closeBtn = screen.getByRole('button', { name: '' })
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalled()
  })
})

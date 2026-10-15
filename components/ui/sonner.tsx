'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          fontSize: '13px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

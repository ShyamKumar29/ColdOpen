/**
 * Screenplay-inspired, monospace-first type system (CLAUDE.md Design
 * Direction). One family, weighted by size/letter-spacing rather than
 * mixing typefaces.
 */
export const fontFamily = {
  mono: "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
} as const

export const typeScale = {
  eyebrow: { fontSize: '0.6875rem', letterSpacing: '0.22em', lineHeight: '1.4' },
  label: { fontSize: '0.75rem', letterSpacing: '0.14em', lineHeight: '1.5' },
  body: { fontSize: '0.875rem', letterSpacing: '0.01em', lineHeight: '1.6' },
  slugline: { fontSize: '0.8125rem', letterSpacing: '0.08em', lineHeight: '1.5' },
  title: { fontSize: '1.5rem', letterSpacing: '0.06em', lineHeight: '1.3' },
} as const

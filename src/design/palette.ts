/**
 * Core color palette: near-black stage, warm amber/gold UI chrome
 * (CLAUDE.md Design Direction). The UI chrome stays constant regardless of
 * the active lighting preset — only the stage interior shifts, via
 * `lighting.ts`.
 */
export const palette = {
  background: {
    app: '#040302',
    stage: '#0a0806',
    panel: '#0d0a07',
  },
  amber: {
    bright: '#f5c98a',
    base: '#e3a458',
    dim: '#8a6a3a',
    faint: '#4a3822',
  },
  border: {
    subtle: 'rgba(227, 164, 88, 0.28)',
    faint: 'rgba(227, 164, 88, 0.14)',
    strong: 'rgba(227, 164, 88, 0.5)',
  },
  text: {
    heading: '#f5c98a',
    body: 'rgba(227, 164, 88, 0.75)',
    muted: 'rgba(227, 164, 88, 0.45)',
  },
  silhouette: {
    fill: '#020202',
    rim: 'rgba(245, 201, 138, 0.18)',
  },
} as const

import { heistLibrary } from './heist-library'

export { heistLibrary }

/** All hand-authored seed scripts, keyed by slug. */
export const seedScripts = {
  'heist-library': heistLibrary,
} as const

export type SeedScriptId = keyof typeof seedScripts

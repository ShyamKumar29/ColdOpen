import type { StateCreator } from 'zustand'
import type { CastMember, StageSlot } from '@engines/character'
import type { ColdOpenStore } from './types'

export interface CastSlice {
  roster: CastMember[]
  setRoster: (roster: CastMember[]) => void
  setSlot: (characterId: string, slot: StageSlot | null) => void
}

export const createCastSlice: StateCreator<ColdOpenStore, [], [], CastSlice> = (set) => ({
  roster: [],
  setRoster: (roster) => set({ roster }),
  setSlot: (characterId, slot) =>
    set((state) => ({
      roster: state.roster.map((member) =>
        member.character.id === characterId ? { ...member, slot } : member,
      ),
    })),
})

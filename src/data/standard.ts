import { FOUR_STAR_CHARACTERS, FOUR_STAR_WEAPONS, STARTER_NAMES, STANDARD_FIVE_STARS, THREE_STAR_WEAPONS } from './banner.ts'
import { STANDARD_FIVE_WEAPONS } from './weapons.ts'
import type { StandardPool } from '../lib/types.ts'

export const STANDARD_EVENT_NAME = '奔行世间'

export const STANDARD_SHOWCASE = [
  { name: '莫娜', title: '星天水镜', element: '水' },
  { name: '刻晴', title: '霆霓快雨', element: '雷' },
  { name: '七七', title: '冻冻回魂夜', element: '冰' },
] as const

function unique(names: readonly string[], removed: readonly string[]): string[] {
  const skip = new Set(removed)
  const seen = new Set<string>()
  const result: string[] = []
  for (const name of names) {
    const trimmed = name.trim()
    if (!trimmed || skip.has(trimmed) || seen.has(trimmed)) continue
    seen.add(trimmed)
    result.push(trimmed)
  }
  return result
}

export function buildStandardPool(removedCharacters: readonly string[], removedWeapons: readonly string[], fourCharacterNames: readonly string[]): StandardPool {
  return {
    fiveCharacters: unique(STANDARD_FIVE_STARS, removedCharacters),
    fiveWeapons: unique(STANDARD_FIVE_WEAPONS, removedWeapons),
    fourCharacters: unique([...FOUR_STAR_CHARACTERS, ...STARTER_NAMES, ...fourCharacterNames], removedCharacters),
    fourWeapons: unique(FOUR_STAR_WEAPONS, removedWeapons),
    threeWeapons: unique(THREE_STAR_WEAPONS, removedWeapons),
  }
}

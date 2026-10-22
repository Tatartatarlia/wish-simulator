import { FOUR_STAR_WEAPONS, THREE_STAR_WEAPONS } from './banner.ts'
import type { ResolvedWeaponPool, RosterEdits, WeaponPoolConfig } from '../lib/types.ts'

/** 常驻五星武器，只在武器池歪掉时出现。 */
export const STANDARD_FIVE_WEAPONS: readonly string[] = [
  '风鹰剑',
  '天空之刃',
  '狼的末路',
  '天空之傲',
  '和璞鸢',
  '天空之脊',
  '四风原典',
  '天空之卷',
  '阿莫斯之弓',
  '天空之翼',
]

/** 限定五星只在被选为 UP 时出现，不会进入常驻歪池。 */
export const LIMITED_FIVE_WEAPONS: readonly string[] = ['苍耀', '香韵奏者']

/** 限定四星同样只在被选为 UP 时出现。 */
export const LIMITED_FOUR_WEAPONS: readonly string[] = ['弥坚骨']

export const WEAPON_TYPES: Readonly<Record<string, string>> = {
  苍耀: '单手剑',
  香韵奏者: '长柄武器',
  弥坚骨: '单手剑',
  祭礼大剑: '双手剑',
  西风长枪: '长柄武器',
  流浪乐章: '法器',
  祭礼弓: '弓',
}

export const defaultWeaponPool: WeaponPoolConfig = {
  eventName: '神铸赋形',
  upFives: ['苍耀', '香韵奏者'],
  upFours: ['弥坚骨', '祭礼大剑', '西风长枪', '流浪乐章', '祭礼弓'],
  charted: null,
}

export function emptyRosterEdits(): RosterEdits {
  return { removedCharacters: [], removedWeapons: [], addedWeapons: [] }
}

function unique(names: readonly string[], removed: readonly string[]): string[] {
  const skip = new Set(removed)
  const result: string[] = []
  for (const name of names) {
    const trimmed = name.trim()
    if (!trimmed || skip.has(trimmed) || result.includes(trimmed)) continue
    result.push(trimmed)
  }
  return result
}

export function fiveStarWeapons(edits: RosterEdits): string[] {
  const added = edits.addedWeapons.filter((item) => item.rarity === 5).map((item) => item.name)
  return unique([...STANDARD_FIVE_WEAPONS, ...LIMITED_FIVE_WEAPONS, ...added], edits.removedWeapons)
}

export function fourStarWeapons(edits: RosterEdits): string[] {
  const added = edits.addedWeapons.filter((item) => item.rarity === 4).map((item) => item.name)
  return unique([...FOUR_STAR_WEAPONS, ...LIMITED_FOUR_WEAPONS, ...added], edits.removedWeapons)
}

export function threeStarWeapons(edits: RosterEdits): string[] {
  const added = edits.addedWeapons.filter((item) => item.rarity === 3).map((item) => item.name)
  return unique([...THREE_STAR_WEAPONS, ...added], edits.removedWeapons)
}

export function weaponRarityOf(name: string, edits: RosterEdits): 3 | 4 | 5 | null {
  const trimmed = name.trim()
  if (!trimmed || edits.removedWeapons.includes(trimmed)) return null
  if (fiveStarWeapons(edits).includes(trimmed)) return 5
  if (fourStarWeapons(edits).includes(trimmed)) return 4
  if (threeStarWeapons(edits).includes(trimmed)) return 3
  return null
}

export function buildWeaponPool(
  config: WeaponPoolConfig,
  edits: RosterEdits,
  fourCharacters: readonly string[],
): ResolvedWeaponPool {
  const upFives: [string, string] = [config.upFives[0].trim() || defaultWeaponPool.upFives[0], config.upFives[1].trim() || defaultWeaponPool.upFives[1]]
  const upFours = config.upFours.map((name, index) => name.trim() || defaultWeaponPool.upFours[index])
  const upFiveSet = new Set(upFives)
  const upFourSet = new Set(upFours)
  const limitedFour = new Set(LIMITED_FOUR_WEAPONS)
  const limitedFive = new Set(LIMITED_FIVE_WEAPONS)
  const standardFives = fiveStarWeapons(edits).filter((name) => !upFiveSet.has(name) && !limitedFive.has(name))
  const offBannerWeapons = fourStarWeapons(edits).filter((name) => !upFourSet.has(name) && !limitedFour.has(name))
  const charted = config.charted && upFives.includes(config.charted) ? config.charted : null

  return {
    upFives,
    upFours,
    standardFives: standardFives.length > 0 ? standardFives : ['风鹰剑'],
    offBannerWeapons,
    fourCharacters,
    threeWeapons: threeStarWeapons(edits),
    charted,
  }
}

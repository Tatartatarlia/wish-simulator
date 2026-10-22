import { grantCharacter, grantWeapon } from './gacha.ts'
import type { FiveKind, FiveStarRecord, PullResult, ResolvedWeaponPool, WeaponWishState, WishState } from './types.ts'

export const FATE_MAX = 1

export function createWeaponState(): WeaponWishState {
  return {
    totalPulls: 0,
    fivePity: 0,
    fourPity: 0,
    fiveGuaranteed: false,
    fourGuaranteed: false,
    fatePoints: 0,
    records: [],
    nextRecordId: 1,
  }
}

/** 1–62 抽 0.700%，第 63 抽起每抽 +7%，最迟第 80 抽必出。综合约 1.850%。 */
export function weaponFiveProbability(pullIndex: number): number {
  if (pullIndex >= 80) return 1
  if (pullIndex <= 62) return 0.007
  return Math.min(1, 0.007 + 0.07 * (pullIndex - 62))
}

/** 1–8 抽 6.000%，第 9 抽提升，第 10 抽与五星一起铺满。综合约 14.5%。 */
export function weaponFourProbability(pullIndex: number): number {
  if (pullIndex >= 10) return 1
  if (pullIndex <= 8) return 0.06
  if (pullIndex === 9) return 0.6
  return 0.06
}

export function describeWeaponFive(state: WeaponWishState, charted: string | null): string {
  if (charted && state.fatePoints >= FATE_MAX) return `定轨必定 · ${charted}`
  if (state.fiveGuaranteed) return charted ? `大保底 · 命定 ${state.fatePoints}/${FATE_MAX}` : '大保底'
  if (charted) return `75/25 · 命定 ${state.fatePoints}/${FATE_MAX}`
  return '75/25'
}

function pick(list: readonly string[], rng: () => number): string {
  if (list.length === 0) return '未知'
  const index = Math.min(list.length - 1, Math.floor(rng() * list.length))
  return list[index] ?? list[0]
}

function recordFive(
  state: WeaponWishState,
  totalPulls: number,
  pity: number,
  name: string,
  fiveKind: FiveKind,
  fiveGuaranteed: boolean,
  fatePoints: number,
): { state: WeaponWishState; result: PullResult } {
  const record: FiveStarRecord = { id: state.nextRecordId, name, pity, totalPulls, fiveKind }
  return {
    state: {
      ...state,
      totalPulls,
      fivePity: 0,
      fourPity: 0,
      fiveGuaranteed,
      fatePoints,
      records: [...state.records, record],
      nextRecordId: state.nextRecordId + 1,
    },
    result: {
      rarity: 5,
      name,
      itemType: 'weapon',
      featured: fiveKind !== 'lost',
      fiveKind,
      pity,
      totalPulls,
    },
  }
}

function resolveFive(
  state: WeaponWishState,
  pool: ResolvedWeaponPool,
  totalPulls: number,
  pity: number,
  rng: () => number,
): { state: WeaponWishState; result: PullResult } {
  const charted = pool.charted
  if (charted && state.fatePoints >= FATE_MAX) {
    return recordFive(state, totalPulls, pity, charted, 'charted', false, 0)
  }

  let name: string
  let fiveGuaranteed: boolean
  const wonUp = state.fiveGuaranteed || rng() < 0.75
  if (wonUp) {
    name = pick(pool.upFives, rng)
    fiveGuaranteed = false
  } else {
    name = pick(pool.standardFives, rng)
    fiveGuaranteed = true
  }

  let fiveKind: FiveKind
  let fatePoints = state.fatePoints
  if (charted) {
    if (name === charted) {
      fiveKind = 'charted'
      fatePoints = 0
      fiveGuaranteed = false
    } else {
      fiveKind = 'lost'
      fatePoints = Math.min(FATE_MAX, fatePoints + 1)
    }
  } else {
    fiveKind = wonUp ? (state.fiveGuaranteed ? 'guaranteed' : 'up') : 'lost'
  }
  return recordFive(state, totalPulls, pity, name, fiveKind, fiveGuaranteed, fatePoints)
}

function resolveFour(
  state: WeaponWishState,
  pool: ResolvedWeaponPool,
  totalPulls: number,
  fivePity: number,
  rng: () => number,
): { state: WeaponWishState; result: PullResult } {
  const won = state.fourGuaranteed || rng() < 0.75 || (pool.fourCharacters.length === 0 && pool.offBannerWeapons.length === 0)
  if (won) {
    return {
      state: { ...state, totalPulls, fivePity, fourPity: 0, fourGuaranteed: false },
      result: { rarity: 4, name: pick(pool.upFours, rng), itemType: 'weapon', featured: true, totalPulls },
    }
  }
  const character = pool.offBannerWeapons.length === 0 || (pool.fourCharacters.length > 0 && rng() < 0.5)
  return {
    state: { ...state, totalPulls, fivePity, fourPity: 0, fourGuaranteed: true },
    result: {
      rarity: 4,
      name: character ? pick(pool.fourCharacters, rng) : pick(pool.offBannerWeapons, rng),
      itemType: character ? 'character' : 'weapon',
      featured: false,
      totalPulls,
    },
  }
}

export function pullWeaponOnce(
  weaponState: WeaponWishState,
  characterState: WishState,
  pool: ResolvedWeaponPool,
  rng: () => number = Math.random,
): { weaponState: WeaponWishState; characterState: WishState; result: PullResult } {
  const totalPulls = weaponState.totalPulls + 1
  const fiveIndex = weaponState.fivePity + 1
  const fourIndex = weaponState.fourPity + 1
  const p5 = weaponFiveProbability(fiveIndex)
  const p4 = Math.min(weaponFourProbability(fourIndex), 1 - p5)
  const roll = rng()

  const drawn =
    roll < p5
      ? resolveFive(weaponState, pool, totalPulls, fiveIndex, rng)
      : roll < p5 + p4
        ? resolveFour(weaponState, pool, totalPulls, fiveIndex, rng)
        : {
            state: { ...weaponState, totalPulls, fivePity: fiveIndex, fourPity: fourIndex },
            result: {
              rarity: 3 as const,
              name: pick(pool.threeWeapons, rng),
              itemType: 'weapon' as const,
              featured: false,
              totalPulls,
            },
          }

  if (drawn.result.itemType !== 'character') {
    return { weaponState: drawn.state, characterState: grantWeapon(characterState, drawn.result), result: drawn.result }
  }
  const granted = grantCharacter(characterState, drawn.result)
  return { weaponState: drawn.state, characterState: granted.state, result: granted.result }
}

export function pullWeaponMany(
  weaponState: WeaponWishState,
  characterState: WishState,
  count: number,
  pool: ResolvedWeaponPool,
  rng: () => number = Math.random,
): { weaponState: WeaponWishState; characterState: WishState; results: PullResult[] } {
  let weapons = weaponState
  let characters = characterState
  const results: PullResult[] = []
  for (let index = 0; index < count; index += 1) {
    const step = pullWeaponOnce(weapons, characters, pool, rng)
    weapons = step.weaponState
    characters = step.characterState
    results.push(step.result)
  }
  return { weaponState: weapons, characterState: characters, results }
}

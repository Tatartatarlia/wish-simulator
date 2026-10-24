import type {
  FiveKind,
  FiveStarRecord,
  MeteorTone,
  OwnedCharacter,
  OwnedWeapon,
  PullResult,
  ResolvedPool,
  WishState,
} from './types.ts'

/** 捕获明光基础概率 0.018%，相对五星基础概率 0.600%。 */
export const RADIANCE_ON_FIVE = 0.00018 / 0.006

export function createWishState(): WishState {
  return {
    totalPulls: 0,
    fivePity: 0,
    fourPity: 0,
    fiveGuaranteed: false,
    fourGuaranteed: false,
    radianceStreak: 0,
    records: [],
    nextRecordId: 1,
    owned: [],
    ownedWeapons: [],
    masterless: 0,
  }
}

export const REFINEMENT_CAP = 5

/** 把数按精炼上限拆开：2 把是精2，7 把是精5 和精2。 */
export function refinementStacks(copies: number): number[] {
  const stacks: number[] = []
  let remaining = Math.max(0, Math.floor(copies))
  while (remaining > REFINEMENT_CAP) {
    stacks.push(REFINEMENT_CAP)
    remaining -= REFINEMENT_CAP
  }
  if (remaining > 0) stacks.push(remaining)
  return stacks
}

export function grantWeapon(state: WishState, result: PullResult): WishState {
  if (result.itemType !== 'weapon') return state
  const current = state.ownedWeapons.find((item) => item.name === result.name)
  let ownedWeapons: OwnedWeapon[]
  if (!current) {
    ownedWeapons = [...state.ownedWeapons, { name: result.name, rarity: result.rarity, copies: 1 }]
  } else {
    ownedWeapons = state.ownedWeapons.map((item) => (item.name === result.name ? { ...item, copies: item.copies + 1 } : item))
  }
  return { ...state, ownedWeapons }
}

const CONSTELLATION_CAP = 6

export function grantCharacter(state: WishState, result: PullResult, stampRecord = true): { state: WishState; result: PullResult } {
  if (result.itemType !== 'character' || result.rarity === 3) return { state, result }
  const rarity = result.rarity

  const current = state.owned.find((item) => item.name === result.name)
  let constellation = 0
  let gainedMasterless = false
  let owned: OwnedCharacter[]
  let masterless = state.masterless

  if (!current) {
    owned = [...state.owned, { name: result.name, rarity, constellation: 0 }]
  } else if (current.constellation < CONSTELLATION_CAP) {
    constellation = current.constellation + 1
    owned = state.owned.map((item) => (item.name === result.name ? { ...item, constellation } : item))
  } else {
    constellation = CONSTELLATION_CAP
    owned = state.owned
    if (result.rarity === 5) {
      gainedMasterless = true
      masterless += 1
    }
  }

  const records =
    stampRecord && result.rarity === 5
      ? state.records.map((record, index) =>
          index === state.records.length - 1 ? { ...record, constellation, masterless: gainedMasterless } : record,
        )
      : state.records

  return {
    state: { ...state, owned, masterless, records },
    result: { ...result, constellation, masterless: gainedMasterless },
  }
}

/**
 * 五星概率。pullIndex 为本次是该保底周期的第几抽（从 1 开始）。
 * 1–73 抽 0.600%，第 74 抽起每抽 +6%，第 90 抽必出。综合约 1.600%。
 */
export function fiveStarProbability(pullIndex: number): number {
  if (pullIndex >= 90) return 1
  if (pullIndex <= 73) return 0.006
  return 0.006 + 0.06 * (pullIndex - 73)
}

/**
 * 四星概率。1–8 抽 5.100%，第 9 抽 56.1%，第 10 抽与五星一起铺满 100%。
 * 五星优先于四星时，长期四星率约 12.3%，贴近公示的 13%。
 */
export function fourStarProbability(pullIndex: number): number {
  if (pullIndex >= 10) return 1
  if (pullIndex <= 8) return 0.051
  if (pullIndex === 9) return 0.561
  return 0.051
}

export function fiveKindLabel(kind: FiveKind): string {
  switch (kind) {
    case 'up':
      return 'UP'
    case 'guaranteed':
      return '大保底'
    case 'radiance':
      return '捕获明光'
    case 'lost':
      return '歪'
    case 'charted':
      return '定轨'
  }
}

export function meteorTone(result: PullResult): MeteorTone {
  if (result.fiveKind === 'radiance') return 'rainbow'
  if (result.rarity === 5) return 'gold'
  if (result.rarity === 4) return 'purple'
  return 'blue'
}

export function describeNextFive(state: WishState): string {
  if (state.fiveGuaranteed && state.radianceStreak >= 3) return '大保底 · 之后必定捕获明光'
  if (state.fiveGuaranteed) return '大保底'
  if (state.radianceStreak >= 3) return '必定捕获明光'
  if (state.radianceStreak > 0) return `50/50 · 已连歪 ${state.radianceStreak}/3`
  return '50/50'
}

function pick(list: readonly string[], rng: () => number): string {
  if (list.length === 0) return '未知'
  const index = Math.min(list.length - 1, Math.floor(rng() * list.length))
  return list[index] ?? list[0]
}

function recordFive(
  state: WishState,
  totalPulls: number,
  pity: number,
  name: string,
  fiveKind: FiveKind,
  fiveGuaranteed: boolean,
  radianceStreak: number,
): { state: WishState; result: PullResult } {
  const record: FiveStarRecord = {
    id: state.nextRecordId,
    name,
    pity,
    totalPulls,
    fiveKind,
  }
  return {
    state: {
      ...state,
      totalPulls,
      fivePity: 0,
      fourPity: 0,
      fiveGuaranteed,
      radianceStreak,
      records: [...state.records, record],
      nextRecordId: state.nextRecordId + 1,
    },
    result: {
      rarity: 5,
      name,
      itemType: 'character',
      featured: fiveKind !== 'lost',
      fiveKind,
      pity,
      totalPulls,
    },
  }
}

function resolveFive(
  state: WishState,
  pool: ResolvedPool,
  totalPulls: number,
  pity: number,
  rng: () => number,
): { state: WishState; result: PullResult } {
  if (state.fiveGuaranteed) {
    return recordFive(state, totalPulls, pity, pool.upFiveName, 'guaranteed', false, state.radianceStreak)
  }

  const radiance = state.radianceStreak >= 3 || rng() < RADIANCE_ON_FIVE
  if (radiance) {
    return recordFive(state, totalPulls, pity, pool.upFiveName, 'radiance', false, 0)
  }

  if (rng() < 0.5) {
    return recordFive(state, totalPulls, pity, pool.upFiveName, 'up', false, 0)
  }

  return recordFive(state, totalPulls, pity, pick(pool.standardFives, rng), 'lost', true, state.radianceStreak + 1)
}

function resolveFour(
  state: WishState,
  pool: ResolvedPool,
  totalPulls: number,
  fivePity: number,
  rng: () => number,
): { state: WishState; result: PullResult } {
  const won = state.fourGuaranteed || rng() < 0.5
  if (won) {
    return {
      state: {
        ...state,
        totalPulls,
        fivePity,
        fourPity: 0,
        fourGuaranteed: false,
      },
      result: {
        rarity: 4,
        name: pick(pool.upFourNames, rng),
        itemType: 'character',
        featured: true,
        totalPulls,
      },
    }
  }

  const weapon = rng() < 0.5
  return {
    state: {
      ...state,
      totalPulls,
      fivePity,
      fourPity: 0,
      fourGuaranteed: true,
    },
    result: {
      rarity: 4,
      name: weapon ? pick(pool.fourWeapons, rng) : pick(pool.offBannerFours, rng),
      itemType: weapon ? 'weapon' : 'character',
      featured: false,
      totalPulls,
    },
  }
}

export function pullOnce(
  state: WishState,
  pool: ResolvedPool,
  rng: () => number = Math.random,
): { state: WishState; result: PullResult } {
  const totalPulls = state.totalPulls + 1
  const fiveIndex = state.fivePity + 1
  const fourIndex = state.fourPity + 1
  const p5 = fiveStarProbability(fiveIndex)
  const p4 = Math.min(fourStarProbability(fourIndex), 1 - p5)
  const roll = rng()

  const drawn =
    roll < p5
      ? resolveFive(state, pool, totalPulls, fiveIndex, rng)
      : roll < p5 + p4
        ? resolveFour(state, pool, totalPulls, fiveIndex, rng)
        : {
            state: {
              ...state,
              totalPulls,
              fivePity: fiveIndex,
              fourPity: fourIndex,
            },
            result: {
              rarity: 3 as const,
              name: pick(pool.threeWeapons, rng),
              itemType: 'weapon' as const,
              featured: false,
              totalPulls,
            },
          }

  const granted = grantCharacter(drawn.state, drawn.result)
  if (granted.result.itemType !== 'weapon') return granted
  return { state: grantWeapon(granted.state, granted.result), result: granted.result }
}

export function pullMany(
  state: WishState,
  count: number,
  pool: ResolvedPool,
  rng: () => number = Math.random,
): { state: WishState; results: PullResult[] } {
  let current = state
  const results: PullResult[] = []
  for (let i = 0; i < count; i += 1) {
    const step = pullOnce(current, pool, rng)
    current = step.state
    results.push(step.result)
  }
  return { state: current, results }
}

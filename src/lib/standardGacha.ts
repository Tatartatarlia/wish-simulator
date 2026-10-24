import { STARTER_NAMES } from '../data/banner.ts'
import type { PullResult, StandardPool, StandardRecord, StandardWishState, StarterRecord, WishState } from './types.ts'
import { fourStarProbability, fiveStarProbability, grantCharacter, grantWeapon } from './gacha.ts'

const starters = new Set<string>(STARTER_NAMES)

export function createStandardState(): StandardWishState {
  return {
    totalPulls: 0,
    fivePity: 0,
    fourPity: 0,
    starterPity: 0,
    records: [],
    starterRecords: [],
    nextRecordId: 1,
  }
}

export function describeStandardFive(): string {
  return '角色/武器各半'
}

function pick(list: readonly string[], rng: () => number): string {
  if (list.length === 0) return '未知'
  const index = Math.min(list.length - 1, Math.floor(rng() * list.length))
  return list[index] ?? list[0]
}

function noteStarter(
  standard: StandardWishState,
  name: string,
  totalPulls: number,
): { starterPity: number; starterRecords: StarterRecord[]; nextRecordId: number } {
  if (!starters.has(name)) {
    return {
      starterPity: standard.starterPity + 1,
      starterRecords: standard.starterRecords,
      nextRecordId: standard.nextRecordId,
    }
  }
  const record: StarterRecord = {
    id: standard.nextRecordId,
    name,
    pity: standard.starterPity + 1,
    totalPulls,
  }
  return {
    starterPity: 0,
    starterRecords: [...standard.starterRecords, record],
    nextRecordId: standard.nextRecordId + 1,
  }
}

export function pullStandardOnce(
  standard: StandardWishState,
  owned: WishState,
  pool: StandardPool,
  rng: () => number = Math.random,
): { standard: StandardWishState; owned: WishState; result: PullResult } {
  const totalPulls = standard.totalPulls + 1
  const fiveIndex = standard.fivePity + 1
  const fourIndex = standard.fourPity + 1
  const p5 = fiveStarProbability(fiveIndex)
  const p4 = Math.min(fourStarProbability(fourIndex), 1 - p5)
  const roll = rng()

  let next = standard
  let result: PullResult

  if (roll < p5) {
    const character = rng() < 0.5
    const name = character ? pick(pool.fiveCharacters, rng) : pick(pool.fiveWeapons, rng)
    const record: StandardRecord = {
      id: standard.nextRecordId,
      name,
      pity: fiveIndex,
      totalPulls,
      itemType: character ? 'character' : 'weapon',
    }
    const starter = noteStarter(standard, name, totalPulls)
    next = {
      ...standard,
      totalPulls,
      fivePity: 0,
      fourPity: 0,
      starterPity: starter.starterPity,
      starterRecords: starter.starterRecords,
      records: [...standard.records, record],
      nextRecordId: Math.max(standard.nextRecordId + 1, starter.nextRecordId),
    }
    result = {
      rarity: 5,
      name,
      itemType: character ? 'character' : 'weapon',
      featured: false,
      pity: fiveIndex,
      totalPulls,
    }
  } else if (roll < p5 + p4) {
    const character = rng() < 0.5
    const name = character ? pick(pool.fourCharacters, rng) : pick(pool.fourWeapons, rng)
    const starter = noteStarter(standard, name, totalPulls)
    next = {
      ...standard,
      totalPulls,
      fivePity: fiveIndex,
      fourPity: 0,
      starterPity: starter.starterPity,
      starterRecords: starter.starterRecords,
      nextRecordId: starter.nextRecordId,
    }
    result = {
      rarity: 4,
      name,
      itemType: character ? 'character' : 'weapon',
      featured: false,
      totalPulls,
    }
  } else {
    const starter = noteStarter(standard, '', totalPulls)
    next = {
      ...standard,
      totalPulls,
      fivePity: fiveIndex,
      fourPity: fourIndex,
      starterPity: starter.starterPity,
    }
    result = {
      rarity: 3,
      name: pick(pool.threeWeapons, rng),
      itemType: 'weapon',
      featured: false,
      totalPulls,
    }
  }

  if (result.itemType !== 'character') return { standard: next, owned: grantWeapon(owned, result), result }

  const granted = grantCharacter(owned, result, false)
  if (result.rarity === 5) {
    next = {
      ...next,
      records: next.records.map((record, index) =>
        index === next.records.length - 1
          ? { ...record, constellation: granted.result.constellation, masterless: granted.result.masterless }
          : record,
      ),
    }
  }
  return { standard: next, owned: granted.state, result: granted.result }
}

export function pullStandardMany(
  standard: StandardWishState,
  owned: WishState,
  count: number,
  pool: StandardPool,
  rng: () => number = Math.random,
): { standard: StandardWishState; owned: WishState; results: PullResult[] } {
  let current = standard
  let bag = owned
  const results: PullResult[] = []
  for (let i = 0; i < count; i += 1) {
    const step = pullStandardOnce(current, bag, pool, rng)
    current = step.standard
    bag = step.owned
    results.push(step.result)
  }
  return { standard: current, owned: bag, results }
}

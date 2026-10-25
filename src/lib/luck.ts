import { RADIANCE_ON_FIVE, fiveStarProbability } from './gacha.ts'
import { weaponFiveProbability } from './weaponGacha.ts'

/**
 * 两次五星之间的抽数，以及拿到 UP / 定轨之间的抽数。
 * 角色：50/50，歪了下一发五星是大保底；捕获明光 3%，连歪三次后下一发五星必定捕获明光。
 * 武器：两把五星 UP 里定一把，75% 里再平分；没命中命定值加 1，满 1 后下一发五星必定是定轨。
 * 平均间隔的长期期望，就是这些间隔的长期平均数。
 */

const LOSS_CHANCE = (1 - RADIANCE_ON_FIVE) * 0.5
const WIN_CHANCE = 1 - LOSS_CHANCE
const CHARTED_HIT = 0.75 / 2
const CHARTED_MISS = 1 - CHARTED_HIT
const EXACT_LIMIT = 6

type Branch = {
  next: number
  pmf: Float64Array
  probability: number
  mean: number
  second: number
}

export type LuckSide = 'lucky' | 'even' | 'unlucky'

export type LuckReport = {
  title: string
  side: LuckSide
  average: number
  expected: number
  rarity: string
}

const RANKS: ReadonlyArray<{ tail: number; lucky: string; unlucky: string }> = [
  { tail: 1e-6, lucky: '终极无敌至尊欧皇', unlucky: '终极无敌至尊非酋王' },
  { tail: 1e-5, lucky: '史诗级大欧皇', unlucky: '史诗级非酋长' },
  { tail: 1e-4, lucky: '万里挑一大欧皇', unlucky: '万里挑一大非酋' },
  { tail: 1e-3, lucky: '千里挑一大欧皇', unlucky: '千里挑一大非酋' },
  { tail: 0.05, lucky: '大欧皇', unlucky: '大非酋' },
  { tail: 0.25, lucky: '小欧皇', unlucky: '小非酋' },
]

function pityPoints(probability: (index: number) => number, hardPity: number): Array<[number, number]> {
  const points: Array<[number, number]> = []
  let survival = 1
  for (let pull = 1; pull <= hardPity; pull += 1) {
    const hit = survival * probability(pull)
    if (hit > 0) points.push([pull, hit])
    survival *= 1 - probability(pull)
  }
  return points
}

function convolve(left: ReadonlyArray<readonly [number, number]>, right: ReadonlyArray<readonly [number, number]>): Array<[number, number]> {
  const mass = new Map<number, number>()
  for (const [leftPull, leftChance] of left) {
    for (const [rightPull, rightChance] of right) {
      const pull = leftPull + rightPull
      mass.set(pull, (mass.get(pull) ?? 0) + leftChance * rightChance)
    }
  }
  return [...mass.entries()].sort((left, right) => left[0] - right[0])
}

function scale(points: ReadonlyArray<readonly [number, number]>, factor: number): Array<[number, number]> {
  return points.map(([pull, chance]) => [pull, chance * factor])
}

function mix(parts: ReadonlyArray<ReadonlyArray<readonly [number, number]>>): Array<[number, number]> {
  const mass = new Map<number, number>()
  for (const part of parts) {
    for (const [pull, chance] of part) mass.set(pull, (mass.get(pull) ?? 0) + chance)
  }
  return [...mass.entries()].sort((left, right) => left[0] - right[0])
}

function branch(next: number, points: Array<[number, number]>): Branch {
  let max = 0
  let probability = 0
  let first = 0
  let second = 0
  for (const [pull, chance] of points) {
    if (pull > max) max = pull
    probability += chance
    first += pull * chance
    second += pull * pull * chance
  }
  const pmf = new Float64Array(max + 1)
  for (const [pull, chance] of points) pmf[pull] += chance
  return {
    next,
    pmf,
    probability,
    mean: probability === 0 ? 0 : first / probability,
    second: probability === 0 ? 0 : second / probability,
  }
}

function characterBranches(): Branch[][] {
  const five = pityPoints(fiveStarProbability, 90)
  const twoFives = convolve(five, five)
  const win = branch(0, scale(five, WIN_CHANCE))
  const loseTo = (streak: number) => branch(streak, scale(twoFives, LOSS_CHANCE))
  return [
    [win, loseTo(1)],
    [win, loseTo(2)],
    [win, loseTo(3)],
    [branch(0, five)],
  ]
}

function weaponBranches(): Branch[][] {
  const five = pityPoints(weaponFiveProbability, 80)
  const twoFives = convolve(five, five)
  return [[branch(0, mix([scale(five, CHARTED_HIT), scale(twoFives, CHARTED_MISS)]))]]
}

function cycleMean(edges: readonly Branch[]): number {
  return edges.reduce((total, edge) => total + edge.mean * edge.probability, 0)
}

function longRunMean(branches: readonly Branch[][]): number {
  let probability: number[] = branches.map((_, index) => (index === 0 ? 1 : 0))
  for (let step = 0; step < 80; step += 1) {
    const next = branches.map(() => 0)
    for (let state = 0; state < branches.length; state += 1) {
      for (const edge of branches[state] ?? []) next[edge.next] = (next[edge.next] ?? 0) + (probability[state] ?? 0) * edge.probability
    }
    probability = next
  }
  let mean = 0
  for (let state = 0; state < branches.length; state += 1) {
    mean += (probability[state] ?? 0) * cycleMean(branches[state] ?? [])
  }
  return mean
}

const characterModel = characterBranches()
const weaponModel = weaponBranches()
const characterCache = new Map<number, Float64Array>()
const weaponCache = new Map<number, Float64Array>()

export const CHARACTER_UP_FIRST_EXPECTED = cycleMean(characterModel[0] ?? [])
export const CHARACTER_UP_EXPECTED = longRunMean(characterModel)
export const WEAPON_CHARTED_EXPECTED = longRunMean(weaponModel)

function exactPmf(count: number, branches: readonly Branch[][], maxCycle: number, cache: Map<number, Float64Array>): Float64Array {
  const cached = cache.get(count)
  if (cached) return cached
  let rows: Float64Array[] = branches.map((_, index) => {
    const row = new Float64Array(1)
    if (index === 0) row[0] = 1
    return row
  })
  for (let step = 0; step < count; step += 1) {
    const next = branches.map(() => new Float64Array(maxCycle * (step + 1) + 1))
    for (let state = 0; state < branches.length; state += 1) {
      const row = rows[state]
      if (!row) continue
      let start = 0
      while (start < row.length && (row[start] ?? 0) < 1e-18) start += 1
      let end = row.length - 1
      while (end > start && (row[end] ?? 0) < 1e-18) end -= 1
      for (let pulls = start; pulls <= end; pulls += 1) {
        const probability = row[pulls] ?? 0
        if (probability < 1e-18) continue
        for (const edge of branches[state] ?? []) {
          const destination = next[edge.next]
          const pmf = edge.pmf
          if (!destination) continue
          for (let length = 1; length < pmf.length; length += 1) destination[pulls + length] += probability * (pmf[length] ?? 0)
        }
      }
    }
    rows = next
  }
  const total = new Float64Array(maxCycle * count + 1)
  for (const row of rows) {
    for (let pulls = 0; pulls < row.length; pulls += 1) total[pulls] += row[pulls] ?? 0
  }
  cache.set(count, total)
  return total
}

function tailsOf(pmf: Float64Array, observed: number): { low: number; high: number } {
  let low = 0
  let high = 0
  for (let pulls = 0; pulls < pmf.length; pulls += 1) {
    const probability = pmf[pulls] ?? 0
    if (pulls <= observed) low += probability
    if (pulls >= observed) high += probability
  }
  if (observed >= pmf.length) return { low: 1, high: 0 }
  return { low, high }
}

function moments(count: number, branches: readonly Branch[][]): { mean: number; variance: number } {
  let probability: number[] = branches.map((_, index) => (index === 0 ? 1 : 0))
  let sum = branches.map(() => 0)
  let sum2 = branches.map(() => 0)
  for (let step = 0; step < count; step += 1) {
    const nextProbability = branches.map(() => 0)
    const nextSum = branches.map(() => 0)
    const nextSum2 = branches.map(() => 0)
    for (let state = 0; state < branches.length; state += 1) {
      const mass = probability[state] ?? 0
      if (mass === 0) continue
      const mean = (sum[state] ?? 0) / mass
      const second = (sum2[state] ?? 0) / mass
      for (const edge of branches[state] ?? []) {
        const moved = mass * edge.probability
        const meanNext = mean + edge.mean
        const secondNext = second + edge.second + 2 * mean * edge.mean
        nextProbability[edge.next] = (nextProbability[edge.next] ?? 0) + moved
        nextSum[edge.next] = (nextSum[edge.next] ?? 0) + moved * meanNext
        nextSum2[edge.next] = (nextSum2[edge.next] ?? 0) + moved * secondNext
      }
    }
    probability = nextProbability
    sum = nextSum
    sum2 = nextSum2
  }
  const mean = sum.reduce((total, value) => total + value, 0)
  const second = sum2.reduce((total, value) => total + value, 0)
  return { mean, variance: Math.max(0, second - mean * mean) }
}

function normalCdf(z: number): number {
  if (z < -8) return 0
  if (z > 8) return 1
  const x = Math.abs(z) / Math.SQRT2
  const t = 1 / (1 + 0.3275911 * x)
  const polynomial = (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t)
  const erf = 1 - polynomial * Math.exp(-x * x)
  return 0.5 * (1 + (z < 0 ? -erf : erf))
}

function tailsFromNormal(observed: number, mean: number, variance: number): { low: number; high: number } {
  const deviation = Math.sqrt(variance)
  if (deviation === 0) return { low: observed <= mean ? 1 : 0, high: observed >= mean ? 1 : 0 }
  return {
    low: normalCdf((observed + 0.5 - mean) / deviation),
    high: 1 - normalCdf((observed - 0.5 - mean) / deviation),
  }
}

function rarityText(tail: number): string {
  if (!(tail > 0)) return '亿次里也难出 1 次'
  if (tail > 0.25) return ''
  const oneIn = Math.round(1 / tail)
  if (oneIn >= 100_000_000) return '亿次里也难出 1 次'
  if (oneIn >= 10_000) {
    const wan = oneIn / 10_000
    const text = wan >= 10 ? String(Math.round(wan)) : wan.toFixed(1).replace(/\.0$/, '')
    return `大约 ${text} 万次里有 1 次`
  }
  return `大约 ${oneIn} 次里有 1 次`
}

function titleFor(low: number, high: number): { title: string; side: LuckSide; rarity: string } {
  const tail = Math.min(low, high)
  if (!Number.isFinite(tail) || tail > 0.25) return { title: '欧非守恒', side: 'even', rarity: '' }
  const lucky = low < high
  for (const rank of RANKS) {
    if (tail <= rank.tail) {
      return { title: lucky ? rank.lucky : rank.unlucky, side: lucky ? 'lucky' : 'unlucky', rarity: rarityText(tail) }
    }
  }
  return { title: '欧非守恒', side: 'even', rarity: '' }
}

function evaluate(
  totalPulls: number,
  count: number,
  branches: readonly Branch[][],
  maxCycle: number,
  expected: number,
  cache: Map<number, Float64Array>,
): LuckReport | null {
  if (count <= 0) return null
  const observed = Math.max(0, Math.floor(totalPulls))
  let tails: { low: number; high: number }
  if (count <= EXACT_LIMIT) {
    tails = tailsOf(exactPmf(count, branches, maxCycle, cache), observed)
  } else {
    const moment = moments(count, branches)
    tails = tailsFromNormal(observed, moment.mean, moment.variance)
  }
  const named = titleFor(tails.low, tails.high)
  return { ...named, average: observed / count, expected }
}

export function characterLuck(totalPulls: number, count: number): LuckReport | null {
  return evaluate(totalPulls, count, characterModel, 180, CHARACTER_UP_EXPECTED, characterCache)
}

export function weaponLuck(totalPulls: number, count: number): LuckReport | null {
  return evaluate(totalPulls, count, weaponModel, 160, WEAPON_CHARTED_EXPECTED, weaponCache)
}

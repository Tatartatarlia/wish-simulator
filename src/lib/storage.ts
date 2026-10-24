import { mergeCatalog } from '../data/catalog.ts'
import { defaultPool } from '../data/banner.ts'
import { defaultWeaponPool, emptyRosterEdits, weaponRarityOf } from '../data/weapons.ts'
import { createWishState } from './gacha.ts'
import { createStandardState } from './standardGacha.ts'
import { FATE_MAX, createWeaponState } from './weaponGacha.ts'
import type {
  CharacterCatalog,
  FiveKind,
  FiveProfile,
  FiveStarRecord,
  FourProfile,
  NamedItem,
  OwnedCharacter,
  OwnedWeapon,
  PoolConfig,
  RosterEdits,
  StandardRecord,
  StandardWishState,
  StarterRecord,
  WeaponEntry,
  WeaponPoolConfig,
  WeaponWishState,
  WishState,
} from './types.ts'

const KEY = 'wish-simulator-v1'

const FIVE_KINDS = ['up', 'guaranteed', 'radiance', 'lost', 'charted'] as const

function isFiveKind(value: string): value is FiveKind {
  return (FIVE_KINDS as readonly string[]).includes(value)
}

function nonNegativeInt(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function item(value: unknown, fallback: NamedItem): NamedItem {
  if (!value || typeof value !== 'object') return fallback
  const raw = value as Partial<NamedItem>
  const name = text(raw.name).trim()
  if (!name) return fallback
  return {
    name,
    title: text(raw.title).trim(),
    element: text(raw.element).trim(),
  }
}

export function sanitizePool(value: unknown): PoolConfig {
  if (!value || typeof value !== 'object') return defaultPool
  const raw = value as Partial<PoolConfig>
  if (!Array.isArray(raw.upFours) || raw.upFours.length !== 3) return defaultPool
  const eventName = text(raw.eventName).trim() || defaultPool.eventName
  return {
    eventName,
    upFive: item(raw.upFive, defaultPool.upFive),
    upFours: [
      item(raw.upFours[0], defaultPool.upFours[0]),
      item(raw.upFours[1], defaultPool.upFours[1]),
      item(raw.upFours[2], defaultPool.upFours[2]),
    ],
  }
}

function sanitizeRecord(value: unknown): FiveStarRecord | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<FiveStarRecord>
  if (typeof raw.fiveKind !== 'string' || !isFiveKind(raw.fiveKind)) return null
  const name = text(raw.name).trim()
  if (!name) return null
  const record: FiveStarRecord = {
    id: nonNegativeInt(raw.id, 1),
    name,
    pity: Math.min(90, Math.max(1, nonNegativeInt(raw.pity, 1))),
    totalPulls: nonNegativeInt(raw.totalPulls, 1),
    fiveKind: raw.fiveKind,
  }
  if (typeof raw.constellation === 'number' && Number.isFinite(raw.constellation)) {
    record.constellation = Math.min(6, nonNegativeInt(raw.constellation))
  }
  if (raw.masterless === true) record.masterless = true
  return record
}

function sanitizeOwned(value: unknown): OwnedCharacter[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const owned: OwnedCharacter[] = []
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue
    const raw = entry as Partial<OwnedCharacter>
    const name = text(raw.name).trim()
    if (!name || seen.has(name)) continue
    if (raw.rarity !== 4 && raw.rarity !== 5) continue
    seen.add(name)
    owned.push({
      name,
      rarity: raw.rarity,
      constellation: Math.min(6, nonNegativeInt(raw.constellation)),
    })
  }
  return owned
}

function sanitizeOwnedWeapons(value: unknown): OwnedWeapon[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const owned: OwnedWeapon[] = []
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue
    const raw = entry as Partial<OwnedWeapon>
    const name = text(raw.name).trim()
    if (!name || seen.has(name)) continue
    if (raw.rarity !== 3 && raw.rarity !== 4 && raw.rarity !== 5) continue
    const copies = nonNegativeInt(raw.copies)
    if (copies < 1) continue
    seen.add(name)
    owned.push({ name, rarity: raw.rarity, copies })
  }
  return owned
}

function profileText(value: unknown): string {
  return text(value).trim()
}

function sanitizeFiveProfile(value: unknown): FiveProfile | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<FiveProfile>
  const name = profileText(raw.name)
  const eventName = profileText(raw.eventName)
  const title = profileText(raw.title)
  const element = profileText(raw.element)
  if (!name || !eventName || !title || !element) return null
  return { name, eventName, title, element }
}

function sanitizeFourProfile(value: unknown): FourProfile | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<FourProfile>
  const name = profileText(raw.name)
  const title = profileText(raw.title)
  const element = profileText(raw.element)
  if (!name || !title || !element) return null
  return { name, title, element }
}

export function sanitizeCatalog(value: unknown): CharacterCatalog {
  if (!value || typeof value !== 'object') return mergeCatalog({ fives: [], fours: [] })
  const raw = value as Partial<CharacterCatalog>
  const fives = Array.isArray(raw.fives) ? raw.fives.map(sanitizeFiveProfile).filter((item): item is FiveProfile => item !== null) : []
  const fours = Array.isArray(raw.fours) ? raw.fours.map(sanitizeFourProfile).filter((item): item is FourProfile => item !== null) : []
  return mergeCatalog({ fives, fours })
}

export function sanitizeState(value: unknown): WishState {
  if (!value || typeof value !== 'object') return createWishState()
  const raw = value as Partial<WishState>
  const records = Array.isArray(raw.records)
    ? raw.records.map(sanitizeRecord).filter((record): record is FiveStarRecord => record !== null)
    : []
  const maxId = records.reduce((max, record) => Math.max(max, record.id), 0)
  return {
    totalPulls: nonNegativeInt(raw.totalPulls),
    fivePity: Math.min(89, nonNegativeInt(raw.fivePity)),
    fourPity: Math.min(9, nonNegativeInt(raw.fourPity)),
    fiveGuaranteed: raw.fiveGuaranteed === true,
    fourGuaranteed: raw.fourGuaranteed === true,
    radianceStreak: Math.min(3, nonNegativeInt(raw.radianceStreak)),
    records,
    nextRecordId: Math.max(nonNegativeInt(raw.nextRecordId, 1), maxId + 1),
    owned: sanitizeOwned(raw.owned),
    ownedWeapons: sanitizeOwnedWeapons(raw.ownedWeapons),
    masterless: nonNegativeInt(raw.masterless),
  }
}

function pair(value: unknown, fallback: readonly [string, string]): [string, string] {
  if (!Array.isArray(value) || value.length !== 2) return [fallback[0], fallback[1]]
  const first = text(value[0]).trim() || fallback[0]
  const second = text(value[1]).trim() || fallback[1]
  return first === second ? [fallback[0], fallback[1]] : [first, second]
}

function fiveNames(value: unknown): [string, string, string, string, string] {
  const fallback = defaultWeaponPool.upFours
  if (!Array.isArray(value) || value.length !== 5) return [...fallback]
  const names = value.map((item, index) => text(item).trim() || fallback[index])
  return names.length === new Set(names).size ? (names as [string, string, string, string, string]) : [...fallback]
}

export function sanitizeWeaponPool(value: unknown): WeaponPoolConfig {
  if (!value || typeof value !== 'object') return defaultWeaponPool
  const raw = value as Partial<WeaponPoolConfig>
  const upFives = pair(raw.upFives, defaultWeaponPool.upFives)
  const charted = text(raw.charted).trim()
  return {
    eventName: text(raw.eventName).trim() || defaultWeaponPool.eventName,
    upFives,
    upFours: fiveNames(raw.upFours),
    charted: charted && upFives.includes(charted) ? charted : null,
  }
}

function sanitizeStandardRecord(value: unknown): StandardRecord | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<StandardRecord>
  const name = text(raw.name).trim()
  if (!name || (raw.itemType !== 'character' && raw.itemType !== 'weapon')) return null
  const record: StandardRecord = {
    id: nonNegativeInt(raw.id),
    name,
    pity: nonNegativeInt(raw.pity),
    totalPulls: nonNegativeInt(raw.totalPulls),
    itemType: raw.itemType,
  }
  if (typeof raw.constellation === 'number' && Number.isFinite(raw.constellation)) {
    record.constellation = Math.min(6, nonNegativeInt(raw.constellation))
  }
  if (raw.masterless === true) record.masterless = true
  return record
}

function sanitizeStarterRecord(value: unknown): StarterRecord | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<StarterRecord>
  const name = text(raw.name).trim()
  if (!name) return null
  return {
    id: nonNegativeInt(raw.id),
    name,
    pity: nonNegativeInt(raw.pity),
    totalPulls: nonNegativeInt(raw.totalPulls),
  }
}

export function sanitizeStandardState(value: unknown): StandardWishState {
  if (!value || typeof value !== 'object') return createStandardState()
  const raw = value as Partial<StandardWishState>
  const records = Array.isArray(raw.records)
    ? raw.records.map(sanitizeStandardRecord).filter((record): record is StandardRecord => record !== null)
    : []
  const starterRecords = Array.isArray(raw.starterRecords)
    ? raw.starterRecords.map(sanitizeStarterRecord).filter((record): record is StarterRecord => record !== null)
    : []
  const maxId = [...records, ...starterRecords].reduce((max, record) => Math.max(max, record.id), 0)
  return {
    totalPulls: nonNegativeInt(raw.totalPulls),
    fivePity: Math.min(89, nonNegativeInt(raw.fivePity)),
    fourPity: Math.min(9, nonNegativeInt(raw.fourPity)),
    starterPity: nonNegativeInt(raw.starterPity),
    records,
    starterRecords,
    nextRecordId: Math.max(nonNegativeInt(raw.nextRecordId, 1), maxId + 1),
  }
}

export function sanitizeWeaponState(value: unknown): WeaponWishState {
  if (!value || typeof value !== 'object') return createWeaponState()
  const raw = value as Partial<WeaponWishState>
  const records = Array.isArray(raw.records)
    ? raw.records.map(sanitizeRecord).filter((record): record is FiveStarRecord => record !== null)
    : []
  const maxId = records.reduce((max, record) => Math.max(max, record.id), 0)
  return {
    totalPulls: nonNegativeInt(raw.totalPulls),
    fivePity: Math.min(79, nonNegativeInt(raw.fivePity)),
    fourPity: Math.min(9, nonNegativeInt(raw.fourPity)),
    fiveGuaranteed: raw.fiveGuaranteed === true,
    fourGuaranteed: raw.fourGuaranteed === true,
    fatePoints: Math.min(FATE_MAX, nonNegativeInt(raw.fatePoints)),
    records,
    nextRecordId: Math.max(nonNegativeInt(raw.nextRecordId, 1), maxId + 1),
  }
}

function sanitizeWeaponEntry(value: unknown): WeaponEntry | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<WeaponEntry>
  const name = text(raw.name).trim()
  if (!name || (raw.rarity !== 3 && raw.rarity !== 4 && raw.rarity !== 5)) return null
  return { name, rarity: raw.rarity }
}

export function sanitizeRoster(value: unknown): RosterEdits {
  if (!value || typeof value !== 'object') return emptyRosterEdits()
  const raw = value as Partial<RosterEdits>
  const names = (list: unknown) => (Array.isArray(list) ? [...new Set(list.map((item) => text(item).trim()).filter(Boolean))] : [])
  return {
    removedCharacters: names(raw.removedCharacters),
    removedWeapons: names(raw.removedWeapons).filter((name) => weaponRarityOf(name, emptyRosterEdits()) !== null),
    addedWeapons: Array.isArray(raw.addedWeapons)
      ? raw.addedWeapons.map(sanitizeWeaponEntry).filter((item): item is WeaponEntry => item !== null)
      : [],
  }
}

export type SaveData = {
  state: WishState
  pool: PoolConfig
  catalog: CharacterCatalog
  weaponState: WeaponWishState
  weaponPool: WeaponPoolConfig
  roster: RosterEdits
  standardState: StandardWishState
}

export function loadSave(): SaveData {
  const fresh: SaveData = {
    state: createWishState(),
    pool: defaultPool,
    catalog: sanitizeCatalog(null),
    weaponState: createWeaponState(),
    weaponPool: defaultWeaponPool,
    roster: emptyRosterEdits(),
    standardState: createStandardState(),
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fresh
    const data = JSON.parse(raw) as Partial<SaveData>
    return {
      state: sanitizeState(data.state),
      pool: sanitizePool(data.pool),
      catalog: sanitizeCatalog(data.catalog),
      weaponState: sanitizeWeaponState(data.weaponState),
      weaponPool: sanitizeWeaponPool(data.weaponPool),
      roster: sanitizeRoster(data.roster),
      standardState: sanitizeStandardState(data.standardState),
    }
  } catch {
    return fresh
  }
}

export function saveSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // 存储满或被禁用时，这一局仍可继续，只是刷新后不会留下。
  }
}

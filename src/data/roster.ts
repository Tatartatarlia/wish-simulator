import { FOUR_STAR_CHARACTERS, STANDARD_FIVE_STARS, fourStarRoster } from './banner.ts'
import { findFive, findFour } from './catalog.ts'
import { weaponRarityOf } from './weapons.ts'
import type { CharacterCatalog, FourProfile, PoolConfig, RosterEdits, WeaponPoolConfig } from '../lib/types.ts'

function listedCharacter(name: string, catalog: CharacterCatalog, extraFourNames: readonly string[]): boolean {
  return Boolean(findFive(catalog, name) || findFour(catalog, name) || (STANDARD_FIVE_STARS as readonly string[]).includes(name) || fourStarRoster(extraFourNames).includes(name))
}

export function deleteCharacter(
  edits: RosterEdits,
  catalog: CharacterCatalog,
  pool: PoolConfig,
  extraFourNames: readonly string[],
  rawName: string,
): { ok: true; edits: RosterEdits; catalog: CharacterCatalog } | { ok: false; error: string } {
  const name = rawName.trim()
  if (!name) return { ok: false, error: '请填写要删除的角色名' }
  const upNames = [pool.upFive.name, ...pool.upFours.map((item) => item.name)]
  if (upNames.includes(name)) return { ok: false, error: `${name} 正在作为角色池 UP，请先换成别的角色再删除` }
  const inCatalog = Boolean(findFive(catalog, name) || findFour(catalog, name))
  if (!inCatalog && (edits.removedCharacters.includes(name) || !listedCharacter(name, catalog, extraFourNames))) {
    return { ok: false, error: `卡池里没有角色「${name}」` }
  }
  const stillListed = (STANDARD_FIVE_STARS as readonly string[]).includes(name) || (FOUR_STAR_CHARACTERS as readonly string[]).includes(name) || extraFourNames.includes(name)
  return {
    ok: true,
    edits: {
      ...edits,
      removedCharacters: stillListed ? [...edits.removedCharacters, name] : edits.removedCharacters,
    },
    catalog: {
      fives: catalog.fives.filter((item) => item.name !== name),
      fours: catalog.fours.filter((item) => item.name !== name),
    },
  }
}

export function deleteWeapon(
  edits: RosterEdits,
  weaponPool: WeaponPoolConfig,
  rawName: string,
): { ok: true; edits: RosterEdits } | { ok: false; error: string } {
  const name = rawName.trim()
  if (!name) return { ok: false, error: '请填写要删除的武器名' }
  const upNames = [...weaponPool.upFives, ...weaponPool.upFours]
  if (upNames.includes(name)) return { ok: false, error: `${name} 正在作为武器池 UP，请先换成别的武器再删除` }
  if (weaponRarityOf(name, edits) === null) return { ok: false, error: `卡池里没有武器「${name}」` }
  const base = baseWeaponRarity(name)
  return {
    ok: true,
    edits: {
      ...edits,
      removedWeapons:
        base === null
          ? edits.removedWeapons.filter((item) => item !== name)
          : edits.removedWeapons.includes(name)
            ? edits.removedWeapons
            : [...edits.removedWeapons, name],
      addedWeapons: edits.addedWeapons.filter((item) => item.name !== name),
    },
  }
}

function withoutName(names: readonly string[], name: string): string[] {
  return names.filter((item) => item !== name)
}

/** 给已有或新的四星登记称号。若这个角色曾被删掉，会同时加回两个祈愿池。 */
export function registerFourCharacter(
  edits: RosterEdits,
  catalog: CharacterCatalog,
  input: FourProfile,
): { ok: true; edits: RosterEdits; catalog: CharacterCatalog; restored: boolean; updated: boolean } | { ok: false; error: string } {
  const profile = { name: input.name.trim(), title: input.title.trim(), element: input.element.trim() }
  if (!profile.name || !profile.title || !profile.element) return { ok: false, error: '角色名称、称号和元素都要填写' }
  if (baseWeaponRarity(profile.name) !== null || weaponRarityOf(profile.name, edits) !== null) {
    return { ok: false, error: `${profile.name} 已经是武器名` }
  }
  if (findFive(catalog, profile.name) || (STANDARD_FIVE_STARS as readonly string[]).includes(profile.name)) {
    return { ok: false, error: `${profile.name} 已经是五星角色` }
  }
  const existing = findFour(catalog, profile.name)
  const restored = edits.removedCharacters.includes(profile.name)
  const removedCharacters = withoutName(edits.removedCharacters, profile.name)
  if (existing) {
    const same = existing.title === profile.title && existing.element === profile.element
    if (same && !restored) return { ok: false, error: `${profile.name} 已经对应 ${existing.title} · ${existing.element}` }
    const fours = same ? catalog.fours : catalog.fours.map((item) => (item.name === profile.name ? profile : item))
    return { ok: true, catalog: { ...catalog, fours }, edits: { ...edits, removedCharacters }, restored, updated: !same }
  }
  return {
    ok: true,
    catalog: { ...catalog, fours: [...catalog.fours, profile] },
    edits: { ...edits, removedCharacters },
    restored,
    updated: false,
  }
}

export function restoreCharacter(edits: RosterEdits, rawName: string): RosterEdits {
  const name = rawName.trim()
  if (!edits.removedCharacters.includes(name)) return edits
  return { ...edits, removedCharacters: withoutName(edits.removedCharacters, name) }
}

export function addWeapon(
  edits: RosterEdits,
  catalog: CharacterCatalog,
  rawName: string,
  rarity: 3 | 4 | 5,
): { ok: true; edits: RosterEdits } | { ok: false; error: string } {
  const name = rawName.trim()
  if (!name) return { ok: false, error: '请填写武器名称' }
  if (listedCharacterName(name) || findFive(catalog, name) || findFour(catalog, name)) return { ok: false, error: `${name} 已经是角色名` }
  const current = weaponRarityOf(name, edits)
  if (current !== null) return { ok: false, error: `${name} 已经是${current}星武器` }
  const removed = edits.removedWeapons.filter((item) => item !== name)
  const added = edits.addedWeapons.filter((item) => item.name !== name)
  const baseRarity = baseWeaponRarity(name)
  if (baseRarity !== null && baseRarity !== rarity) return { ok: false, error: `${name} 原来是${baseRarity}星武器` }
  return {
    ok: true,
    edits: {
      ...edits,
      removedWeapons: removed,
      addedWeapons: baseRarity === null ? [...added, { name, rarity }] : added,
    },
  }
}

function listedCharacterName(name: string): boolean {
  return (STANDARD_FIVE_STARS as readonly string[]).includes(name) || (FOUR_STAR_CHARACTERS as readonly string[]).includes(name)
}

function baseWeaponRarity(name: string): 3 | 4 | 5 | null {
  return weaponRarityOf(name, { removedCharacters: [], removedWeapons: [], addedWeapons: [] })
}

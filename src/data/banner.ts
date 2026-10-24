import { DEFAULT_FIVE_PROFILES, DEFAULT_FOUR_PROFILES } from './catalog.ts'
import type { NamedItem, PoolConfig, ResolvedPool, RosterEdits } from '../lib/types.ts'

/**
 * 默认角色卡池。
 * 要换默认五星 UP，只改下面的 featuredFiveName。名字必须和 src/data/catalog.ts 里的角色名一致，活动名称、称号、元素会自动带上。
 * 浏览器里已经保存过卡池时，会继续用上次的选择；要看这里的默认值，可在详情里改回，或清掉本站的本地数据。
 * 常驻角色、四星与三星武器仍以这里的清单为准。
 */

const featuredFiveName = '丝柯克'
const featuredFive = DEFAULT_FIVE_PROFILES.find((item) => item.name === featuredFiveName) ?? DEFAULT_FIVE_PROFILES[0]
const featuredFourNames = ['塔利雅', '坎蒂丝', '米卡'] as const
const featuredFours = featuredFourNames.map((name) => {
  const profile = DEFAULT_FOUR_PROFILES.find((item) => item.name === name)
  if (!profile) throw new Error(`默认四星 UP「${name}」不在角色记录里`)
  return profile
})

export const defaultPool: PoolConfig = {
  eventName: featuredFive.eventName,
  upFive: { name: featuredFive.name, title: featuredFive.title, element: featuredFive.element },
  upFours: [
    { name: featuredFours[0].name, title: featuredFours[0].title, element: featuredFours[0].element },
    { name: featuredFours[1].name, title: featuredFours[1].title, element: featuredFours[1].element },
    { name: featuredFours[2].name, title: featuredFours[2].title, element: featuredFours[2].element },
  ],
}

export const STANDARD_FIVE_STARS: readonly string[] = [
  '梦见月瑞希',
  '迪希雅',
  '提纳里',
  '刻晴',
  '莫娜',
  '七七',
  '迪卢克',
  '琴',
]

/** 御三家只进常驻池，不进角色活动祈愿和武器祈愿的四星角色名单。 */
export const STARTER_NAMES: readonly string[] = ['安柏', '凯亚', '丽莎']

/** 含本期四星 UP。解析卡池时，当前 UP 会从歪池里拿掉。 */

export const FOUR_STAR_CHARACTERS: readonly string[] = [
  '塔利雅',
  '米卡',
  '坎蒂丝',
  '阿罗夏',
  '布伦妮',
  '叶洛亚',
  '雅珂达',
  '爱诺',
  '伊法',
  '伊安珊',
  '蓝砚',
  '欧洛伦',
  '卡齐娜',
  '赛索斯',
  '嘉明',
  '夏沃蕾',
  '夏洛蒂',
  '菲米尼',
  '琳妮特',
  '卡维',
  '瑶瑶',
  '珐露珊',
  '莱依拉',
  '多莉',
  '柯莱',
  '久岐忍',
  '云堇',
  '绮良良',
  '鹿野院平藏',
  '九条裟罗',
  '五郎',
  '早柚',
  '托马',
  '烟绯',
  '罗莎莉亚',
  '辛焱',
  '砂糖',
  '迪奥娜',
  '重云',
  '诺艾尔',
  '班尼特',
  '菲谢尔',
  '凝光',
  '行秋',
  '北斗',
  '香菱',
  '雷泽',
  '芭芭拉',
]

export const FOUR_STAR_WEAPONS: readonly string[] = [
  '匣里龙吟',
  '祭礼剑',
  '笛剑',
  '西风剑',
  '雨裁',
  '祭礼大剑',
  '钟剑',
  '西风大剑',
  '西风长枪',
  '匣里灭辰',
  '昭心',
  '祭礼残章',
  '流浪乐章',
  '西风秘典',
  '弓藏',
  '祭礼弓',
  '绝弦',
  '西风猎弓',
]

export const THREE_STAR_WEAPONS: readonly string[] = [
  '飞天御剑',
  '黎明神剑',
  '冷刃',
  '以理服人',
  '沐浴龙血的剑',
  '铁影阔剑',
  '黑缨枪',
  '翡玉法球',
  '讨龙英杰谭',
  '魔导绪论',
  '弹弓',
  '神射手之誓',
  '鸦羽弓',
]

function cleanItem(item: NamedItem, fallback: NamedItem): NamedItem {
  const name = item.name.trim()
  return {
    name: name || fallback.name,
    title: item.title.trim() || (name ? '' : fallback.title),
    element: item.element.trim() || (name ? '' : fallback.element),
  }
}

export function fourStarRoster(extraNames: readonly string[] = []): string[] {
  const names = [...FOUR_STAR_CHARACTERS]
  for (const name of extraNames) {
    const trimmed = name.trim()
    if (trimmed && !(STARTER_NAMES as readonly string[]).includes(trimmed) && !names.includes(trimmed)) names.push(trimmed)
  }
  return names
}

/** 新角色名不能和常驻五星、已有四星或武器重名。 */
export function rosterNameConflict(name: string, rarity: 4 | 5): string | null {
  const trimmed = name.trim()
  if (!trimmed) return null
  if ((FOUR_STAR_WEAPONS as readonly string[]).includes(trimmed) || (THREE_STAR_WEAPONS as readonly string[]).includes(trimmed)) {
    return `${trimmed} 已经是武器名`
  }
  if (rarity === 5 && (STANDARD_FIVE_STARS as readonly string[]).includes(trimmed)) {
    return `${trimmed} 已经是常驻五星，不能再登记成活动五星`
  }
  if (rarity === 5 && (FOUR_STAR_CHARACTERS as readonly string[]).includes(trimmed)) {
    return `${trimmed} 已经是四星角色`
  }
  if (rarity === 4 && (STANDARD_FIVE_STARS as readonly string[]).includes(trimmed)) {
    return `${trimmed} 已经是常驻五星`
  }
  return null
}

function withoutRemoved(names: readonly string[], removed: readonly string[]): string[] {
  if (removed.length === 0) return [...names]
  const skip = new Set(removed)
  return names.filter((name) => !skip.has(name))
}

export function buildPool(config: PoolConfig, extraFourNames: readonly string[] = [], edits?: RosterEdits): ResolvedPool {
  const removedCharacters = edits?.removedCharacters ?? []
  const removedWeapons = edits?.removedWeapons ?? []
  const addedWeapons = edits?.addedWeapons ?? []
  const upFive = cleanItem(config.upFive, defaultPool.upFive)
  const upFours = config.upFours.map((item, index) => cleanItem(item, defaultPool.upFours[index]))
  const upFourNames = upFours.map((item) => item.name)
  const upFourSet = new Set(upFourNames)
  const roster = withoutRemoved(fourStarRoster(extraFourNames), removedCharacters)
  const standardFives = withoutRemoved(STANDARD_FIVE_STARS, removedCharacters).filter((name) => name !== upFive.name)
  const offBannerFours = roster.filter((name) => !upFourSet.has(name))
  const fourWeapons = withoutRemoved(FOUR_STAR_WEAPONS, removedWeapons)
  for (const weapon of addedWeapons) {
    if (weapon.rarity === 4 && !removedWeapons.includes(weapon.name) && !fourWeapons.includes(weapon.name)) fourWeapons.push(weapon.name)
  }
  const threeWeapons = withoutRemoved(THREE_STAR_WEAPONS, removedWeapons)
  for (const weapon of addedWeapons) {
    if (weapon.rarity === 3 && !removedWeapons.includes(weapon.name) && !threeWeapons.includes(weapon.name)) threeWeapons.push(weapon.name)
  }

  return {
    upFiveName: upFive.name,
    upFourNames,
    standardFives: standardFives.length > 0 ? standardFives : withoutRemoved(STANDARD_FIVE_STARS, removedCharacters),
    offBannerFours: offBannerFours.length > 0 ? offBannerFours : roster,
    fourWeapons,
    threeWeapons,
  }
}

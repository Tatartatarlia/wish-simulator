import { FOUR_STAR_WEAPONS, THREE_STAR_WEAPONS } from './banner.ts'
import type { ResolvedWeaponPool, RosterEdits, WeaponPoolConfig } from '../lib/types.ts'

/** 常驻五星武器。没被选为 UP 时，在武器池歪掉时出现。 */
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
export const LIMITED_FIVE_WEAPONS: readonly string[] = [
  '斫峰之刃',
  '磐岩结绿',
  '苍古自由之誓',
  '雾切之回光',
  '波乱月白经津',
  '圣显之钥',
  '裁叶萃光',
  '静水流涌之辉',
  '有乐御簾切',
  '赦罪',
  '岩峰巡歌',
  '苍耀',
  '黑蚀',
  '朏魄含光',
  '白湖冬羽',
  '蝶变',
  '无工之剑',
  '松籁响起之时',
  '赤角石溃杵',
  '苇海信标',
  '裁断',
  '山王长牙',
  '焚曜千阳',
  '狼的武功歌',
  '超越之匙',
  '贯虹之槊',
  '护摩之杖',
  '薙草之稻光',
  '息灾',
  '赤沙之杖',
  '赤月之形',
  '柔灯挽歌',
  '香韵奏者',
  '支离轮光',
  '血染荒城',
  '灾悔',
  '尘世之锁',
  '不灭月华',
  '神乐之真意',
  '千夜浮梦',
  '图莱杜拉的回忆',
  '碧落之珑',
  '金流监督',
  '万世流涌大典',
  '鹤鸣余音',
  '冲浪时光',
  '祭星者之望',
  '寝正月初晴',
  '溢彩心念',
  '纺夜天镜',
  '真语秘匣',
  '帷间夜曲',
  '尘光七谕',
  '漩流颂歌',
  '终末嗟叹之诗',
  '飞雷之弦振',
  '冬极白星',
  '若水',
  '猎人之径',
  '最初的大魔术',
  '白雨心弦',
  '星鹫赤羽',
  '黎明破晓之史',
  '霜结的誓金枝',
]

/** 限定四星同样只在被选为武器池 UP 时出现，不进常驻四星池，也不进角色池。 */
export const LIMITED_FOUR_WEAPONS: readonly string[] = [
  '暗巷闪光',
  '暗巷的酒与诗',
  '暗巷猎手',
  '幽夜华尔兹',
  '千岩古剑',
  '千岩长枪',
  '恶王丸',
  '断浪长鳍',
  '曚云之月',
  '玛海菈的水色',
  '西福斯的月光',
  '流浪的晚星',
  '船坞长剑',
  '便携动力锯',
  '勘探钻机',
  '测距规',
  '镇山之钉',
  '弥坚骨',
  '硕果钩',
  '缀花之翎',
  '乘浪的回旋',
  '霜辰',
  '圣祭者的辉杖',
  '织月者的曙色',
  '新枝',
  '凝雪沉心',
  '柔风游弦',
]

export const WEAPON_TYPES: Readonly<Record<string, string>> = {
  风鹰剑: '单手剑',
  天空之刃: '单手剑',
  斫峰之刃: '单手剑',
  磐岩结绿: '单手剑',
  苍古自由之誓: '单手剑',
  雾切之回光: '单手剑',
  波乱月白经津: '单手剑',
  圣显之钥: '单手剑',
  裁叶萃光: '单手剑',
  静水流涌之辉: '单手剑',
  有乐御簾切: '单手剑',
  赦罪: '单手剑',
  岩峰巡歌: '单手剑',
  苍耀: '单手剑',
  黑蚀: '单手剑',
  朏魄含光: '单手剑',
  白湖冬羽: '单手剑',
  星锋剑: '单手剑',
  蝶变: '单手剑',
  天空之傲: '双手剑',
  狼的末路: '双手剑',
  无工之剑: '双手剑',
  松籁响起之时: '双手剑',
  赤角石溃杵: '双手剑',
  苇海信标: '双手剑',
  裁断: '双手剑',
  山王长牙: '双手剑',
  焚曜千阳: '双手剑',
  狼的武功歌: '双手剑',
  超越之匙: '双手剑',
  和璞鸢: '长柄武器',
  天空之脊: '长柄武器',
  贯虹之槊: '长柄武器',
  护摩之杖: '长柄武器',
  薙草之稻光: '长柄武器',
  息灾: '长柄武器',
  赤沙之杖: '长柄武器',
  赤月之形: '长柄武器',
  柔灯挽歌: '长柄武器',
  香韵奏者: '长柄武器',
  支离轮光: '长柄武器',
  血染荒城: '长柄武器',
  灾悔: '长柄武器',
  天空之卷: '法器',
  四风原典: '法器',
  尘世之锁: '法器',
  不灭月华: '法器',
  神乐之真意: '法器',
  千夜浮梦: '法器',
  图莱杜拉的回忆: '法器',
  碧落之珑: '法器',
  金流监督: '法器',
  万世流涌大典: '法器',
  鹤鸣余音: '法器',
  冲浪时光: '法器',
  祭星者之望: '法器',
  寝正月初晴: '法器',
  溢彩心念: '法器',
  纺夜天镜: '法器',
  真语秘匣: '法器',
  帷间夜曲: '法器',
  尘光七谕: '法器',
  漩流颂歌: '法器',
  天空之翼: '弓',
  阿莫斯之弓: '弓',
  终末嗟叹之诗: '弓',
  飞雷之弦振: '弓',
  冬极白星: '弓',
  若水: '弓',
  猎人之径: '弓',
  最初的大魔术: '弓',
  白雨心弦: '弓',
  星鹫赤羽: '弓',
  黎明破晓之史: '弓',
  霜结的誓金枝: '弓',
  匣里龙吟: '单手剑',
  祭礼剑: '单手剑',
  笛剑: '单手剑',
  西风剑: '单手剑',
  暗巷闪光: '单手剑',
  西福斯的月光: '单手剑',
  船坞长剑: '单手剑',
  弥坚骨: '单手剑',
  织月者的曙色: '单手剑',
  新枝: '单手剑',
  雨裁: '双手剑',
  祭礼大剑: '双手剑',
  钟剑: '双手剑',
  西风大剑: '双手剑',
  千岩古剑: '双手剑',
  恶王丸: '双手剑',
  玛海菈的水色: '双手剑',
  便携动力锯: '双手剑',
  硕果钩: '双手剑',
  西风长枪: '长柄武器',
  匣里灭辰: '长柄武器',
  千岩长枪: '长柄武器',
  断浪长鳍: '长柄武器',
  勘探钻机: '长柄武器',
  镇山之钉: '长柄武器',
  圣祭者的辉杖: '长柄武器',
  昭心: '法器',
  祭礼残章: '法器',
  流浪乐章: '法器',
  西风秘典: '法器',
  暗巷的酒与诗: '法器',
  流浪的晚星: '法器',
  乘浪的回旋: '法器',
  霜辰: '法器',
  凝雪沉心: '法器',
  弓藏: '弓',
  祭礼弓: '弓',
  绝弦: '弓',
  西风猎弓: '弓',
  暗巷猎手: '弓',
  幽夜华尔兹: '弓',
  曚云之月: '弓',
  测距规: '弓',
  缀花之翎: '弓',
  柔风游弦: '弓',
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

function byFirstCharacterPinyin(left: string, right: string): number {
  const first = left.trim().charAt(0).localeCompare(right.trim().charAt(0), 'zh-CN')
  if (first !== 0) return first
  return left.localeCompare(right, 'zh-CN')
}

/** 能选作五星 UP 的武器：常驻、限定，以及后来添加且未被删除的五星。 */
export function selectableFiveWeapons(edits: RosterEdits): string[] {
  const added = edits.addedWeapons.filter((item) => item.rarity === 5).map((item) => item.name)
  return unique([...STANDARD_FIVE_WEAPONS, ...LIMITED_FIVE_WEAPONS, ...added], edits.removedWeapons).sort(byFirstCharacterPinyin)
}

/** 能选作四星 UP 的武器：常驻、限定，以及后来添加的四星。删掉的基础武器仍可再选，保存时会加回。 */
export function selectableFourWeapons(edits: RosterEdits): string[] {
  const added = edits.addedWeapons.filter((item) => item.rarity === 4).map((item) => item.name)
  return unique([...FOUR_STAR_WEAPONS, ...LIMITED_FOUR_WEAPONS, ...added], []).sort(byFirstCharacterPinyin)
}

export function weaponPoolNote(name: string): string {
  const trimmed = name.trim()
  const type = WEAPON_TYPES[trimmed]
  if (!type) return ''
  if ((LIMITED_FIVE_WEAPONS as readonly string[]).includes(trimmed) || (LIMITED_FOUR_WEAPONS as readonly string[]).includes(trimmed)) {
    return `${type} · 限定`
  }
  if ((STANDARD_FIVE_WEAPONS as readonly string[]).includes(trimmed) || (FOUR_STAR_WEAPONS as readonly string[]).includes(trimmed)) {
    return `${type} · 常驻`
  }
  return type
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

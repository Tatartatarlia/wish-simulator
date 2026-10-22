export type MeteorTone = 'blue' | 'purple' | 'gold' | 'rainbow'

/** 五星结算方式：自然 UP、大保底、捕获明光、歪、武器定轨 */
export type FiveKind = 'up' | 'guaranteed' | 'radiance' | 'lost' | 'charted'

export type NamedItem = {
  name: string
  title: string
  element: string
}

/** 五星角色名对应唯一的活动、称号、元素 */
export type FiveProfile = {
  name: string
  eventName: string
  title: string
  element: string
}

/** 四星角色名对应唯一的称号、元素 */
export type FourProfile = {
  name: string
  title: string
  element: string
}

export type CharacterCatalog = {
  fives: FiveProfile[]
  fours: FourProfile[]
}

export type PoolConfig = {
  eventName: string
  upFive: NamedItem
  upFours: [NamedItem, NamedItem, NamedItem]
}

export type ResolvedPool = {
  upFiveName: string
  upFourNames: readonly string[]
  standardFives: readonly string[]
  offBannerFours: readonly string[]
  fourWeapons: readonly string[]
  threeWeapons: readonly string[]
}

export type FiveStarRecord = {
  id: number
  name: string
  /** 距上一发五星（或从第一抽开始）的抽数，含本抽 */
  pity: number
  totalPulls: number
  fiveKind: FiveKind
  /** 这一发结算后的命之座，0 到 6。旧记录可能没有。 */
  constellation?: number
  /** 这一发已经是 6 命，因此额外得到一枚无主的命星 */
  masterless?: boolean
}

export type OwnedCharacter = {
  name: string
  rarity: 4 | 5
  /** 命之座层数，0 到 6 */
  constellation: number
}

export type OwnedWeapon = {
  name: string
  rarity: 3 | 4 | 5
  /** 抽到的把数。展示时每 5 把叠成一把精炼，精炼从 1 到 5 */
  copies: number
}

export type WishState = {
  totalPulls: number
  /** 距上一发五星已抽次数，不含即将进行的这一抽 */
  fivePity: number
  /** 距上一件四星及以上已抽次数 */
  fourPity: number
  fiveGuaranteed: boolean
  fourGuaranteed: boolean
  /** 连续「先歪、再靠大保底才拿到 UP」的次数，满 3 则下一发非大保底五星必定捕获明光 */
  radianceStreak: number
  records: FiveStarRecord[]
  nextRecordId: number
  owned: OwnedCharacter[]
  /** 两个卡池抽到的武器，按名字累计把数 */
  ownedWeapons: OwnedWeapon[]
  /** 五星超过 6 命后累计得到的无主的命星 */
  masterless: number
}

export type WeaponEntry = {
  name: string
  rarity: 3 | 4 | 5
}

/** 从默认名单里拿掉的角色、武器，以及后来加进武器池的武器。两个卡池共用这份修改。 */
export type RosterEdits = {
  removedCharacters: string[]
  removedWeapons: string[]
  addedWeapons: WeaponEntry[]
}

export type WeaponPoolConfig = {
  eventName: string
  upFives: [string, string]
  upFours: [string, string, string, string, string]
  /** 神铸定轨。没有定轨时不累积命定值 */
  charted: string | null
}

export type ResolvedWeaponPool = {
  upFives: readonly [string, string]
  upFours: readonly string[]
  standardFives: readonly string[]
  offBannerWeapons: readonly string[]
  fourCharacters: readonly string[]
  threeWeapons: readonly string[]
  charted: string | null
}

export type WeaponWishState = {
  totalPulls: number
  fivePity: number
  fourPity: number
  fiveGuaranteed: boolean
  fourGuaranteed: boolean
  /** 0 到 1。满 1 时下一把五星必定是定轨武器 */
  fatePoints: number
  records: FiveStarRecord[]
  nextRecordId: number
}

export type PullResult = {
  rarity: 3 | 4 | 5
  name: string
  itemType: 'character' | 'weapon'
  featured: boolean
  fiveKind?: FiveKind
  /** 仅五星：本发是几抽出的 */
  pity?: number
  totalPulls: number
  /** 角色这一发结算后的命之座，0 到 6 */
  constellation?: number
  /** 五星已满 6 命，这一发额外得到无主的命星 */
  masterless?: boolean
}

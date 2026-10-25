import { FOUR_STAR_CHARACTERS, STARTER_NAMES, buildPool, defaultPool, fourStarRoster } from '../data/banner.ts'
import { buildStandardPool } from '../data/standard.ts'
import { emptyCatalog, mergeCatalog } from '../data/catalog.ts'
import { addWeapon, deleteCharacter, deleteWeapon, registerFourCharacter } from '../data/roster.ts'
import {
  LIMITED_FOUR_WEAPONS,
  LIMITED_FIVE_WEAPONS,
  STANDARD_FIVE_WEAPONS,
  buildWeaponPool,
  defaultWeaponPool,
  emptyRosterEdits,
  fourStarWeapons,
  selectableFiveWeapons,
  selectableFourWeapons,
} from '../data/weapons.ts'
import { createWishState, grantWeapon, pullOnce, refinementStacks } from './gacha.ts'
import { CHARACTER_UP_EXPECTED, CHARACTER_UP_FIRST_EXPECTED, WEAPON_CHARTED_EXPECTED, characterLuck, weaponLuck } from './luck.ts'
import { createStandardState, pullStandardOnce } from './standardGacha.ts'
import { createWeaponState, pullWeaponOnce } from './weaponGacha.ts'
import type { FiveKind, WishState } from './types.ts'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function scripted(values: number[]): () => number {
  let index = 0
  return () => {
    const value = values[Math.min(index, values.length - 1)] ?? 0
    index += 1
    return value
  }
}

function kindsOf(state: WishState): FiveKind[] {
  return state.records.map((record) => record.fiveKind)
}

function testHardPityAndRadiance(): void {
  const pool = buildPool(defaultPool)
  let state = createWishState()
  const rng = () => 0.999
  for (let i = 0; i < 630; i += 1) {
    const step = pullOnce(state, pool, rng)
    state = step.state
    assert(state.fivePity < 90, '五星保底计数超过 89')
    assert(state.fourPity < 10, '四星保底计数超过 9')
  }
  assert(state.records.length === 7, `硬保底应出 7 个五星，实际 ${state.records.length}`)
  assert(
    state.records.every((record) => record.pity === 90),
    '恒定落空时每个五星都应是 90 抽',
  )
  const kinds = kindsOf(state).join(',')
  assert(
    kinds === 'lost,guaranteed,lost,guaranteed,lost,guaranteed,radiance',
    `三连歪后应捕获明光，实际 ${kinds}`,
  )
  const pitySum = state.records.reduce((sum, record) => sum + record.pity, 0)
  assert(pitySum + state.fivePity === state.totalPulls, '五星间隔没有对上总抽数')
}

function testEarlyBranches(): void {
  const pool = buildPool(defaultPool)

  const radiance = pullOnce(createWishState(), pool, scripted([0, 0]))
  assert(radiance.result.fiveKind === 'radiance', '极低随机数应触发捕获明光')
  assert(radiance.result.name === '丝柯克', '捕获明光应给出 UP')
  assert(radiance.state.radianceStreak === 0, '捕获明光后连歪计数应清零')
  assert(radiance.result.pity === 1, '第一抽五星间隔应为 1')

  const up = pullOnce(createWishState(), pool, scripted([0, 0.5, 0.1]))
  assert(up.result.fiveKind === 'up', '未触发捕获明光且赢得 50/50 时应为 UP')

  const lost = pullOnce(createWishState(), pool, scripted([0, 0.5, 0.9, 0]))
  assert(lost.result.fiveKind === 'lost', '输掉 50/50 时应记为歪')
  assert(lost.result.name === '梦见月瑞希', '歪时应按名单取常驻')
  assert(lost.state.fiveGuaranteed, '歪之后应进入大保底')
  const guaranteed = pullOnce(lost.state, pool, scripted([0, 0]))
  assert(guaranteed.result.fiveKind === 'guaranteed', '大保底应直接给 UP，且不消耗捕获明光')
  assert(guaranteed.result.name === '丝柯克', '大保底角色应为 UP')
  assert(guaranteed.state.radianceStreak === 1, '大保底不应清掉连歪计数')

  let fourState = createWishState()
  for (let i = 0; i < 9; i += 1) {
    const step = pullOnce(fourState, pool, () => 0.9)
    fourState = step.state
    assert(step.result.rarity === 3, `前 9 抽在此随机数下应为三星，第 ${i + 1} 抽是 ${step.result.rarity} 星`)
  }
  const tenth = pullOnce(fourState, pool, () => 0.9)
  assert(tenth.result.rarity === 4, '第 10 抽应保底四星或以上')
  assert(tenth.state.fourGuaranteed, '非 UP 四星后应进入四星保底')
}

function lossRun(kinds: readonly FiveKind[]): number {
  let run = 0
  let max = 0
  for (const kind of kinds) {
    if (run >= 3 && kind !== 'guaranteed') {
      assert(kind === 'radiance', `连歪三次后的下一发五星应是捕获明光，实际 ${kind}`)
    }
    if (kind === 'lost') run += 1
    else if (kind === 'up' || kind === 'radiance') run = 0
    max = Math.max(max, run)
  }
  return max
}

function testMass(): void {
  const pool = buildPool(defaultPool)
  let state = createWishState()
  const total = 400_000
  let fives = 0
  let fours = 0
  let nonGuaranteed = 0
  let nonGuaranteedUp = 0
  let fourGap = 0
  let maxFour = 0

  for (let i = 0; i < total; i += 1) {
    const step = pullOnce(state, pool)
    state = step.state
    fourGap += 1
    if (step.result.rarity >= 4) {
      maxFour = Math.max(maxFour, fourGap)
      fourGap = 0
    }
    if (step.result.rarity === 5) {
      fives += 1
      if (step.result.fiveKind !== 'guaranteed') {
        nonGuaranteed += 1
        if (step.result.featured) nonGuaranteedUp += 1
      }
    } else if (step.result.rarity === 4) fours += 1
    assert(state.fivePity < 90, '模拟中五星计数溢出')
    assert(state.fourPity < 10, '模拟中四星计数溢出')
  }

  const fiveRate = fives / total
  const fourRate = fours / total
  const upRate = nonGuaranteedUp / nonGuaranteed
  const maxLoss = lossRun(kindsOf(state))
  const pitySum = state.records.reduce((sum, record) => sum + record.pity, 0)

  console.log(
    JSON.stringify(
      {
        total,
        fiveRate: Number(fiveRate.toFixed(5)),
        fourRate: Number(fourRate.toFixed(5)),
        upRateOnFifty: Number(upRate.toFixed(5)),
        maxFour,
        maxLoss,
        records: state.records.length,
      },
      null,
      2,
    ),
  )

  assert(fiveRate > 0.0145 && fiveRate < 0.0175, `五星综合概率异常 ${fiveRate}`)
  assert(fourRate > 0.115 && fourRate < 0.145, `四星综合概率异常 ${fourRate}`)
  assert(upRate > 0.52 && upRate < 0.58, `小保底 UP 概率异常 ${upRate}`)
  assert(maxFour <= 10, `四星间隔超过 10：${maxFour}`)
  assert(maxLoss <= 3, `连歪超过 3：${maxLoss}`)
  assert(pitySum + state.fivePity === state.totalPulls, '大量模拟的间隔账目不平')
}

function testConstellationCap(): void {
  const pool = buildPool(defaultPool)
  let state = createWishState()
  for (let copy = 0; copy < 8; copy += 1) {
    const step = pullOnce(state, pool, () => 0)
    state = step.state
    assert(step.result.name === '丝柯克', '满命测试应一直抽到丝柯克')
    assert(step.result.constellation === Math.min(copy, 6), `第 ${copy + 1} 个丝柯克的命座不对`)
    assert(step.result.masterless === (copy === 7), `第 ${copy + 1} 个丝柯克的无主的命星标记不对`)
  }
  const owned = state.owned.find((item) => item.name === '丝柯克')
  assert(owned?.constellation === 6, '仓库中的命座应停在 6')
  assert(state.masterless === 1, '超过 6 命后应有 1 枚无主的命星')
  assert(state.records[7]?.masterless === true, '历史里第 8 个五星应标出无主的命星')
}

function testWeaponBanner(): void {
  const plain = buildWeaponPool(defaultWeaponPool, emptyRosterEdits(), fourStarRoster())
  assert(plain.charted === null, '默认不应事先定轨')
  assert(plain.upFives[0] === '苍耀' && plain.upFives[1] === '香韵奏者', '五星 UP 应为苍耀和香韵奏者')
  const uncharted = pullWeaponOnce(createWeaponState(), createWishState(), plain, () => 0)
  assert(uncharted.result.name === '苍耀' && uncharted.result.fiveKind === 'up', '没有定轨时，自然 UP 仍记为 UP')
  assert(uncharted.weaponState.fatePoints === 0, '没有定轨时不累积命定值')

  const pool = buildWeaponPool({ ...defaultWeaponPool, charted: '香韵奏者' }, emptyRosterEdits(), fourStarRoster())
  let weapons = createWeaponState()
  let characters = createWishState()
  const step = pullWeaponOnce(weapons, characters, pool, () => 0)
  weapons = step.weaponState
  characters = step.characterState
  assert(step.result.name === '苍耀', '未满命定时，随机数 0 应抽到第一件 UP')
  assert(step.result.fiveKind === 'lost', '定轨后，不是定轨武器的五星应记为歪')
  assert(weapons.fatePoints === 1, '一把非定轨五星后命定值应为 1')
  assert(characters.totalPulls === 0 && characters.fivePity === 0, '武器池抽卡不应改角色池保底')
  assert(characters.ownedWeapons.find((item) => item.name === '苍耀')?.copies === 1, '苍耀应记入仓库')
  const charted = pullWeaponOnce(weapons, characters, pool, () => 0)
  assert(charted.result.name === '香韵奏者' && charted.result.fiveKind === 'charted', '命定值满后应定轨出香韵奏者')
  assert(charted.weaponState.fatePoints === 0, '抽到定轨武器后命定值归零')

  let bag = createWishState()
  for (let copy = 0; copy < 7; copy += 1) {
    bag = grantWeapon(bag, { rarity: 5, name: '苍耀', itemType: 'weapon', featured: true, totalPulls: copy + 1 })
  }
  assert(refinementStacks(2).join() === '2', '2 把应显示精2')
  assert(refinementStacks(bag.ownedWeapons[0]?.copies ?? 0).join() === '5,2', '7 把应显示精5和精2')

  let pity = createWeaponState()
  for (let pull = 0; pull < 90; pull += 1) {
    const step = pullWeaponOnce(pity, createWishState(), pool, () => 0.999)
    pity = step.weaponState
    assert(pity.fivePity < 80, '武器五星保底计数超过 79')
    assert(pity.fourPity < 10, '武器四星保底计数超过 9')
  }
  assert(pity.records.length > 0, '连续落空也应在 80 抽内出五星')
}

function testWeaponRoster(): void {
  const edits = emptyRosterEdits()
  const pool = buildWeaponPool(defaultWeaponPool, edits, fourStarRoster())
  assert(defaultWeaponPool.upFives.join(',') === '苍耀,香韵奏者', '默认五星 UP 仍是苍耀和香韵奏者')
  assert(defaultWeaponPool.upFours.join(',') === '弥坚骨,祭礼大剑,西风长枪,流浪乐章,祭礼弓', '默认四星 UP 不变')
  assert(STANDARD_FIVE_WEAPONS.length === 10, '常驻五星武器应为 10 件')
  assert(LIMITED_FIVE_WEAPONS.length === 64, '限定五星武器数量')
  assert(LIMITED_FOUR_WEAPONS.length === 27, '限定四星武器数量')
  assert(selectableFiveWeapons(edits).length === 74, '五星 UP 应能选到全部常驻和限定')
  assert(selectableFourWeapons(edits).includes('暗巷闪光') && selectableFourWeapons(edits).includes('祭礼剑'), '四星 UP 应能选常驻和限定')
  assert(!pool.standardFives.includes('雾切之回光') && !pool.standardFives.includes('灾悔') && !pool.standardFives.includes('星锋剑'), '限定五星不应进入常驻歪池')
  assert(pool.standardFives.includes('风鹰剑'), '没被选为 UP 的常驻五星仍在歪池')
  assert(!pool.offBannerWeapons.includes('暗巷闪光') && !pool.offBannerWeapons.includes('弥坚骨'), '限定四星不应进入常驻四星池')
  assert(pool.offBannerWeapons.includes('祭礼剑'), '常驻四星仍在武器池')
  const characterWeapons = buildPool(defaultPool, fourStarRoster(), edits).fourWeapons
  assert(!characterWeapons.includes('暗巷闪光') && !characterWeapons.includes('弥坚骨'), '限定四星不应出现在角色池')
  const promoted = buildWeaponPool({ ...defaultWeaponPool, upFives: ['风鹰剑', '雾切之回光'] }, edits, fourStarRoster())
  assert(!promoted.standardFives.includes('风鹰剑') && !promoted.standardFives.includes('雾切之回光') && promoted.standardFives.includes('天空之刃'), '选为 UP 的常驻五星要离开歪池，限定五星仍然不进歪池')
}

function testDeletedFourReturns(): void {
  const catalog = mergeCatalog(emptyCatalog())
  const extra = catalog.fours.map((item) => item.name)
  const deleted = deleteCharacter(emptyRosterEdits(), catalog, defaultPool, extra, '夏沃蕾')
  assert(deleted.ok && deleted.edits.removedCharacters.includes('夏沃蕾'), '删除夏沃蕾应记入删除名单')
  if (!deleted.ok) return
  assert(!buildPool(defaultPool, extra, deleted.edits).offBannerFours.includes('夏沃蕾'), '删除后夏沃蕾不应留在四星池')
  const added = registerFourCharacter(deleted.edits, deleted.catalog, { name: '夏沃蕾', title: '明火铳', element: '火' })
  assert(added.ok && added.restored, '给已删除的四星补称号时应加回卡池')
  if (!added.ok) return
  const names = added.catalog.fours.map((item) => item.name)
  assert(buildPool(defaultPool, names, added.edits).offBannerFours.includes('夏沃蕾'), '加回后夏沃蕾应出现在非 UP 四星池')
  const duplicate = registerFourCharacter(added.edits, added.catalog, { name: '夏沃蕾', title: '别的称号', element: '水' })
  assert(!duplicate.ok, '已有称号的四星不能改称号')
  const edited = registerFourCharacter(emptyRosterEdits(), catalog, { name: '米卡', title: '改过的称号', element: '冰' })
  assert(!edited.ok, '默认四星的称号不能修改')

  const removedWeapon = deleteWeapon(emptyRosterEdits(), defaultWeaponPool, '匣里龙吟')
  assert(removedWeapon.ok, '应能删除非 UP 武器匣里龙吟')
  if (!removedWeapon.ok) return
  assert(!fourStarWeapons(removedWeapon.edits).includes('匣里龙吟'), '删除后匣里龙吟不应留在武器池')
  const restoredWeapon = addWeapon(removedWeapon.edits, catalog, '匣里龙吟', 4)
  assert(restoredWeapon.ok, '应能把匣里龙吟加回')
  if (!restoredWeapon.ok) return
  assert(fourStarWeapons(restoredWeapon.edits).includes('匣里龙吟'), '加回后匣里龙吟应回到武器池')
  assert(!restoredWeapon.edits.removedWeapons.includes('匣里龙吟'), '加回后不应继续留在武器删除名单')
  assert(buildPool(defaultPool, extra, restoredWeapon.edits).fourWeapons.includes('匣里龙吟'), '角色池的四星武器也应恢复')
}

function testBuiltinTitles(): void {
  const catalog = mergeCatalog(emptyCatalog())
  const roster = new Set(FOUR_STAR_CHARACTERS)
  const profiled = new Set(catalog.fours.map((item) => item.name))
  assert([...roster].every((name) => profiled.has(name)), '每个四星角色都应有称号和元素')
  assert(STARTER_NAMES.every((name) => profiled.has(name)), '御三家应有称号和元素')
  assert(!fourStarRoster([...profiled]).some((name) => (STARTER_NAMES as readonly string[]).includes(name)), '御三家不应进入角色活动祈愿的四星名单')
  const tartaglia = catalog.fives.find((item) => item.name === '达达利亚')
  assert(tartaglia?.eventName === '暂别冬都' && tartaglia.title === '「公子」' && tartaglia.element === '水', '达达利亚应保留卡池名和称号引号')
  const escoffier = catalog.fives.find((item) => item.name === '爱可菲')
  assert(escoffier?.eventName === '莓色香颂' && escoffier.title === '明绚千韵' && escoffier.element === '冰', '爱可菲称号应为明绚千韵')
  assert(catalog.fives.length === 60, '限定五星记录数量')
  assert(defaultPool.upFive.name === '丝柯克', '默认五星 UP 仍是丝柯克')
  assert(defaultPool.upFours.map((item) => item.name).join(',') === '塔利雅,坎蒂丝,米卡', '默认四星 UP 不变')
}

function testStandardBanner(): void {
  const catalog = mergeCatalog(emptyCatalog())
  const names = catalog.fours.map((item) => item.name)
  const pool = buildStandardPool([], [], names)
  assert(pool.fiveCharacters.includes('莫娜') && pool.fiveCharacters.includes('琴'), '常驻五星角色应在常驻池')
  assert(pool.fiveWeapons.includes('天空之脊') && pool.fiveWeapons.length === 10, '常驻五星武器应在常驻池')
  assert(pool.fourCharacters.includes('安柏') && pool.fourCharacters.includes('凯亚') && pool.fourCharacters.includes('丽莎'), '御三家应在常驻四星角色里')
  assert(pool.fourWeapons.includes('祭礼剑') && !pool.fourWeapons.includes('弥坚骨'), '常驻池只有常驻四星武器')
  assert(!buildPool(defaultPool, names).offBannerFours.includes('安柏'), '御三家不应进入角色活动祈愿')
  assert(!fourStarRoster(names).includes('丽莎'), '御三家不应进入武器祈愿的四星角色')

  const characterSide = pullStandardOnce(createStandardState(), createWishState(), pool, scripted([0, 0, 0]))
  assert(characterSide.result.rarity === 5 && characterSide.result.itemType === 'character', '随机数靠前时应出五星角色')
  assert(characterSide.result.fiveKind === undefined, '常驻五星不记歪或 UP')
  assert(characterSide.result.pity === 1, '第一发出金间隔应从第 1 抽算起')
  assert(characterSide.owned.totalPulls === 0 && characterSide.owned.records.length === 0, '常驻池不应改写角色池记录')
  assert(characterSide.owned.owned.some((item) => item.name === characterSide.result.name), '常驻五星角色应进入仓库')

  const weaponSide = pullStandardOnce(createStandardState(), createWishState(), pool, scripted([0, 0.5, 0]))
  assert(weaponSide.result.rarity === 5 && weaponSide.result.itemType === 'weapon', '五星的后一半应是武器')
  assert(pool.fiveWeapons.includes(weaponSide.result.name), '常驻五星武器应来自常驻武器名单')

  const starterPool = { ...pool, fourCharacters: ['安柏'] }
  const starter = pullStandardOnce(createStandardState(), createWishState(), starterPool, scripted([0.02, 0, 0]))
  assert(starter.result.name === '安柏', '四星角色侧应能抽到安柏')
  assert(starter.standard.starterRecords[0]?.pity === 1, '第一发御三家间隔应从第 1 抽算起')
  const afterGold = pullStandardOnce(characterSide.standard, characterSide.owned, starterPool, scripted([0.02, 0, 0]))
  assert(afterGold.standard.starterRecords[0]?.pity === 2, '出金那一抽也算进御三家间隔')
  assert(afterGold.standard.records.length === 1, '抽到御三家不应再记一条出金')

  let standard = createStandardState()
  let owned = createWishState()
  let characterCount = 0
  for (let pull = 0; pull < 4000; pull += 1) {
    const step = pullStandardOnce(standard, owned, pool)
    standard = step.standard
    owned = step.owned
    if (step.result.rarity === 5 && step.result.itemType === 'character') characterCount += 1
    assert(standard.fivePity < 90, '常驻五星保底超过 89')
    assert(standard.fourPity < 10, '常驻四星保底超过 9')
  }
  const fiveRate = standard.records.length / standard.totalPulls
  const characterShare = characterCount / standard.records.length
  assert(fiveRate > 0.012 && fiveRate < 0.022, `常驻五星综合概率异常 ${fiveRate}`)
  assert(characterShare > 0.42 && characterShare < 0.58, `常驻五星角色比例异常 ${characterShare}`)
  assert(owned.totalPulls === 0, '大量常驻祈愿后角色池抽数仍应为 0')
}

function testLuck(): void {
  assert(CHARACTER_UP_EXPECTED.toFixed(1) === '90.6', `UP 长期期望应为 90.6，实际 ${CHARACTER_UP_EXPECTED}`)
  assert(CHARACTER_UP_FIRST_EXPECTED.toFixed(1) === '92.5', `第一次 UP 期望应为 92.5，实际 ${CHARACTER_UP_FIRST_EXPECTED}`)
  assert(WEAPON_CHARTED_EXPECTED.toFixed(1) === '86.5', `定轨期望应为 86.5，实际 ${WEAPON_CHARTED_EXPECTED}`)
  assert(characterLuck(0, 0) === null, '没有 UP 时不评级')
  assert(weaponLuck(0, 0) === null, '没有定轨命中时不评级')
  const first = characterLuck(1, 1)
  assert(first?.title === '大欧皇' && first.side === 'lucky', `一抽出 UP 应为大欧皇，实际 ${first?.title}`)
  const middle = characterLuck(80, 1)
  assert(middle?.title === '欧非守恒', `80 抽第一次 UP 应是欧非守恒，实际 ${middle?.title}`)
  const poor = characterLuck(180, 1)
  assert(poor?.side === 'unlucky', `180 抽才出 UP 应是非酋，实际 ${poor?.title}`)
  const charted = weaponLuck(1, 1)
  assert(charted?.title === '大欧皇' && charted.side === 'lucky', `一抽出定轨应为大欧皇，实际 ${charted?.title}`)
  const steady = characterLuck(Math.round(CHARACTER_UP_EXPECTED * 40), 40)
  assert(steady?.title === '欧非守恒', `贴着长期期望应是欧非守恒，实际 ${steady?.title}`)
  const streak = characterLuck(30 * 20, 20)
  assert(streak?.side === 'lucky' && streak.title !== '欧非守恒', `连续早出 UP 应是欧皇，实际 ${streak?.title}`)
}

testLuck()
testStandardBanner()
testBuiltinTitles()
testWeaponRoster()
testDeletedFourReturns()
testHardPityAndRadiance()
testWeaponBanner()
testEarlyBranches()
testConstellationCap()
testMass()
console.log('gacha checks passed')

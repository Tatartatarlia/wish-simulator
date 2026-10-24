import type { CharacterCatalog, FiveProfile, FourProfile } from '../lib/types.ts'

/**
 * 角色名是主键。
 * 五星对应唯一的「活动名称 · 称号 · 元素」，四星对应唯一的「称号 · 元素」。
 */
export const DEFAULT_FIVE_PROFILES: readonly FiveProfile[] = [
  { name: '温迪', eventName: '杯装之诗', title: '风色诗人', element: '风' },
  { name: '可莉', eventName: '闪焰的驻足', title: '逃跑的太阳', element: '火' },
  { name: '达达利亚', eventName: '暂别冬都', title: '「公子」', element: '水' },
  { name: '钟离', eventName: '陵薮市朝', title: '尘世闲游', element: '岩' },
  { name: '阿贝多', eventName: '深秘之息', title: '白垩之子', element: '岩' },
  { name: '甘雨', eventName: '浮生孰来', title: '循循守月', element: '冰' },
  { name: '魈', eventName: '烟火之邀', title: '护法夜叉', element: '风' },
  { name: '胡桃', eventName: '赤团开时', title: '雪霁梅香', element: '火' },
  { name: '优菈', eventName: '浪涌之瞬', title: '浪沫的旋舞', element: '冰' },
  { name: '枫原万叶', eventName: '叶落风随', title: '红叶逐荒波', element: '风' },
  { name: '神里绫华', eventName: '白鹭之庭', title: '白鹭霜华', element: '冰' },
  { name: '宵宫', eventName: '焰色天河', title: '琉焰华舞', element: '火' },
  { name: '雷电将军', eventName: '影寂天下人', title: '一心净土', element: '雷' },
  { name: '珊瑚宫心海', eventName: '浮岳虹珠', title: '真珠之智', element: '水' },
  { name: '荒泷一斗', eventName: '鬼门斗宴', title: '花坂豪快', element: '岩' },
  { name: '申鹤', eventName: '出尘入世', title: '孤辰茕怀', element: '冰' },
  { name: '八重神子', eventName: '华紫樱绯', title: '浮世笑百姿', element: '雷' },
  { name: '神里绫人', eventName: '苍流踏花', title: '磐祭叶守', element: '水' },
  { name: '夜兰', eventName: '素霓伣天', title: '兰生幽谷', element: '水' },
  { name: '赛诺', eventName: '雳裁冥昭', title: '缄秘的裁遣', element: '雷' },
  { name: '妮露', eventName: '翩舞歈莲', title: '莲光落舞筵', element: '水' },
  { name: '纳西妲', eventName: '月草的赐慧', title: '白草净华', element: '草' },
  { name: '流浪者', eventName: '余火变相', title: '久世浮倾', element: '风' },
  { name: '艾尔海森', eventName: '敕诫枢谋', title: '诲韬诤言', element: '草' },
  { name: '白术', eventName: '心珠循琅', title: '遵生合和', element: '草' },
  { name: '林尼', eventName: '光与影的戏术', title: '惑光幻戏', element: '火' },
  { name: '那维莱特', eventName: '渊海界令', title: '谕告的潮音', element: '水' },
  { name: '莱欧斯利', eventName: '劫中泛滥', title: '寂罪的密使', element: '冰' },
  { name: '芙宁娜', eventName: '众水的颂诗', title: '不休独舞', element: '水' },
  { name: '娜维娅', eventName: '刺玫的铭誓', title: '明花蔓陀', element: '岩' },
  { name: '闲云', eventName: '云府鹤行', title: '鸾音鹤信', element: '风' },
  { name: '千织', eventName: '千云绘羽织', title: '鸣雷的裁锦诗', element: '岩' },
  { name: '阿蕾奇诺', eventName: '炉边烬影', title: '孤暝厄月', element: '火' },
  { name: '克洛琳德', eventName: '流霆贯夜', title: '秉烛狝影', element: '雷' },
  { name: '希格雯', eventName: '柔柔海露心', title: '龙女妙变', element: '水' },
  { name: '艾梅莉埃', eventName: '凝露轻芳', title: '千缕之踪', element: '草' },
  { name: '玛拉妮', eventName: '鲨鲨逐浪游', title: '哗啦啦逐浪客', element: '水' },
  { name: '基尼奇', eventName: '巡火猎秘', title: '回火之狩', element: '草' },
  { name: '希诺宁', eventName: '煅火的祝赐', title: '焮火铸魂', element: '岩' },
  { name: '恰斯卡', eventName: '饮羽散红', title: '巡羽翦定', element: '风' },
  { name: '玛薇卡', eventName: '宿古的赫炎', title: '焚夜以炎', element: '火' },
  { name: '茜特菈莉', eventName: '星边夜语', title: '白星黑曜', element: '冰' },
  { name: '瓦雷莎', eventName: '饫宴角戏', title: '悠暇豪劲', element: '雷' },
  { name: '爱可菲', eventName: '莓色香颂', title: '明绚千韵', element: '冰' },
  { name: '丝柯克', eventName: '虚星临渡', title: '虚渊暗星', element: '冰' },
  { name: '伊涅芙', eventName: '聚星源动', title: '轰隆雷鸣波', element: '雷' },
  { name: '菈乌玛', eventName: '苍林月祷', title: '永月的祀歌', element: '草' },
  { name: '菲林斯', eventName: '孤灯夜访', title: '诡灯陌影', element: '雷' },
  { name: '奈芙尔', eventName: '赤砂的诱言', title: '湮沙的秘闻', element: '草' },
  { name: '杜林', eventName: '白礜赤成', title: '不熄灭的火', element: '火' },
  { name: '哥伦比娅', eventName: '伴月同眠', title: '空月归乡', element: '水' },
  { name: '兹白', eventName: '华黍由仪', title: '驹隙隐泉', element: '岩' },
  { name: '法尔伽', eventName: '北风的凯旋歌', title: '北风骑士', element: '风' },
  { name: '莉奈娅', eventName: '呀吼吼博物志', title: '博闻异旅', element: '岩' },
  { name: '尼可', eventName: '赤天的默想曲', title: '喧寂于心', element: '火' },
  { name: '洛恩', eventName: '霜锋夜白', title: '恣锐锋镞', element: '冰' },
  { name: '桑多涅', eventName: '镜中的茶宴', title: '镜水析谬', element: '冰' },
  { name: '奥黛塔', eventName: '冰绡鹄影', title: '翾风回雪', element: '冰' },
  { name: '薇斯纳', eventName: '煦风欢舞时', title: '雪宴之锋', element: '风' },
  { name: '沃雅妮莎', eventName: '涌浪叙歌', title: '幽歌萦渊', element: '水' },
]

export const DEFAULT_FOUR_PROFILES: readonly FourProfile[] = [
  { name: '芭芭拉', title: '闪耀偶像', element: '水' },
  { name: '雷泽', title: '狼少年', element: '雷' },
  { name: '香菱', title: '万民百味', element: '火' },
  { name: '北斗', title: '无冕的龙王', element: '雷' },
  { name: '行秋', title: '少年春衫薄', element: '水' },
  { name: '凝光', title: '掩月天权', element: '岩' },
  { name: '菲谢尔', title: '断罪皇女！！', element: '雷' },
  { name: '班尼特', title: '命运试金石', element: '火' },
  { name: '诺艾尔', title: '未授勋之花', element: '岩' },
  { name: '重云', title: '雪融有踪', element: '冰' },
  { name: '砂糖', title: '无害甜度', element: '风' },
  { name: '迪奥娜', title: '猫尾特调', element: '冰' },
  { name: '辛焱', title: '燥热旋律', element: '火' },
  { name: '罗莎莉亚', title: '棘冠恩典', element: '冰' },
  { name: '烟绯', title: '智明无邪', element: '火' },
  { name: '早柚', title: '忍里之貉', element: '风' },
  { name: '九条裟罗', title: '黑羽鸣镝', element: '雷' },
  { name: '托马', title: '渡来介者', element: '火' },
  { name: '五郎', title: '戒犬锵锵', element: '岩' },
  { name: '云堇', title: '红毹婵娟', element: '岩' },
  { name: '久岐忍', title: '烦恼刈除', element: '雷' },
  { name: '鹿野院平藏', title: '心朝乂安', element: '风' },
  { name: '柯莱', title: '萃念初蘖', element: '草' },
  { name: '多莉', title: '梦园藏金', element: '雷' },
  { name: '坎蒂丝', title: '浮金的誓愿', element: '水' },
  { name: '莱依拉', title: '绮思晚星', element: '冰' },
  { name: '珐露珊', title: '机逐封秘', element: '风' },
  { name: '瑶瑶', title: '仙蕊玲珑', element: '草' },
  { name: '米卡', title: '晴霜的标绘', element: '冰' },
  { name: '卡维', title: '天穹之镜', element: '草' },
  { name: '绮良良', title: '檐宇猫游', element: '草' },
  { name: '琳妮特', title: '丽影绮行', element: '风' },
  { name: '菲米尼', title: '潜怀遐梦', element: '冰' },
  { name: '夏洛蒂', title: '朗镜索真', element: '冰' },
  { name: '夏沃蕾', title: '明律决罚', element: '火' },
  { name: '嘉明', title: '骏猊頕首', element: '火' },
  { name: '赛索斯', title: '衡明知度', element: '雷' },
  { name: '卡齐娜', title: '斑金矿朴', element: '岩' },
  { name: '欧洛伦', title: '深黯的谜烟', element: '雷' },
  { name: '蓝砚', title: '翦玉编春', element: '风' },
  { name: '伊安珊', title: '熔石百炼', element: '雷' },
  { name: '伊法', title: '急救如急袭', element: '风' },
  { name: '塔利雅', title: '颂礼祝祭', element: '水' },
  { name: '爱诺', title: '妙械咣咣铛', element: '水' },
  { name: '雅珂达', title: '系风攘影', element: '风' },
  { name: '叶洛亚', title: '魇夜燃心', element: '岩' },
  { name: '布伦妮', title: '稚梦归心', element: '风' },
  { name: '阿罗夏', title: '疾掠弋缇', element: '雷' },
  { name: '安柏', title: '飞行冠军', element: '火' },
  { name: '凯亚', title: '寒风剑士', element: '冰' },
  { name: '丽莎', title: '蔷薇魔女', element: '雷' },
]

export const ELEMENTS = ['冰', '水', '火', '雷', '风', '岩', '草'] as const

export function emptyCatalog(): CharacterCatalog {
  return { fives: [], fours: [] }
}

export function mergeCatalog(extra: CharacterCatalog): CharacterCatalog {
  const fives: FiveProfile[] = DEFAULT_FIVE_PROFILES.map((item) => ({ ...item }))
  const fours: FourProfile[] = DEFAULT_FOUR_PROFILES.map((item) => ({ ...item }))
  const fiveNames = new Set(fives.map((item) => item.name))
  const fourNames = new Set(fours.map((item) => item.name))

  for (const item of extra.fives) {
    if (fiveNames.has(item.name) || fourNames.has(item.name)) continue
    fives.push(item)
    fiveNames.add(item.name)
  }
  for (const item of extra.fours) {
    const index = fours.findIndex((entry) => entry.name === item.name)
    if (index >= 0) {
      fours[index] = { ...item }
      continue
    }
    if (fiveNames.has(item.name)) continue
    fours.push(item)
    fourNames.add(item.name)
  }
  return { fives, fours }
}

export function catalogExtras(catalog: CharacterCatalog): CharacterCatalog {
  const defaultFives = new Set(DEFAULT_FIVE_PROFILES.map((item) => item.name))
  return {
    fives: catalog.fives.filter((item) => !defaultFives.has(item.name)),
    fours: catalog.fours.filter((item) => {
      const builtIn = DEFAULT_FOUR_PROFILES.find((entry) => entry.name === item.name)
      if (!builtIn) return true
      return builtIn.title !== item.title || builtIn.element !== item.element
    }),
  }
}

export function findFive(catalog: CharacterCatalog, name: string): FiveProfile | undefined {
  const trimmed = name.trim()
  return catalog.fives.find((item) => item.name === trimmed)
}

export function findFour(catalog: CharacterCatalog, name: string): FourProfile | undefined {
  const trimmed = name.trim()
  return catalog.fours.find((item) => item.name === trimmed)
}

const STANDARD_FIVE_ELEMENTS: Readonly<Record<string, string>> = {
  梦见月瑞希: '风',
  迪希雅: '火',
  提纳里: '草',
  刻晴: '雷',
  莫娜: '水',
  七七: '冰',
  迪卢克: '火',
  琴: '风',
}

export function characterElement(catalog: CharacterCatalog, name: string): string {
  const trimmed = name.trim()
  return findFive(catalog, trimmed)?.element ?? findFour(catalog, trimmed)?.element ?? STANDARD_FIVE_ELEMENTS[trimmed] ?? ''
}

export function fiveHint(catalog: CharacterCatalog, name: string): { tone: 'idle' | 'match' | 'miss'; text: string } {
  const trimmed = name.trim()
  if (!trimmed) {
    return { tone: 'idle', text: '角色名是主键。填入已有五星后，会带上唯一对应的活动名称、称号和元素。' }
  }
  const profile = findFive(catalog, trimmed)
  if (profile) {
    return {
      tone: 'match',
      text: `${profile.name} 对应 ${profile.eventName} · ${profile.title} · ${profile.element}`,
    }
  }
  return { tone: 'miss', text: `还没有「${trimmed}」的五星记录。请先在下方添加，同一个角色名不能重复。` }
}

export function fourHint(catalog: CharacterCatalog, name: string): { tone: 'idle' | 'match' | 'miss'; text: string } {
  const trimmed = name.trim()
  if (!trimmed) {
    return { tone: 'idle', text: '四星角色名对应唯一的称号和元素。' }
  }
  const profile = findFour(catalog, trimmed)
  if (profile) {
    return { tone: 'match', text: `${profile.name} 对应 ${profile.title} · ${profile.element}` }
  }
  return { tone: 'miss', text: `「${trimmed}」还没有称号。在上面补上称号和元素后保存即可，不必先删除。` }
}

export function addFiveProfile(
  catalog: CharacterCatalog,
  input: FiveProfile,
): { ok: true; catalog: CharacterCatalog } | { ok: false; error: string } {
  const profile = {
    name: input.name.trim(),
    eventName: input.eventName.trim(),
    title: input.title.trim(),
    element: input.element.trim(),
  }
  if (!profile.name || !profile.eventName || !profile.title || !profile.element) {
    return { ok: false, error: '活动名称、角色名称、称号和元素都要填写' }
  }
  const taken = nameTaken(catalog, profile.name)
  if (taken) return { ok: false, error: taken }
  return { ok: true, catalog: { ...catalog, fives: [...catalog.fives, profile] } }
}

export function addFourProfile(
  catalog: CharacterCatalog,
  input: FourProfile,
): { ok: true; catalog: CharacterCatalog } | { ok: false; error: string } {
  const profile = {
    name: input.name.trim(),
    title: input.title.trim(),
    element: input.element.trim(),
  }
  if (!profile.name || !profile.title || !profile.element) {
    return { ok: false, error: '角色名称、称号和元素都要填写' }
  }
  const taken = nameTaken(catalog, profile.name)
  if (taken) return { ok: false, error: taken }
  return { ok: true, catalog: { ...catalog, fours: [...catalog.fours, profile] } }
}

function nameTaken(catalog: CharacterCatalog, name: string): string | null {
  const five = findFive(catalog, name)
  if (five) return `${name} 已经对应 ${five.eventName} · ${five.title} · ${five.element}`
  const four = findFour(catalog, name)
  if (four) return `${name} 已经对应 ${four.title} · ${four.element}`
  return null
}

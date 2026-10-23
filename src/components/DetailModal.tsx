import { useState } from 'react'
import {
  FOUR_STAR_WEAPONS,
  STANDARD_FIVE_STARS,
  THREE_STAR_WEAPONS,
  defaultPool,
  fourStarRoster,
  rosterNameConflict,
} from '../data/banner.ts'
import { ELEMENTS, addFiveProfile, findFive, findFour, fiveHint, fourHint } from '../data/catalog.ts'
import { deleteCharacter, deleteWeapon, registerFourCharacter, restoreCharacter } from '../data/roster.ts'
import { weaponRarityOf } from '../data/weapons.ts'
import type { CharacterCatalog, PoolConfig, RosterEdits, WeaponPoolConfig } from '../lib/types.ts'
import { Modal } from './Modal.tsx'
import { PortraitUpload } from './PortraitUpload.tsx'

type Row = { name: string; type: string; up?: boolean }

function byFirstCharacterPinyin(left: string, right: string): number {
  const first = left.trim().charAt(0).localeCompare(right.trim().charAt(0), 'zh-CN')
  if (first !== 0) return first
  return left.localeCompare(right, 'zh-CN')
}

function LimitedFiveField({
  value,
  names,
  listId,
  onChange,
}: {
  value: string
  names: readonly string[]
  listId: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="combo">
      <input
        value={value}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={listId}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      />
      {open && names.length > 0 && (
        <ul className="combo-list" id={listId} role="listbox">
          {names.map((name) => (
            <li key={name} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={name === value}
                onMouseDown={(event) => {
                  event.preventDefault()
                  onChange(name)
                  setOpen(false)
                }}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function NameTable({ heading, tone, rows }: { heading: string; tone: string; rows: Row[] }) {
  const paired: (Row | null)[][] = []
  for (let index = 0; index < rows.length; index += 2) {
    paired.push([rows[index] ?? null, rows[index + 1] ?? null])
  }
  return (
    <section className="pool-block">
      <h3 className={`pool-heading tone-${tone}`}>{heading}</h3>
      <table>
        <tbody>
          {paired.map((pair, index) => (
            <tr key={`${pair[0]?.name ?? 'x'}-${index}`}>
              {pair.map((cell, cellIndex) =>
                cell ? (
                  <td key={`${cell.name}-${cellIndex}`} colSpan={1}>
                    <span className="cell-type">{cell.type}</span>
                    <span className="cell-name">
                      {cell.name}
                      {cell.up && <i className="up-badge">UP!</i>}
                    </span>
                  </td>
                ) : (
                  <td key={`empty-${cellIndex}`} />
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export function DetailModal({
  pool,
  catalog,
  edits,
  weaponPool,
  onClose,
  onSave,
  onCatalog,
  onEdits,
}: {
  pool: PoolConfig
  catalog: CharacterCatalog
  edits: RosterEdits
  weaponPool: WeaponPoolConfig
  onClose: () => void
  onSave: (pool: PoolConfig) => void
  onCatalog: (catalog: CharacterCatalog) => void
  onEdits: (edits: RosterEdits) => void
}) {
  const [draft, setDraft] = useState(pool)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [editingFour, setEditingFour] = useState<[boolean, boolean, boolean]>([false, false, false])
  const [star, setStar] = useState<4 | 5>(5)
  const [adding, setAdding] = useState({ eventName: '', name: '', title: '', element: '冰' })
  const [addError, setAddError] = useState('')
  const [addNote, setAddNote] = useState('')
  const [removingCharacter, setRemovingCharacter] = useState('')
  const [removingWeapon, setRemovingWeapon] = useState('')
  const [removeError, setRemoveError] = useState('')
  const [removeNote, setRemoveNote] = useState('')

  const upNames = new Set(draft.upFours.map((item) => item.name.trim()).filter(Boolean))
  const removedCharacters = new Set(edits.removedCharacters)
  const roster = fourStarRoster(catalog.fours.map((item) => item.name)).filter((name) => !removedCharacters.has(name))
  const fiveRows: Row[] = [
    { name: draft.upFive.name.trim() || '（未填写）', type: '角色', up: true },
    ...STANDARD_FIVE_STARS.filter((name) => name !== draft.upFive.name.trim() && !removedCharacters.has(name)).map((name) => ({
      name,
      type: '角色',
    })),
  ]
  const fourCharRows: Row[] = [
    ...draft.upFours.map((item) => ({ name: item.name.trim() || '（未填写）', type: '角色', up: true })),
    ...roster.filter((name) => !upNames.has(name)).map((name) => ({ name, type: '角色' })),
  ]
  const removedWeapons = new Set(edits.removedWeapons)
  const fourWeaponRows = [
    ...FOUR_STAR_WEAPONS.filter((name) => !removedWeapons.has(name)),
    ...edits.addedWeapons.filter((item) => item.rarity === 4).map((item) => item.name),
  ].map((name) => ({ name, type: '武器' }))
  const threeRows = [
    ...THREE_STAR_WEAPONS.filter((name) => !removedWeapons.has(name)),
    ...edits.addedWeapons.filter((item) => item.rarity === 3).map((item) => item.name),
  ].map((name) => ({ name, type: '武器' }))
  const fiveProfile = findFive(catalog, draft.upFive.name)
  const fiveNote = fiveHint(catalog, draft.upFive.name)
  const limitedFives = catalog.fives
    .map((item) => item.name)
    .filter((name) => !removedCharacters.has(name))
    .sort(byFirstCharacterPinyin)
  const fourNames = fourStarRoster(catalog.fours.map((item) => item.name)).sort(byFirstCharacterPinyin)

  const applyFiveName = (value: string) => {
    setSaved(false)
    const profile = findFive(catalog, value)
    if (profile) {
      setDraft({
        ...draft,
        eventName: profile.eventName,
        upFive: { name: value, title: profile.title, element: profile.element },
      })
      return
    }
    setDraft({ ...draft, upFive: { ...draft.upFive, name: value } })
  }

  const updateFour = (index: 0 | 1 | 2, field: 'name' | 'title' | 'element', value: string) => {
    setSaved(false)
    if (field === 'name') {
      setEditingFour((current) => {
        const next = [...current] as [boolean, boolean, boolean]
        next[index] = false
        return next
      })
    }
    setDraft((current) => {
      const upFours = [...current.upFours] as PoolConfig['upFours']
      if (field === 'name') {
        const profile = findFour(catalog, value)
        upFours[index] = profile
          ? { name: value, title: profile.title, element: profile.element }
          : { name: value, title: '', element: '' }
      } else {
        upFours[index] = { ...upFours[index], [field]: value }
      }
      return { ...current, upFours }
    })
  }

  const save = () => {
    const five = findFive(catalog, draft.upFive.name)
    if (!five) {
      setError('五星 UP 要使用角色记录里的名字。角色名会带上唯一的活动、称号和元素。')
      setSaved(false)
      return
    }
    let nextCatalog = catalog
    let nextEdits = edits
    const fours = []
    for (const [index, item] of draft.upFours.entries()) {
      const existing = findFour(nextCatalog, item.name)
      if (existing) {
        const title = editingFour[index] ? item.title.trim() : existing.title
        const element = editingFour[index] ? item.element.trim() : existing.element
        if (title !== existing.title || element !== existing.element) {
          const registered = registerFourCharacter(nextEdits, nextCatalog, { name: existing.name, title, element })
          if (!registered.ok) {
            setError(registered.error)
            setSaved(false)
            return
          }
          nextCatalog = registered.catalog
          nextEdits = registered.edits
          const profile = findFour(nextCatalog, existing.name)
          if (!profile) {
            setError('四星 UP 要填写角色名、称号和元素。')
            setSaved(false)
            return
          }
          fours.push(profile)
        } else {
          fours.push(existing)
          nextEdits = restoreCharacter(nextEdits, existing.name)
        }
        continue
      }
      const registered = registerFourCharacter(nextEdits, nextCatalog, item)
      if (!registered.ok) {
        setError(registered.error)
        setSaved(false)
        return
      }
      nextCatalog = registered.catalog
      nextEdits = registered.edits
      const profile = findFour(nextCatalog, item.name)
      if (!profile) {
        setError('四星 UP 要填写角色名、称号和元素。')
        setSaved(false)
        return
      }
      fours.push(profile)
    }
    const names = fours.map((item) => item.name)
    if (new Set(names).size !== 3) {
      setError('三个四星 UP 需要是不同角色')
      setSaved(false)
      return
    }
    const next: PoolConfig = {
      eventName: five.eventName,
      upFive: { name: five.name, title: five.title, element: five.element },
      upFours: fours.map((item) => ({
        name: item?.name ?? '',
        title: item?.title ?? '',
        element: item?.element ?? '',
      })) as PoolConfig['upFours'],
    }
    setDraft(next)
    setEditingFour([false, false, false])
    setError('')
    setSaved(true)
    if (nextCatalog !== catalog) onCatalog(nextCatalog)
    if (nextEdits !== edits) onEdits(nextEdits)
    onSave(next)
  }

  const addCharacter = () => {
    if (weaponRarityOf(adding.name, edits) !== null) {
      setAddError(`${adding.name.trim()} 已经是武器名`)
      setAddNote('')
      return
    }
    const conflict = rosterNameConflict(adding.name, star)
    if (conflict) {
      setAddError(conflict)
      setAddNote('')
      return
    }
    if (star === 5) {
      const added = addFiveProfile(catalog, adding)
      if (!added.ok) {
        setAddError(added.error)
        setAddNote('')
        return
      }
      onCatalog(added.catalog)
      setAddNote(`已添加五星「${adding.name.trim()}」。在上方五星 UP 填这个名字，就会换成 ${adding.eventName.trim()} · ${adding.title.trim()} · ${adding.element.trim()}。立绘以后按这个名字放进 portraits-src。`)
    } else {
      const added = registerFourCharacter(edits, catalog, adding)
      if (!added.ok) {
        setAddError(added.error)
        setAddNote('')
        return
      }
      onCatalog(added.catalog)
      onEdits(added.edits)
      const saved = findFour(added.catalog, adding.name)
      const name = saved?.name ?? adding.name.trim()
      const title = saved?.title ?? adding.title.trim()
      const element = saved?.element ?? adding.element.trim()
      setAddNote(
        added.updated && added.restored
          ? `四星「${name}」已回到卡池，称号改为 ${title} · ${element}。`
          : added.updated
            ? `已把四星「${name}」的称号改为 ${title} · ${element}。`
            : added.restored
              ? `四星「${name}」已回到卡池，称号是 ${title} · ${element}。`
              : `已登记四星「${name}」，对应 ${title} · ${element}。可以选为 UP，没被选中时仍留在四星角色池。`,
      )
    }
    setAddError('')
    setAdding({ eventName: '', name: '', title: '', element: adding.element })
  }

  const removeNamedCharacter = () => {
    const result = deleteCharacter(edits, catalog, pool, catalog.fours.map((item) => item.name), removingCharacter)
    if (!result.ok) {
      setRemoveError(result.error)
      setRemoveNote('')
      return
    }
    onEdits(result.edits)
    onCatalog(result.catalog)
    setRemoveError('')
    setRemoveNote(`已从卡池删除角色「${removingCharacter.trim()}」。两个祈愿池都不会再抽到。`)
    setRemovingCharacter('')
  }

  const removeNamedWeapon = () => {
    const result = deleteWeapon(edits, weaponPool, removingWeapon)
    if (!result.ok) {
      setRemoveError(result.error)
      setRemoveNote('')
      return
    }
    onEdits(result.edits)
    setRemoveError('')
    setRemoveNote(`已从卡池删除武器「${removingWeapon.trim()}」。角色池和武器池都不再出现它。`)
    setRemovingWeapon('')
  }

  return (
    <Modal title={`「${pool.eventName}」活动祈愿`} wide onClose={onClose}>
      <section className="rules">
        <h3>祈愿规则</h3>
        <p>资源无限，不消耗纠缠之缘。单抽与十连都逐抽结算，保底在两次祈愿之间延续。</p>
        <ul>
          <li>五星基础概率 0.600%。第 74 抽起每抽提高 6 个百分点，第 90 抽必出。含保底的综合概率约为 1.600%。</li>
          <li>非大保底时，五星有 50% 基础概率是本期 UP。若歪了，下一发五星必定是 UP。</li>
          <li>非大保底抽到五星时，另有约 3% 概率触发捕获明光（对应基础概率 0.018%），直接获得 UP。捕获明光不消耗、也不替代大保底。</li>
          <li>若连续三次都是先歪、再靠大保底才拿到 UP，下一发五星必定触发捕获明光。</li>
          <li>四星基础概率 5.100%，第 9 抽提升到 56.1%，第 10 抽必出四星或以上（此时若五星仍是基础概率，则约 99.4% 为四星、0.6% 为五星）。综合概率约为 13%。</li>
          <li>四星有 50% 概率是三名 UP 之一，三人平分。若不是，下一件四星必定是 UP。歪掉的一半里，角色与武器各占一半。</li>
          <li>获得四星或五星都会重置「十抽内必出四星或以上」的计数。三星只出武器。</li>
          <li>角色第一次获得是 0 命，重复获得升一命，6 命封顶。五星超过 6 命时，额外得到一枚无主的命星。</li>
        </ul>
      </section>

      <section className="editor">
        <h3>修改本期 UP</h3>
        <p className="fine">角色名是主键。五星和四星都可以从列表选择，也可以自己输入。还没有称号的四星，补上称号和元素后直接保存，不必先删除。称号写错时，点「修改称号」改正后再保存。保底、历史和仓库不会被清空。</p>
        <div className="editor-grid">
          <label>
            活动名称
            <input value={fiveProfile ? fiveProfile.eventName : draft.eventName} disabled={Boolean(fiveProfile)} onChange={(event) => { setSaved(false); setDraft({ ...draft, eventName: event.target.value }) }} />
          </label>
          <label>
            五星 UP
            <LimitedFiveField listId="limited-five-list" value={draft.upFive.name} names={limitedFives} onChange={applyFiveName} />
          </label>
          <label>
            称号
            <input value={fiveProfile ? fiveProfile.title : draft.upFive.title} disabled={Boolean(fiveProfile)} onChange={(event) => { setSaved(false); setDraft({ ...draft, upFive: { ...draft.upFive, title: event.target.value } }) }} />
          </label>
          <label>
            元素
            <input value={fiveProfile ? fiveProfile.element : draft.upFive.element} disabled={Boolean(fiveProfile)} onChange={(event) => { setSaved(false); setDraft({ ...draft, upFive: { ...draft.upFive, element: event.target.value } }) }} />
          </label>
          <p className={`field-hint hint-${fiveNote.tone}`}>{fiveNote.text}</p>
          <PortraitUpload name={draft.upFive.name} />
          {draft.upFours.map((item, index) => {
            const profile = findFour(catalog, item.name)
            const editing = editingFour[index] === true
            const locked = Boolean(profile) && !editing
            const note = fourHint(catalog, item.name)
            return (
              <div className="four-edit" key={index}>
                <label>
                  四星 UP {index + 1}
                  <LimitedFiveField listId={`four-name-${index}`} value={item.name} names={fourNames} onChange={(value) => updateFour(index as 0 | 1 | 2, 'name', value)} />
                </label>
                <label>
                  称号
                  <input value={locked ? profile?.title ?? '' : item.title} disabled={locked} onChange={(event) => updateFour(index as 0 | 1 | 2, 'title', event.target.value)} />
                </label>
                <label>
                  元素
                  <input value={locked ? profile?.element ?? '' : item.element} disabled={locked} onChange={(event) => updateFour(index as 0 | 1 | 2, 'element', event.target.value)} />
                </label>
                {profile && !editing && (
                  <button
                    type="button"
                    className="text-btn edit-title"
                    onClick={() => {
                      setSaved(false)
                      setDraft((current) => {
                        const upFours = [...current.upFours] as PoolConfig['upFours']
                        upFours[index] = { name: profile.name, title: profile.title, element: profile.element }
                        return { ...current, upFours }
                      })
                      setEditingFour((current) => {
                        const next = [...current] as [boolean, boolean, boolean]
                        next[index] = true
                        return next
                      })
                    }}
                  >
                    修改称号
                  </button>
                )}
                <p className={`field-hint hint-${note.tone}`}>{editing ? '改完后点保存卡池，称号和元素会更新。角色名不变。' : note.text}</p>
              </div>
            )
          })}
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="editor-actions">
          <button type="button" className="text-btn solid" onClick={save}>
            {saved ? '已保存' : '保存卡池'}
          </button>
          <button
            type="button"
            className="text-btn"
            onClick={() => {
              setDraft(defaultPool)
              setError('')
              setSaved(true)
              onSave(defaultPool)
            }}
          >
            恢复默认
          </button>
        </div>
      </section>

      <section className="editor">
        <h3>添加角色</h3>
        <p className="fine">新角色按名字登记一次。五星要填活动名称，四星不用。已有四星也可以在这里补称号；如果之前被删掉了，补上后会回到卡池。五星也可以在上面直接上传立绘。自带立绘仍按角色名放在 portraits-src，上传的图片不能把它删掉。</p>
        <div className="seg add-star">
          <button type="button" className={star === 5 ? 'on' : ''} onClick={() => { setStar(5); setAddError(''); setAddNote('') }}>
            五星
          </button>
          <button type="button" className={star === 4 ? 'on' : ''} onClick={() => { setStar(4); setAddError(''); setAddNote('') }}>
            四星
          </button>
        </div>
        <div className="editor-grid add-grid">
          {star === 5 && (
            <label>
              活动名称
              <input value={adding.eventName} onChange={(event) => setAdding({ ...adding, eventName: event.target.value })} />
            </label>
          )}
          <label>
            角色名称
            <input value={adding.name} onChange={(event) => setAdding({ ...adding, name: event.target.value })} />
          </label>
          <label>
            称号
            <input value={adding.title} onChange={(event) => setAdding({ ...adding, title: event.target.value })} />
          </label>
          <label>
            元素
            <select value={adding.element} onChange={(event) => setAdding({ ...adding, element: event.target.value })}>
              {ELEMENTS.map((element) => (
                <option key={element} value={element}>{element}</option>
              ))}
            </select>
          </label>
        </div>
        {addError && <p className="form-error">{addError}</p>}
        {addNote && <p className="field-hint hint-match">{addNote}</p>}
        <div className="editor-actions">
          <button type="button" className="text-btn solid" onClick={addCharacter}>
            添加角色
          </button>
        </div>
        <ul className="profile-list">
          {catalog.fives.map((item) => (
            <li key={`5-${item.name}`}>
              <b>{item.name}</b>
              <span>五星 · {item.eventName} · {item.title} · {item.element}</span>
            </li>
          ))}
          {catalog.fours.map((item) => (
            <li key={`4-${item.name}`}>
              <b>{item.name}</b>
              <span>四星 · {item.title} · {item.element}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="editor">
        <h3>删除角色或武器</h3>
        <p className="fine">按名字从卡池名单里移除。正在作为任一卡池 UP 的名字要先换掉。角色池和武器池共用四星角色、四星武器和三星武器名单。</p>
        <div className="editor-grid">
          <label>
            角色名称
            <input value={removingCharacter} onChange={(event) => setRemovingCharacter(event.target.value)} />
          </label>
          <label>
            武器名称
            <input value={removingWeapon} onChange={(event) => setRemovingWeapon(event.target.value)} />
          </label>
        </div>
        {removeError && <p className="form-error">{removeError}</p>}
        {removeNote && <p className="field-hint hint-match">{removeNote}</p>}
        <div className="editor-actions">
          <button type="button" className="text-btn" onClick={removeNamedCharacter}>删除角色</button>
          <button type="button" className="text-btn" onClick={removeNamedWeapon}>删除武器</button>
        </div>
      </section>

      <NameTable heading="5星物品  基础出率 0.600%（含保底综合出率 1.600%）" tone="gold" rows={fiveRows} />
      <NameTable heading="4星角色  基础出率 2.550%，与武器合计 5.100%" tone="purple" rows={fourCharRows} />
      <NameTable heading="4星武器  基础出率 2.550%" tone="purple" rows={fourWeaponRows} />
      <NameTable heading="3星武器  基础出率 94.300%（含保底综合出率 85.400%）" tone="blue" rows={threeRows} />
    </Modal>
  )
}

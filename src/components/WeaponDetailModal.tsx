import { useState } from 'react'
import { addWeapon, deleteWeapon } from '../data/roster.ts'
import {
  WEAPON_TYPES,
  buildWeaponPool,
  selectableFiveWeapons,
  selectableFourWeapons,
  threeStarWeapons,
  weaponPoolNote,
} from '../data/weapons.ts'
import type { CharacterCatalog, RosterEdits, WeaponPoolConfig } from '../lib/types.ts'
import { Modal } from './Modal.tsx'

function WeaponNameField({
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
                <small>{weaponPoolNote(name)}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function namesOf(config: WeaponPoolConfig): string[] {
  return [...config.upFives, ...config.upFours]
}

export function WeaponDetailModal({
  pool,
  edits,
  catalog,
  fourCharacters,
  onClose,
  onSave,
  onEdits,
}: {
  pool: WeaponPoolConfig
  edits: RosterEdits
  catalog: CharacterCatalog
  fourCharacters: readonly string[]
  onClose: () => void
  onSave: (pool: WeaponPoolConfig) => void
  onEdits: (edits: RosterEdits) => void
}) {
  const [draft, setDraft] = useState(pool)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [adding, setAdding] = useState({ name: '', rarity: 5 as 3 | 4 | 5 })
  const [removing, setRemoving] = useState('')
  const [listError, setListError] = useState('')
  const [listNote, setListNote] = useState('')
  const [pending, setPending] = useState<WeaponPoolConfig | null>(null)

  const resolved = buildWeaponPool(draft, edits, fourCharacters)
  const fiveNames = selectableFiveWeapons(edits)
  const fourNames = selectableFourWeapons(edits)
  const setFive = (index: 0 | 1, value: string) => {
    setSaved(false)
    const upFives = [...draft.upFives] as WeaponPoolConfig['upFives']
    upFives[index] = value
    const charted = draft.charted && upFives.includes(draft.charted) ? draft.charted : null
    setDraft({ ...draft, upFives, charted })
  }
  const setFour = (index: number, value: string) => {
    setSaved(false)
    const upFours = [...draft.upFours] as WeaponPoolConfig['upFours']
    upFours[index] = value
    setDraft({ ...draft, upFours })
  }

  const save = () => {
    const upFives = draft.upFives.map((name) => name.trim())
    const upFours = draft.upFours.map((name) => name.trim())
    if (!draft.eventName.trim() || upFives.some((name) => !name) || upFours.some((name) => !name)) {
      setError('活动名和 UP 武器名都不能为空')
      setSaved(false)
      return
    }
    if (new Set(upFives).size !== 2 || new Set(upFours).size !== 5) {
      setError('UP 武器不能重名')
      setSaved(false)
      return
    }
    const fiveChoices = new Set(selectableFiveWeapons(edits))
    const fourChoices = new Set(selectableFourWeapons(edits))
    if (upFives.some((name) => !fiveChoices.has(name))) {
      setError('五星 UP 要使用武器名单里的名字。常驻和限定都可以，不在名单里的请先在下面添加。')
      setSaved(false)
      return
    }
    if (upFours.some((name) => !fourChoices.has(name))) {
      setError('四星 UP 要使用常驻或限定四星的名字。不在名单里的请先在下面添加。')
      setSaved(false)
      return
    }
    const next: WeaponPoolConfig = {
      eventName: draft.eventName.trim(),
      upFives: upFives as WeaponPoolConfig['upFives'],
      upFours: upFours as WeaponPoolConfig['upFours'],
      charted: draft.charted && upFives.includes(draft.charted) ? draft.charted : null,
    }
    if (next.charted !== pool.charted) {
      setError('')
      setPending(next)
      return
    }
    apply(next)
  }

  const apply = (next: WeaponPoolConfig) => {
    const picked = new Set([...next.upFives, ...next.upFours])
    const removedWeapons = edits.removedWeapons.filter((name) => !picked.has(name))
    if (removedWeapons.length !== edits.removedWeapons.length) onEdits({ ...edits, removedWeapons })
    setDraft(next)
    setPending(null)
    setError('')
    setSaved(true)
    onSave(next)
  }

  const add = () => {
    const result = addWeapon(edits, catalog, adding.name, adding.rarity)
    if (!result.ok) {
      setListError(result.error)
      setListNote('')
      return
    }
    const restored = edits.removedWeapons.includes(adding.name.trim())
    onEdits(result.edits)
    setListError('')
    setListNote(
      restored
        ? `「${adding.name.trim()}」已回到武器池，角色池里对应星级的武器也会重新出现。`
        : `已添加${adding.rarity}星武器「${adding.name.trim()}」。五星进入歪池，四星和三星会同时出现在角色池。`,
    )
    setAdding({ ...adding, name: '' })
  }

  const remove = () => {
    const result = deleteWeapon(edits, draft, removing)
    if (!result.ok) {
      setListError(result.error)
      setListNote('')
      return
    }
    onEdits(result.edits)
    setListError('')
    setListNote(`已删除武器「${removing.trim()}」。`)
    setRemoving('')
  }

  return (
    <Modal title={`「${pool.eventName}」武器祈愿`} wide onClose={onClose}>
      <section className="rules">
        <h3>祈愿规则</h3>
        <p>武器池和角色池的保底分开计算，互不影响。资源无限。</p>
        <ul>
          <li>五星基础概率 0.700%，第 63 抽起每抽提高 7 个百分点，最迟第 80 抽必出。含保底的综合概率约为 1.850%。</li>
          <li>抽到五星时，有 75% 概率是两件 UP 武器之一，两件概率相同。若不是，下一把五星必定是 UP。</li>
          <li>可以给一件五星 UP 定轨，定轨前会先询问。没有定轨时不累积命定值。定轨后，抽到的五星只要不是这件武器，历史记为「歪」，并获得 1 点命定值。满 1 点时下一把五星必定是它。抽到定轨武器后命定值归零。</li>
          <li>更换或取消定轨时，会先询问，命定值归零。</li>
          <li>四星基础概率 6.000%。第 10 抽必出四星或以上；若五星仍是基础概率，则约 99.3% 为四星、0.7% 为五星。综合概率约为 14.500%。</li>
          <li>抽到四星时，有 75% 概率是五件 UP 武器之一。若不是，下一件四星必定是 UP 武器。落空的一半里，四星角色与非 UP 四星武器各占一半。</li>
          <li>限定 UP 武器不会进入常驻歪池。其余四星角色、四星武器和三星武器与角色池同一份名单。</li>
        </ul>
      </section>

      <section className="editor">
        <h3>修改本期 UP</h3>
        <p className="fine">两件五星、五件四星。五星可以从常驻和限定里选，也可以自己输入名单里已有的名字，下拉按名字第一个字的拼音排序。四星可以选常驻，也可以选只在武器池 UP 出现的限定四星。不在名单里的武器要先在下面添加。定轨只能选当前的五星 UP。这里改动定轨时会先询问，确认后才清空命定值。</p>
        <div className="editor-grid">
          <label>
            活动名称
            <input value={draft.eventName} onChange={(event) => { setSaved(false); setDraft({ ...draft, eventName: event.target.value }) }} />
          </label>
          <label>
            定轨
            <select
              value={draft.charted ?? ''}
              onChange={(event) => {
                setSaved(false)
                setDraft({ ...draft, charted: event.target.value || null })
              }}
            >
              <option value="">不定轨</option>
              {draft.upFives.map((name) => (
                <option key={name} value={name.trim()}>{name.trim() || '（未填写）'}</option>
              ))}
            </select>
          </label>
          {draft.upFives.map((name, index) => (
            <label key={`five-${index}`}>
              五星 UP {index + 1}
              <WeaponNameField listId={`weapon-five-${index}`} names={fiveNames} value={name} onChange={(value) => setFive(index as 0 | 1, value)} />
              {weaponPoolNote(name) && <span className="field-hint hint-match">{weaponPoolNote(name)}</span>}
            </label>
          ))}
          {draft.upFours.map((name, index) => (
            <label key={`four-${index}`}>
              四星 UP {index + 1}
              <WeaponNameField listId={`weapon-four-${index}`} names={fourNames} value={name} onChange={(value) => setFour(index, value)} />
              {weaponPoolNote(name) && <span className="field-hint hint-match">{weaponPoolNote(name)}</span>}
            </label>
          ))}
        </div>
        {error && <p className="form-error">{error}</p>}
        {pending && (
          <p className="fine">
            定轨将从「{pool.charted ?? '不定轨'}」改为「{pending.charted ?? '不定轨'}」。命定值会归零。确定保存吗？
          </p>
        )}
        <div className="editor-actions">
          {pending ? (
            <>
              <button type="button" className="text-btn solid" onClick={() => apply(pending)}>确定保存</button>
              <button type="button" className="text-btn" onClick={() => setPending(null)}>先不改</button>
            </>
          ) : (
            <button type="button" className="text-btn solid" onClick={save}>{saved ? '已保存' : '保存武器池'}</button>
          )}
        </div>
      </section>

      <section className="editor">
        <h3>添加或删除武器</h3>
        <p className="fine">添加时要写名称和星级。同名武器不能重复。正在作为 UP 的武器要先换掉才能删除。</p>
        <div className="editor-grid">
          <label>
            武器名称
            <input value={adding.name} onChange={(event) => setAdding({ ...adding, name: event.target.value })} />
          </label>
          <label>
            星级
            <select value={adding.rarity} onChange={(event) => setAdding({ ...adding, rarity: Number(event.target.value) as 3 | 4 | 5 })}>
              <option value={5}>五星</option>
              <option value={4}>四星</option>
              <option value={3}>三星</option>
            </select>
          </label>
          <label>
            删除武器
            <input value={removing} onChange={(event) => setRemoving(event.target.value)} />
          </label>
        </div>
        {listError && <p className="form-error">{listError}</p>}
        {listNote && <p className="field-hint hint-match">{listNote}</p>}
        <div className="editor-actions">
          <button type="button" className="text-btn solid" onClick={add}>添加武器</button>
          <button type="button" className="text-btn" onClick={remove}>删除武器</button>
        </div>
      </section>

      <section className="editor">
        <h3>当前名单</h3>
        <ul className="profile-list">
          {namesOf(draft).map((name) => (
            <li key={`up-${name}`}>
              <b>{name}</b>
              <span>UP{WEAPON_TYPES[name] ? ` · ${WEAPON_TYPES[name]}` : ''}</span>
            </li>
          ))}
          {resolved.standardFives.map((name) => (
            <li key={`std-${name}`}><b>{name}</b><span>五星常驻</span></li>
          ))}
          {resolved.offBannerWeapons.map((name) => (
            <li key={`four-${name}`}><b>{name}</b><span>四星武器{WEAPON_TYPES[name] ? ` · ${WEAPON_TYPES[name]}` : ''}</span></li>
          ))}
          {threeStarWeapons(edits).map((name) => (
            <li key={`three-${name}`}><b>{name}</b><span>三星武器</span></li>
          ))}
        </ul>
      </section>
    </Modal>
  )
}

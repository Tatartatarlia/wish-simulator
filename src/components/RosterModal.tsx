import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ELEMENTS, characterElement } from '../data/catalog.ts'
import { refinementStacks } from '../lib/gacha.ts'
import type { CharacterCatalog, OwnedCharacter, OwnedWeapon, WishState } from '../lib/types.ts'
import { Modal } from './Modal.tsx'

function byConstellation(left: OwnedCharacter, right: OwnedCharacter): number {
  if (right.constellation !== left.constellation) return right.constellation - left.constellation
  return left.name.localeCompare(right.name, 'zh')
}

function byName(left: OwnedWeapon, right: OwnedWeapon): number {
  return left.name.localeCompare(right.name, 'zh')
}

const idPhotoExtensions = ['webp', 'png'] as const

function idPhotoUrl(name: string, extension: (typeof idPhotoExtensions)[number]): string {
  return `${import.meta.env.BASE_URL}id-photos/${encodeURIComponent(name)}.${extension}`
}

function CharacterIdPhoto({ name }: { name: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let index = 0
    const image = new Image()
    const tryNext = () => {
      const extension = idPhotoExtensions[index]
      if (!extension) {
        if (!cancelled) setSrc(null)
        return
      }
      image.src = idPhotoUrl(name, extension)
    }
    image.onload = () => {
      if (!cancelled) setSrc(image.src)
    }
    image.onerror = () => {
      index += 1
      tryNext()
    }
    tryNext()
    return () => {
      cancelled = true
    }
  }, [name])

  if (!src) return null
  return <img className="id-face" src={src} alt="" />
}

function CharacterGrid({ characters, catalog }: { characters: OwnedCharacter[]; catalog: CharacterCatalog }) {
  if (characters.length === 0) return <p className="empty">还没有抽到。</p>
  return (
    <div className="roster-grid roster-characters">
      {characters.map((character) => {
        const element = characterElement(catalog, character.name)
        return (
          <article
            key={character.name}
            className={`roster-card roster-character rarity-${character.rarity}`}
            aria-label={character.constellation > 0 ? `${character.name} ${character.constellation}命` : character.name}
          >
            <div className={`id-photo rarity-${character.rarity}`}>
              <CharacterIdPhoto name={character.name} />
              {(ELEMENTS as readonly string[]).includes(element) && (
                <img className="id-element" src={`${import.meta.env.BASE_URL}elements/${encodeURIComponent(element)}元素.png`} alt="" />
              )}
              {character.constellation > 0 && (
                <span className={character.constellation === 6 ? 'id-cons id-cons-max' : 'id-cons'}>{character.constellation}</span>
              )}
            </div>
            <h3>{character.name}</h3>
          </article>
        )
      })}
    </div>
  )
}

function WeaponGrid({ weapons }: { weapons: OwnedWeapon[] }) {
  const cards = weapons.flatMap((weapon) =>
    refinementStacks(weapon.copies).map((rank, index) => ({ weapon, rank, index })),
  )
  if (cards.length === 0) return <p className="empty">还没有抽到。</p>
  return (
    <div className="roster-grid">
      {cards.map(({ weapon, rank, index }) => (
        <article key={`${weapon.name}-${index}`} className={`roster-card rarity-${weapon.rarity}`}>
          <div className="stars" aria-label={`${weapon.rarity}星`}>
            {'★'.repeat(weapon.rarity)}
          </div>
          <h3>{weapon.name}</h3>
          <p>
            精炼 <b>精{rank}</b>
            <span> / 5</span>
          </p>
        </article>
      ))}
    </div>
  )
}

function stackCount(weapons: OwnedWeapon[], rarity: 3 | 4 | 5): number {
  return weapons
    .filter((weapon) => weapon.rarity === rarity)
    .reduce((sum, weapon) => sum + refinementStacks(weapon.copies).length, 0)
}

export function RosterModal({
  state,
  catalog,
  onClose,
  onClearCharacters,
  onClearWeapons,
}: {
  state: WishState
  catalog: CharacterCatalog
  onClose: () => void
  onClearCharacters: () => void
  onClearWeapons: () => void
}) {
  const [tab, setTab] = useState<'character' | 'weapon'>('character')
  const [confirming, setConfirming] = useState(false)
  const fives = state.owned.filter((item) => item.rarity === 5).sort(byConstellation)
  const fours = state.owned.filter((item) => item.rarity === 4).sort(byConstellation)
  const weaponFives = state.ownedWeapons.filter((item) => item.rarity === 5).sort(byName)
  const weaponFours = state.ownedWeapons.filter((item) => item.rarity === 4).sort(byName)
  const weaponThrees = state.ownedWeapons.filter((item) => item.rarity === 3).sort(byName)

  return (
    <Modal title="仓库" wide onClose={onClose}>
      <div className="roster-head">
        <div className="seg roster-tabs">
          <button
            type="button"
            className={tab === 'character' ? 'on' : ''}
            onClick={() => {
              setConfirming(false)
              setTab('character')
            }}
          >
            角色
          </button>
          <button
            type="button"
            className={tab === 'weapon' ? 'on' : ''}
            onClick={() => {
              setConfirming(false)
              setTab('weapon')
            }}
          >
            武器
          </button>
        </div>
        <button type="button" className="danger ghost" onClick={() => setConfirming(true)}>
          {tab === 'character' ? '清空角色' : '清空武器'}
        </button>
      </div>
      {tab === 'character' ? (
        <>
          <div className="stat-grid roster-summary">
            <div>
              <b>{fives.length}</b>
              <span>五星角色</span>
            </div>
            <div>
              <b>{fours.length}</b>
              <span>四星角色</span>
            </div>
            <div>
              <b>{state.masterless}</b>
              <span>无主的命星</span>
            </div>
          </div>
          <p className="fine">
            第一次抽到角色是 0 命，重复抽到会升一命，6 命封顶。五星到达 6 命后再抽到该角色，会额外得到一枚无主的命星。四星到 6 命后不再增加。命座大于 0 时，数字标在证件照右上角。证件照按角色名放进 id-photos-src，透明底会落在五星的金色、四星的紫色上；还没有图片时只显示这块底色。
          </p>
          <section className="roster-block">
            <h3>五星</h3>
            <CharacterGrid characters={fives} catalog={catalog} />
          </section>
          <section className="roster-block">
            <h3>四星</h3>
            <CharacterGrid characters={fours} catalog={catalog} />
          </section>
        </>
      ) : (
        <>
          <div className="stat-grid roster-summary">
            <div>
              <b>{stackCount(state.ownedWeapons, 5)}</b>
              <span>五星武器</span>
            </div>
            <div>
              <b>{stackCount(state.ownedWeapons, 4)}</b>
              <span>四星武器</span>
            </div>
            <div>
              <b>{stackCount(state.ownedWeapons, 3)}</b>
              <span>三星武器</span>
            </div>
          </div>
          <p className="fine">
            第一把是精1，重复抽到同一把武器会提高精炼，精5封顶。超过的数量另起一把，例如 2 把苍耀显示精2，7 把苍耀显示 1 把精5、1 把精2。
          </p>
          <section className="roster-block">
            <h3>五星</h3>
            <WeaponGrid weapons={weaponFives} />
          </section>
          <section className="roster-block">
            <h3>四星</h3>
            <WeaponGrid weapons={weaponFours} />
          </section>
          <section className="roster-block">
            <h3>三星</h3>
            <WeaponGrid weapons={weaponThrees} />
          </section>
        </>
      )}
      {confirming &&
        createPortal(
          <div className="chart-ask" role="dialog" aria-modal="true" aria-label="确认清空仓库" onClick={() => setConfirming(false)}>
            <div className="chart-ask-card" onClick={(event) => event.stopPropagation()}>
            <h2>{tab === 'character' ? '清空角色' : '清空武器'}</h2>
            <p>
              {tab === 'character'
                ? '确定清空仓库里的角色吗？角色祈愿的累计抽数、保底、历史记录和无主的命星会一起清掉。反过来，清空角色祈愿历史时，这里的角色也会一起清掉。武器栏和武器祈愿不受影响。'
                : '确定清空仓库里的武器吗？武器祈愿的累计抽数、保底、历史记录和命定值会一起清掉，定轨选择会保留。反过来，清空武器祈愿历史时，这里的武器也会一起清掉。角色栏和角色祈愿不受影响。'}
            </p>
            <div className="chart-ask-actions">
              <button type="button" className="text-btn" onClick={() => setConfirming(false)}>
                先不清
              </button>
              <button
                type="button"
                className="text-btn solid"
                onClick={() => {
                  if (tab === 'character') onClearCharacters()
                  else onClearWeapons()
                  setConfirming(false)
                }}
              >
                确定清空
              </button>
            </div>
            </div>
          </div>,
          document.body,
        )}
    </Modal>
  )
}

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ELEMENTS, characterElement } from '../data/catalog.ts'
import { refinementStacks } from '../lib/gacha.ts'
import type { CharacterCatalog, OwnedCharacter, OwnedWeapon, WishState } from '../lib/types.ts'
import { IdPhotoFace } from './IdPhoto.tsx'
import { Modal } from './Modal.tsx'

function byConstellation(left: OwnedCharacter, right: OwnedCharacter): number {
  if (right.constellation !== left.constellation) return right.constellation - left.constellation
  return left.name.localeCompare(right.name, 'zh')
}

function byName(left: OwnedWeapon, right: OwnedWeapon): number {
  return left.name.localeCompare(right.name, 'zh')
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
              <IdPhotoFace name={character.name} />
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

type WeaponCard = {
  key: string
  weapon: OwnedWeapon
  rank: number
  /** 精5合并后的把数。五星，以及不满精5的卡，不使用。 */
  count: number | null
}

function weaponCards(weapon: OwnedWeapon, grouped: boolean): WeaponCard[] {
  if (!grouped) {
    return refinementStacks(weapon.copies).map((rank, index) => ({
      key: `${weapon.name}-${index}`,
      weapon,
      rank,
      count: null,
    }))
  }
  const total = Math.max(0, Math.floor(weapon.copies))
  const full = Math.floor(total / 5)
  const remainder = total % 5
  const cards: WeaponCard[] = []
  if (full > 0) cards.push({ key: `${weapon.name}-full`, weapon, rank: 5, count: full })
  if (remainder > 0) cards.push({ key: `${weapon.name}-partial`, weapon, rank: remainder, count: null })
  return cards
}

function WeaponGrid({ weapons, grouped = false }: { weapons: OwnedWeapon[]; grouped?: boolean }) {
  const cards = weapons.flatMap((weapon) => weaponCards(weapon, grouped))
  if (cards.length === 0) return <p className="empty">还没有抽到。</p>
  return (
    <div className="roster-grid">
      {cards.map((card) => (
        <article
          key={card.key}
          className={`roster-card rarity-${card.weapon.rarity}`}
          aria-label={card.count === null ? `${card.weapon.name} 精${card.rank}` : `${card.weapon.name} 精5 × ${card.count}`}
        >
          <div className="stars" aria-label={`${card.weapon.rarity}星`}>
            {'★'.repeat(card.weapon.rarity)}
          </div>
          <h3>{card.weapon.name}</h3>
          <p>
            精炼 <b>{card.count === null ? `精${card.rank}` : `精5 × ${card.count}`}</b>
            {card.count === null && <span> / 5</span>}
          </p>
        </article>
      ))}
    </div>
  )
}

function stackCount(weapons: OwnedWeapon[], rarity: 3 | 4 | 5): number {
  return weapons
    .filter((weapon) => weapon.rarity === rarity)
    .reduce((sum, weapon) => sum + weaponCards(weapon, rarity !== 5).length, 0)
}

export function RosterModal({
  state,
  catalog,
  onClose,
  onClear,
  canClear = true,
  hidden = false,
}: {
  state: WishState
  catalog: CharacterCatalog
  onClose: () => void
  onClear: () => void
  canClear?: boolean
  hidden?: boolean
}) {
  const [tab, setTab] = useState<'character' | 'weapon'>('character')
  const [confirming, setConfirming] = useState(false)
  const fives = state.owned.filter((item) => item.rarity === 5).sort(byConstellation)
  const fours = state.owned.filter((item) => item.rarity === 4).sort(byConstellation)
  const weaponFives = state.ownedWeapons.filter((item) => item.rarity === 5).sort(byName)
  const weaponFours = state.ownedWeapons.filter((item) => item.rarity === 4).sort(byName)
  const weaponThrees = state.ownedWeapons.filter((item) => item.rarity === 3).sort(byName)

  return (
    <Modal title="仓库" wide hidden={hidden} onClose={onClose}>
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
        <button type="button" className="danger ghost" onClick={() => setConfirming(true)} disabled={!canClear}>
          清空记录
        </button>
      </div>
      <div hidden={tab !== 'character'}>
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
      </div>
      <div hidden={tab !== 'weapon'}>
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
            第一把是精1，重复抽到同一把武器会提高精炼，精5封顶。五星超过精5就另起一把，例如 7 把苍耀显示 1 把精5、1 把精2。四星和三星的精5合并成一张卡，写明有多少把；不满精5的另外一张。
          </p>
          <section className="roster-block">
            <h3>五星</h3>
            <WeaponGrid weapons={weaponFives} />
          </section>
          <section className="roster-block">
            <h3>四星</h3>
            <WeaponGrid weapons={weaponFours} grouped />
          </section>
          <section className="roster-block">
            <h3>三星</h3>
            <WeaponGrid weapons={weaponThrees} grouped />
          </section>
        </>
      </div>
      {confirming &&
        createPortal(
          <div className="chart-ask" role="dialog" aria-modal="true" aria-label="确认清空仓库" onClick={() => setConfirming(false)}>
            <div className="chart-ask-card" onClick={(event) => event.stopPropagation()}>
            <h2>清空全部记录</h2>
            <p>
              确定从零开始吗？角色祈愿、武器祈愿和常驻祈愿的累计抽数、保底和历史都会重置，命定值和无主的命星归零，仓库里的角色和武器也会全部清掉。卡池配置和定轨选择会保留。
            </p>
            <div className="chart-ask-actions">
              <button type="button" className="text-btn" onClick={() => setConfirming(false)}>
                先不清
              </button>
              <button
                type="button"
                className="text-btn solid"
                onClick={() => {
                  onClear()
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

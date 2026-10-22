import { useState } from 'react'
import { createPortal } from 'react-dom'
import { refinementStacks } from '../lib/gacha.ts'
import type { OwnedCharacter, OwnedWeapon, WishState } from '../lib/types.ts'
import { Modal } from './Modal.tsx'

function byConstellation(left: OwnedCharacter, right: OwnedCharacter): number {
  if (right.constellation !== left.constellation) return right.constellation - left.constellation
  return left.name.localeCompare(right.name, 'zh')
}

function byName(left: OwnedWeapon, right: OwnedWeapon): number {
  return left.name.localeCompare(right.name, 'zh')
}

function CharacterGrid({ characters }: { characters: OwnedCharacter[] }) {
  if (characters.length === 0) return <p className="empty">还没有抽到。</p>
  return (
    <div className="roster-grid">
      {characters.map((character) => (
        <article key={character.name} className={`roster-card rarity-${character.rarity}`}>
          <div className="stars" aria-label={`${character.rarity}星`}>
            {'★'.repeat(character.rarity)}
          </div>
          <h3>{character.name}</h3>
          <p>
            命之座 <b>{character.constellation}</b>
            <span> / 6</span>
          </p>
        </article>
      ))}
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
  onClose,
  onClearCharacters,
  onClearWeapons,
}: {
  state: WishState
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
            第一次抽到角色是 0 命，重复抽到会升一命，6 命封顶。五星到达 6 命后再抽到该角色，会额外得到一枚无主的命星。四星到 6 命后不再增加。
          </p>
          <section className="roster-block">
            <h3>五星</h3>
            <CharacterGrid characters={fives} />
          </section>
          <section className="roster-block">
            <h3>四星</h3>
            <CharacterGrid characters={fours} />
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

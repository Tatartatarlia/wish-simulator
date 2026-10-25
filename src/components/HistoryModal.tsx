import { useState } from 'react'
import { createPortal } from 'react-dom'
import { fiveKindLabel } from '../lib/gacha.ts'
import {
  CHARACTER_UP_EXPECTED,
  CHARACTER_UP_FIRST_EXPECTED,
  characterLuck,
  WEAPON_CHARTED_EXPECTED,
  weaponLuck,
  type LuckReport,
} from '../lib/luck.ts'
import { FATE_MAX } from '../lib/weaponGacha.ts'
import type { StandardWishState, WishState } from '../lib/types.ts'
import { Modal } from './Modal.tsx'

function average(records: { pity: number }[]): string {
  if (records.length === 0) return '—'
  const value = records.reduce((sum, record) => sum + record.pity, 0) / records.length
  return value.toFixed(1)
}

/** 从第 1 抽到最新一条记录的累计抽数，再除以记录条数。 */
function spanAverage(records: { totalPulls: number }[]): string {
  if (records.length === 0) return '—'
  const latest = records.reduce((max, record) => Math.max(max, record.totalPulls), 0)
  return (latest / records.length).toFixed(1)
}

/** 每条记录距离上一条同类记录的抽数。第一条从第 1 抽算起，中间的歪也算在内。 */
function spansSincePrevious(records: { id: number; totalPulls: number }[]): Map<number, number> {
  const sorted = [...records].sort((left, right) => left.totalPulls - right.totalPulls || left.id - right.id)
  const spans = new Map<number, number>()
  let previous = 0
  for (const record of sorted) {
    spans.set(record.id, record.totalPulls - previous)
    previous = record.totalPulls
  }
  return spans
}

function LuckBanner({ report, weapon }: { report: LuckReport | null; weapon: boolean }) {
  const expected = (weapon ? WEAPON_CHARTED_EXPECTED : CHARACTER_UP_EXPECTED).toFixed(1)
  const label = weapon ? '定轨命中平均间隔' : 'UP 平均间隔'
  return (
    <div className={`luck-banner ${report?.side ?? 'even'}`}>
      <b>{report?.title ?? '还不能评级'}</b>
      <span>
        {report
          ? `${label} ${report.average.toFixed(1)} 抽，期望 ${expected} 抽${report.rarity ? `，${report.rarity}` : ''}`
          : weapon
            ? `拿到定轨武器的期望是 ${expected} 抽。有定轨命中之后，会把平均间隔和这个期望比较。`
            : `拿到 UP 角色的期望是 ${expected} 抽。出过 UP 之后，会把平均间隔和这个期望比较。`}
      </span>
    </div>
  )
}

function StandardHistory({
  standard,
  onClose,
  onReset,
  canReset,
}: {
  standard: StandardWishState
  onClose: () => void
  onReset: () => void
  canReset?: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  const golds = standard.records.slice(-200).reverse()
  const starters = standard.starterRecords.slice(-200).reverse()
  const hiddenGold = standard.records.length - golds.length
  const hiddenStarter = standard.starterRecords.length - starters.length

  return (
    <Modal title="常驻祈愿历史" onClose={onClose}>
      <div className="stat-grid">
        <div>
          <b>{standard.totalPulls}</b>
          <span>累计抽数</span>
        </div>
        <div>
          <b>{standard.records.length}</b>
          <span>五星</span>
        </div>
        <div>
          <b>{average(standard.records)}</b>
          <span>出金平均间隔</span>
        </div>
        <div>
          <b>{standard.starterRecords.length}</b>
          <span>御三家</span>
        </div>
        <div>
          <b>{spanAverage(standard.starterRecords)}</b>
          <span>御三家平均间隔</span>
        </div>
        <div>
          <b>{standard.fivePity}</b>
          <span>当前已垫</span>
        </div>
      </div>
      <p className="fine">
        常驻池没有「歪」。出金间隔从上一发五星之后重新计算，第一发则从第 1 抽算起。御三家平均间隔是最新一次御三家的累计抽数除以御三家次数，和五星保底互不影响。清空记录会把角色祈愿、武器祈愿、常驻祈愿和仓库全部重置，命定值和无主的命星归零。卡池配置和定轨选择会保留。
      </p>
      <div className="history-tools">
        <button type="button" className="danger ghost" onClick={() => setConfirming(true)} disabled={canReset === false}>
          清空记录
        </button>
      </div>
      <h3>出金</h3>
      {golds.length === 0 ? (
        <p className="empty">还没有五星。出金后，这里会记下隔了多少抽。</p>
      ) : (
        <ol className="history-list">
          {golds.map((record) => (
            <li key={`gold-${record.id}`} className="history-row plain kind-up">
              <b>
                {record.pity}
                <small>抽</small>
              </b>
              <span className="who">
                {record.name}
                {record.constellation !== undefined && <em className="cons">{record.constellation}命</em>}
              </span>
              <span className="abs">第 {record.totalPulls} 抽</span>
            </li>
          ))}
        </ol>
      )}
      {hiddenGold > 0 && <p className="fine">还有 {hiddenGold} 条更早的出金没有展开，上面的统计仍按全部记录计算。</p>}
      <h3>御三家</h3>
      {starters.length === 0 ? (
        <p className="empty">还没有抽到安柏、凯亚或丽莎。</p>
      ) : (
        <ol className="history-list">
          {starters.map((record) => (
            <li key={`starter-${record.id}`} className="history-row plain">
              <b>
                {record.pity}
                <small>抽</small>
              </b>
              <span className="who">{record.name}</span>
              <span className="abs">第 {record.totalPulls} 抽</span>
            </li>
          ))}
        </ol>
      )}
      {hiddenStarter > 0 && <p className="fine">还有 {hiddenStarter} 条更早的御三家记录没有展开，上面的统计仍按全部记录计算。</p>}
      {confirming &&
        createPortal(
          <div className="chart-ask" role="dialog" aria-modal="true" aria-label="确认清空历史" onClick={() => setConfirming(false)}>
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
                    onReset()
                    onClose()
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

function BannerHistory({
  state,
  onClose,
  onReset,
  mode = 'character',
  fatePoints = 0,
  canReset,
}: {
  state: WishState
  onClose: () => void
  onReset: () => void
  mode?: 'character' | 'weapon'
  fatePoints?: number
  canReset?: boolean
}) {
  const [onlyUp, setOnlyUp] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const weapon = mode === 'weapon'
  const ups = state.records.filter((record) => record.fiveKind !== 'lost')
  const lost = state.records.filter((record) => record.fiveKind === 'lost')
  const radiance = state.records.filter((record) => record.fiveKind === (weapon ? 'charted' : 'radiance'))
  const featured = weapon ? radiance : ups
  const featuredSpans = spansSincePrevious(featured)
  const featuredTotal = featured.reduce((max, record) => Math.max(max, record.totalPulls), 0)
  const luck = weapon ? weaponLuck(featuredTotal, featured.length) : characterLuck(featuredTotal, featured.length)
  const shown = (onlyUp ? featured : state.records).slice(-200).reverse()
  const hidden = (onlyUp ? featured.length : state.records.length) - shown.length

  return (
    <Modal title={weapon ? '武器祈愿历史' : '角色祈愿历史'} onClose={onClose}>
      <LuckBanner report={luck} weapon={weapon} />
      <p className="fine">
        {weapon
          ? `期望 ${WEAPON_CHARTED_EXPECTED.toFixed(1)} 抽按一直定轨计算：两把五星 UP 里定一把，没命中就累积命定，满了之后下一发五星必定是定轨。比期望少是欧，多是非；整段记录越罕见，称号越高。`
          : `期望 ${CHARACTER_UP_EXPECTED.toFixed(1)} 抽是长期平均，已经算上 50/50、大保底和捕获明光。从零开始的第一次是 ${CHARACTER_UP_FIRST_EXPECTED.toFixed(1)} 抽。比期望少是欧，多是非；整段记录越罕见，称号越高。`}
      </p>
      <div className="stat-grid">
        <div>
          <b>{state.totalPulls}</b>
          <span>累计抽数</span>
        </div>
        <div>
          <b>{state.records.length}</b>
          <span>五星</span>
        </div>
        <div>
          <b>{featured.length}</b>
          <span>{weapon ? '定轨UP五星' : 'UP 五星'}</span>
        </div>
        <div>
          <b>{lost.length}</b>
          <span>歪</span>
        </div>
        <div>
          <b>{radiance.length}</b>
          <span>{weapon ? '定轨' : '捕获明光'}</span>
        </div>
        <div>
          <b>{average(state.records)}</b>
          <span>五星平均间隔</span>
        </div>
        <div>
          <b>{spanAverage(weapon ? radiance : ups)}</b>
          <span>{weapon ? '定轨命中平均间隔' : 'UP 平均间隔'}</span>
        </div>
        <div>
          <b>{weapon ? `${fatePoints}/${FATE_MAX}` : state.masterless}</b>
          <span>{weapon ? '命定值' : '无主的命星'}</span>
        </div>
        <div>
          <b>{state.fivePity}</b>
          <span>当前已垫</span>
        </div>
      </div>
      <p className="fine">
        全部五星里，每一发从上一发五星之后重新计算，第一发则从第 1 抽算起。
        {weapon
          ? '定轨UP五星只记定轨命中，抽数从上一发定轨命中算到这一发，中间的歪也算在内；第一发从第 1 抽算起。定轨命中平均间隔是这些抽数的平均数。清空记录会把角色祈愿、武器祈愿、常驻祈愿和仓库全部重置，命定值和无主的命星归零。卡池配置和定轨选择会保留。'
          : '五星会记下这一发之后的命之座，6 命封顶；已经 6 命再抽到时，会额外标出一枚无主的命星。UP 五星从上一发 UP 算到这一发，中间的歪、小保底、大保底和捕获明光都算在内；第一发从第 1 抽算起，所以第 160 抽的大保底记为 160 抽。UP 平均间隔是这些抽数的平均数。清空记录会把角色祈愿、武器祈愿、常驻祈愿和仓库全部重置，命定值和无主的命星归零。卡池配置和定轨选择会保留。'}
      </p>
      <div className="history-tools">
        <div className="seg">
          <button type="button" className={!onlyUp ? 'on' : ''} onClick={() => setOnlyUp(false)}>
            全部五星
          </button>
          <button type="button" className={onlyUp ? 'on' : ''} onClick={() => setOnlyUp(true)}>
            {weapon ? '定轨UP五星' : 'UP 五星'}
          </button>
        </div>
        <button
          type="button"
          className="danger ghost"
          onClick={() => setConfirming(true)}
          disabled={canReset === false || (canReset === undefined && state.totalPulls === 0)}
        >
          清空记录
        </button>
      </div>
      {shown.length === 0 ? (
        <p className="empty">
          {onlyUp ? (weapon ? '还没有定轨命中。' : '还没有 UP。') : '还没有五星。出金后，这里会记下是多少抽出的。'}
        </p>
      ) : (
        <ol className="history-list">
          {shown.map((record) => (
            <li key={record.id} className={`history-row kind-${record.fiveKind}`}>
              <b>
                {onlyUp ? (featuredSpans.get(record.id) ?? record.pity) : record.pity}
                <small>抽</small>
              </b>
              <span className="who">
                {record.name}
                {record.constellation !== undefined && <em className="cons">{record.constellation}命</em>}
              </span>
              <span className="history-tags">
                <span className={`card-tag tag-${record.fiveKind}`}>{fiveKindLabel(record.fiveKind)}</span>
                {record.masterless && <span className="card-tag tag-masterless">无主的命星</span>}
              </span>
              <span className="abs">第 {record.totalPulls} 抽</span>
            </li>
          ))}
        </ol>
      )}
      {hidden > 0 && <p className="fine">还有 {hidden} 条更早的记录没有展开，上面的统计仍按全部记录计算。</p>}
      {confirming &&
        createPortal(
          <div className="chart-ask" role="dialog" aria-modal="true" aria-label="确认清空历史" onClick={() => setConfirming(false)}>
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
                  onReset()
                  onClose()
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

export function HistoryModal({
  state,
  onClose,
  onReset,
  mode = 'character',
  fatePoints = 0,
  canReset,
  standardState,
}: {
  state: WishState
  onClose: () => void
  onReset: () => void
  mode?: 'character' | 'weapon' | 'standard'
  fatePoints?: number
  canReset?: boolean
  standardState?: StandardWishState
}) {
  if (mode === 'standard' && standardState) {
    return <StandardHistory standard={standardState} onClose={onClose} onReset={onReset} canReset={canReset} />
  }
  return (
    <BannerHistory
      state={state}
      onClose={onClose}
      onReset={onReset}
      mode={mode === 'weapon' ? 'weapon' : 'character'}
      fatePoints={fatePoints}
      canReset={canReset}
    />
  )
}

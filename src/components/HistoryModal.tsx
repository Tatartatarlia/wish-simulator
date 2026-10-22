import { useState } from 'react'
import { createPortal } from 'react-dom'
import { fiveKindLabel } from '../lib/gacha.ts'
import { FATE_MAX } from '../lib/weaponGacha.ts'
import type { FiveStarRecord, WishState } from '../lib/types.ts'
import { Modal } from './Modal.tsx'

function average(records: FiveStarRecord[]): string {
  if (records.length === 0) return '—'
  const value = records.reduce((sum, record) => sum + record.pity, 0) / records.length
  return value.toFixed(1)
}

export function HistoryModal({
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
  const shown = (onlyUp ? ups : state.records).slice(-200).reverse()
  const hidden = (onlyUp ? ups.length : state.records.length) - shown.length

  return (
    <Modal title={weapon ? '武器祈愿历史' : '角色祈愿历史'} onClose={onClose}>
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
          <b>{ups.length}</b>
          <span>UP 五星</span>
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
          <b>{average(ups)}</b>
          <span>UP 平均间隔</span>
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
        间隔从上一发五星之后重新计算，第一发则从第 1 抽算起。
        {weapon
          ? '定轨之后，抽到的五星只要不是定轨武器，就记为「歪」。清空这里会重置武器祈愿的累计抽数、保底和命定值，并清掉仓库里的武器；定轨选择会保留。角色不受影响。'
          : '五星会记下这一发之后的命之座，6 命封顶；已经 6 命再抽到时，会额外标出一枚无主的命星。清空这里会重置角色祈愿的累计抽数和保底，并清掉仓库里的角色和无主的命星。武器不受影响。'}
      </p>
      <div className="history-tools">
        <div className="seg">
          <button type="button" className={!onlyUp ? 'on' : ''} onClick={() => setOnlyUp(false)}>
            全部五星
          </button>
          <button type="button" className={onlyUp ? 'on' : ''} onClick={() => setOnlyUp(true)}>
            UP 五星
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
        <p className="empty">还没有五星。出金后，这里会记下是多少抽出的。</p>
      ) : (
        <ol className="history-list">
          {shown.map((record) => (
            <li key={record.id} className={`history-row kind-${record.fiveKind}`}>
              <b>
                {record.pity}
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
            <h2>{weapon ? '清空武器祈愿历史' : '清空角色祈愿历史'}</h2>
            <p>
              {weapon
                ? '确定清空武器祈愿历史吗？累计抽数、保底和命定值会重置，仓库里的武器也会一起清掉。定轨选择会保留。反过来，在仓库里清空武器时，这里的历史也会一起清掉。角色栏和角色祈愿不受影响。'
                : '确定清空角色祈愿历史吗？累计抽数、保底和无主的命星会重置，仓库里的角色也会一起清掉。反过来，在仓库里清空角色时，这里的历史也会一起清掉。武器栏和武器祈愿不受影响。'}
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

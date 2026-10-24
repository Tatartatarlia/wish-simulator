import { useEffect, useRef, useState } from 'react'
import { BannerArt } from './components/BannerArt.tsx'
import { UpPortrait } from './components/UpPortrait.tsx'
import { DetailModal } from './components/DetailModal.tsx'
import { HistoryModal } from './components/HistoryModal.tsx'
import { RosterModal } from './components/RosterModal.tsx'
import { StandardCast } from './components/StandardCast.tsx'
import { StandardDetailModal } from './components/StandardDetailModal.tsx'
import { WeaponDetailModal } from './components/WeaponDetailModal.tsx'
import { FateIcon, StarIcon } from './components/icons.tsx'
import { MeteorShow } from './components/MeteorShow.tsx'
import { ResultOverlay } from './components/ResultOverlay.tsx'
import { buildPool, fourStarRoster } from './data/banner.ts'
import { STANDARD_EVENT_NAME, buildStandardPool } from './data/standard.ts'
import { WEAPON_TYPES, buildWeaponPool } from './data/weapons.ts'
import { describeNextFive, fiveKindLabel, fiveStarProbability, meteorTone, pullMany, createWishState } from './lib/gacha.ts'
import { loadSave, saveSave } from './lib/storage.ts'
import { createStandardState, describeStandardFive, pullStandardMany } from './lib/standardGacha.ts'
import { FATE_MAX, createWeaponState, describeWeaponFive, pullWeaponMany, weaponFiveProbability } from './lib/weaponGacha.ts'
import { playReveal, playWishSounds, stopWishSound } from './lib/wishSound.ts'
import type { CharacterCatalog, PoolConfig, PullResult, RosterEdits, StandardWishState, WeaponPoolConfig, WeaponWishState, WishState } from './lib/types.ts'

type ModalName = 'detail' | 'history' | 'roster' | null
type BannerKind = 'character' | 'weapon' | 'standard'
type Phase = 'idle' | 'meteor' | 'result'

function formatRate(probability: number): string {
  if (probability >= 1) return '100%'
  return `${(probability * 100).toFixed(3)}%`
}

function elementColor(element: string): string {
  switch (element) {
    case '冰':
      return '#9be7ff'
    case '水':
      return '#5eb6ff'
    case '火':
      return '#ff8a63'
    case '雷':
      return '#c9a0ff'
    case '风':
      return '#8eecc0'
    case '岩':
      return '#efc56a'
    case '草':
      return '#8ed7a4'
    default:
      return '#d5e6f5'
  }
}

export default function App() {
  const loaded = useRef(loadSave())
  const [state, setState] = useState<WishState>(loaded.current.state)
  const [pool, setPool] = useState<PoolConfig>(loaded.current.pool)
  const [catalog, setCatalog] = useState<CharacterCatalog>(loaded.current.catalog)
  const [weaponState, setWeaponState] = useState<WeaponWishState>(loaded.current.weaponState)
  const [weaponPool, setWeaponPool] = useState<WeaponPoolConfig>(loaded.current.weaponPool)
  const [roster, setRoster] = useState<RosterEdits>(loaded.current.roster)
  const [standardState, setStandardState] = useState<StandardWishState>(loaded.current.standardState)
  const [banner, setBanner] = useState<BannerKind>('character')
  const [modal, setModal] = useState<ModalName>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [session, setSession] = useState<{ id: number; results: PullResult[] } | null>(null)
  const sessionRef = useRef(session)
  sessionRef.current = session
  const [chartAsk, setChartAsk] = useState<string | null>(null)

  const stateRef = useRef(state)
  const poolRef = useRef(pool)
  const catalogRef = useRef(catalog)
  const weaponStateRef = useRef(weaponState)
  const weaponPoolRef = useRef(weaponPool)
  const rosterRef = useRef(roster)
  const standardStateRef = useRef(standardState)
  const bannerRef = useRef(banner)
  const phaseRef = useRef(phase)
  const modalRef = useRef(modal)
  const chartAskRef = useRef(chartAsk)
  const seq = useRef(0)
  stateRef.current = state
  poolRef.current = pool
  catalogRef.current = catalog
  weaponStateRef.current = weaponState
  weaponPoolRef.current = weaponPool
  rosterRef.current = roster
  standardStateRef.current = standardState
  bannerRef.current = banner
  phaseRef.current = phase
  modalRef.current = modal
  chartAskRef.current = chartAsk

  useEffect(() => {
    saveSave({ state, pool, catalog, weaponState, weaponPool, roster, standardState })
  }, [state, pool, catalog, weaponState, weaponPool, roster, standardState])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (chartAskRef.current) setChartAsk(null)
      else if (phaseRef.current === 'meteor') finishMeteorRef.current()
      else if (phaseRef.current === 'result') setPhase('idle')
      else if (modalRef.current) setModal(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const finishMeteorRef = useRef(() => {})
  finishMeteorRef.current = () => {
    if (phaseRef.current !== 'meteor') return
    phaseRef.current = 'result'
    stopWishSound()
    const results = sessionRef.current?.results
    if (results) playReveal(results.map(meteorTone))
    setPhase('result')
  }

  const startWish = (count: 1 | 10) => {
    if (phaseRef.current === 'meteor') return
    phaseRef.current = 'meteor'
    const extraFours = catalogRef.current.fours.map((item) => item.name)
    seq.current += 1
    let results: PullResult[]
    if (bannerRef.current === 'weapon') {
      const characters = fourStarRoster(extraFours).filter((name) => !rosterRef.current.removedCharacters.includes(name))
      const pulled = pullWeaponMany(
        weaponStateRef.current,
        stateRef.current,
        count,
        buildWeaponPool(weaponPoolRef.current, rosterRef.current, characters),
      )
      results = pulled.results
      setWeaponState(pulled.weaponState)
      setState(pulled.characterState)
    } else if (bannerRef.current === 'standard') {
      const pulled = pullStandardMany(
        standardStateRef.current,
        stateRef.current,
        count,
        buildStandardPool(rosterRef.current.removedCharacters, rosterRef.current.removedWeapons, extraFours),
      )
      results = pulled.results
      setStandardState(pulled.standard)
      setState(pulled.owned)
    } else {
      const pulled = pullMany(stateRef.current, count, buildPool(poolRef.current, extraFours, rosterRef.current))
      results = pulled.results
      setState(pulled.state)
    }
    const next = { id: seq.current, results }
    sessionRef.current = next
    setSession(next)
    setModal(null)
    setPhase('meteor')
    playWishSounds(results.map(meteorTone))
  }

  const askChart = (name: string) => {
    if (phaseRef.current !== 'idle') return
    setChartAsk(name)
  }

  const confirmChart = () => {
    if (!chartAsk) return
    const name = chartAsk
    setChartAsk(null)
    setWeaponPool((current) => ({ ...current, charted: current.charted === name ? null : name }))
    setWeaponState((current) => ({ ...current, fatePoints: 0 }))
  }

  const chartQuestion = chartAsk
    ? weaponPool.charted === chartAsk
      ? `确定取消「${chartAsk}」的定轨？命定值会归零，之后不再累积。`
      : weaponPool.charted
        ? `确定把定轨从「${weaponPool.charted}」换成「${chartAsk}」？命定值会归零并重新累计。之后抽到的五星只要不是「${chartAsk}」，历史记录都会记为「歪」。`
        : `确定把「${chartAsk}」设为定轨武器？之后抽到的五星只要不是它，历史记录都会记为「歪」，并获得 1 点命定值。满 ${FATE_MAX} 点时，下一把五星必定是它。`
    : ''

  const busy = phase !== 'idle' || modal !== null
  const weaponMode = banner === 'weapon'
  const standardMode = banner === 'standard'
  const activePulls = standardMode ? standardState.totalPulls : weaponMode ? weaponState.totalPulls : state.totalPulls
  const activeFivePity = standardMode ? standardState.fivePity : weaponMode ? weaponState.fivePity : state.fivePity
  const activeFourPity = standardMode ? standardState.fourPity : weaponMode ? weaponState.fourPity : state.fourPity
  const activeFourGuaranteed = weaponMode ? weaponState.fourGuaranteed : standardMode ? false : state.fourGuaranteed
  const last = standardMode ? standardState.records[standardState.records.length - 1] : weaponMode ? weaponState.records[weaponState.records.length - 1] : state.records[state.records.length - 1]
  const fiveRate = weaponMode ? weaponFiveProbability(weaponState.fivePity + 1) : fiveStarProbability(activeFivePity + 1)
  const pityCap = weaponMode ? 80 : 90
  const resetEverything = () => {
    setState(createWishState())
    setWeaponState(createWeaponState())
    setStandardState(createStandardState())
  }
  const anyProgress =
    state.totalPulls > 0 ||
    state.owned.length > 0 ||
    state.masterless > 0 ||
    state.ownedWeapons.length > 0 ||
    weaponState.totalPulls > 0 ||
    weaponState.fatePoints > 0 ||
    standardState.totalPulls > 0

  return (
    <div className="sky">
      <div className="cloud c1" />
      <div className="cloud c2" />
      <div className="cloud c3" />
      <div className="cloud c4" />
      <div className="layout">
        <header className="topbar">
          <div className="brand">
            <StarIcon />
            祈愿
          </div>
          <div className="banner-switch">
            <button type="button" className={banner === 'character' ? 'on' : ''} disabled={busy} onClick={() => setBanner('character')}>
              角色祈愿
            </button>
            <button type="button" className={weaponMode ? 'on' : ''} disabled={busy} onClick={() => setBanner('weapon')}>
              武器祈愿
            </button>
            <button type="button" className={standardMode ? 'on' : ''} disabled={busy} onClick={() => setBanner('standard')}>
              常驻祈愿
            </button>
          </div>
          <div className="wallet">
            <span className="wallet-pill">
              <FateIcon />
              纠缠之缘 ∞
            </span>
            <span className="wallet-pill accent">累计 {activePulls}</span>
          </div>
        </header>

        <main className="stage">
          <section
            className={`banner ${weaponMode ? 'weapon' : ''} ${standardMode ? 'standard' : ''}`}
            aria-label={standardMode ? `${STANDARD_EVENT_NAME}常驻祈愿` : weaponMode ? `${weaponPool.eventName}武器活动祈愿` : `${pool.eventName}角色活动祈愿`}
          >
            <BannerArt />
            <div className="banner-copy">
              <div className="event-pill">{standardMode ? '常驻祈愿' : weaponMode ? '武器活动祈愿' : '角色活动祈愿'}</div>
              <h1>{standardMode ? STANDARD_EVENT_NAME : weaponMode ? weaponPool.eventName : pool.eventName}</h1>
              {standardMode ? <p className="boost">常驻祈愿</p> : <p className="boost">获取概率提升！</p>}
              <p className="guarantee-line">
                <i />
                每十次祈愿必出四星或以上物品。
              </p>
              <p className="event-note">{standardMode ? '常驻祈愿为永久性祈愿活动。' : '模拟祈愿 · 资源无限'}</p>
            </div>
            {banner === 'character' && <UpPortrait name={pool.upFive.name} />}
            {standardMode && <StandardCast />}
            {weaponMode ? (
              <div className="weapon-pair">
                {weaponPool.upFives.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={`weapon-card ${weaponPool.charted === name ? 'charted' : ''}`}
                    onClick={() => askChart(name)}
                  >
                    <em>UP</em>
                    <b>{name}</b>
                    <small>{WEAPON_TYPES[name] ?? '五星武器'}</small>
                    <span>{weaponPool.charted === name ? `定轨中 · 命定 ${weaponState.fatePoints}/${FATE_MAX}` : '点击定轨'}</span>
                  </button>
                ))}
              </div>
            ) : null}
            {banner === 'character' && <div className="hero-card">
              <div className="char-plate">
                <div className="char-name">
                  {pool.upFive.name}
                  <span className="up-badge">UP!</span>
                </div>
                <div className="stars" aria-label="五星">
                  ★★★★★
                </div>
                <div className="char-title">
                  {pool.upFive.title}
                  {pool.upFive.element && <span style={{ color: elementColor(pool.upFive.element) }}> · {pool.upFive.element}</span>}
                </div>
              </div>
            </div>}
            {standardMode ? null : weaponMode ? (
              <aside className="weapon-fours">
                {weaponPool.upFours.map((name) => (
                  <div className="four-card" key={name}>
                    <span>
                      <b>{name}</b>
                      <small>{WEAPON_TYPES[name] ?? '武器'}</small>
                    </span>
                    <em>UP</em>
                  </div>
                ))}
              </aside>
            ) : (
            <aside className="four-column">
              {pool.upFours.map((item) => (
                <div className="four-card" key={item.name}>
                  <span className="four-gem" style={{ background: elementColor(item.element) }} />
                  <span>
                    <b>{item.name}</b>
                    <small>
                      {item.title}
                      {item.element ? ` · ${item.element}` : ''}
                    </small>
                  </span>
                  <em>UP</em>
                </div>
              ))}
            </aside>
            )}
          </section>
        </main>

        <footer className="dock">
          <div className="status">
            <div className="status-total">
              累计 <b key={activePulls}>{activePulls}</b> 抽
            </div>
            <div className="meter" aria-hidden="true">
              <span className={activeFivePity >= (weaponMode ? 62 : 73) ? 'hot' : ''} style={{ width: `${(activeFivePity / pityCap) * 100}%` }} />
            </div>
            <p className="status-line">
              五星 {activeFivePity}/{pityCap} · 概率 {formatRate(fiveRate)} · {standardMode ? describeStandardFive() : weaponMode ? describeWeaponFive(weaponState, weaponPool.charted) : describeNextFive(state)}
              <br />
              四星 {activeFourPity}/10 · {activeFourGuaranteed ? '下一件四星必为 UP' : standardMode ? '角色/武器各半' : weaponMode ? '四星 75/25' : '四星 50/50'}
            </p>
            {last && (
              <p className={`last-five ${'fiveKind' in last && last.fiveKind === 'radiance' ? 'is-radiance' : ''}`}>
                上次五星 {last.pity} 抽 · {last.name}
                {last.constellation !== undefined ? ` · ${last.constellation}命` : ''}
                {'fiveKind' in last ? ` · ${fiveKindLabel(last.fiveKind)}` : ''}
                {last.masterless ? ' · 无主的命星' : ''}
              </p>
            )}
            <div className="text-buttons">
              <button type="button" className="text-btn" onClick={() => setModal('detail')} disabled={phase !== 'idle'}>
                详情
              </button>
              <button type="button" className="text-btn" onClick={() => setModal('roster')} disabled={phase !== 'idle'}>
                仓库
              </button>
              <button type="button" className="text-btn" onClick={() => setModal('history')} disabled={phase !== 'idle'}>
                历史记录
              </button>
            </div>
          </div>
          <div className="wish-actions">
            <button type="button" className="wish-btn" onClick={() => startWish(1)} disabled={busy}>
              <span className="wish-title">祈愿1次</span>
              <span className="wish-cost">
                <FateIcon />× 1
              </span>
            </button>
            <button type="button" className="wish-btn wish-btn-ten" onClick={() => startWish(10)} disabled={busy}>
              <span className="wish-title">祈愿10次</span>
              <span className="wish-cost">
                <FateIcon />× 10
              </span>
            </button>
          </div>
        </footer>
      </div>

      {modal === 'detail' && banner === 'character' && (
        <DetailModal
          pool={pool}
          catalog={catalog}
          edits={roster}
          weaponPool={weaponPool}
          onClose={() => setModal(null)}
          onSave={setPool}
          onCatalog={setCatalog}
          onEdits={setRoster}
        />
      )}
      {modal === 'detail' && weaponMode && (
        <WeaponDetailModal
          pool={weaponPool}
          edits={roster}
          catalog={catalog}
          fourCharacters={fourStarRoster(catalog.fours.map((item) => item.name)).filter((name) => !roster.removedCharacters.includes(name))}
          onClose={() => setModal(null)}
          onSave={(next) => {
            if (next.charted !== weaponPool.charted) setWeaponState((current) => ({ ...current, fatePoints: 0 }))
            setWeaponPool(next)
          }}
          onEdits={setRoster}
        />
      )}
      {modal === 'detail' && standardMode && (
        <StandardDetailModal
          pool={buildStandardPool(roster.removedCharacters, roster.removedWeapons, catalog.fours.map((item) => item.name))}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'roster' && (
        <RosterModal
          state={state}
          catalog={catalog}
          onClose={() => setModal(null)}
          canClear={anyProgress}
          onClear={resetEverything}
        />
      )}
      {modal === 'history' && banner === 'character' && (
        <HistoryModal
          state={state}
          canReset={anyProgress}
          onClose={() => setModal(null)}
          onReset={resetEverything}
        />
      )}
      {modal === 'history' && weaponMode && (
        <HistoryModal
          mode="weapon"
          fatePoints={weaponState.fatePoints}
          canReset={anyProgress}
          state={{ ...createWishState(), totalPulls: weaponState.totalPulls, fivePity: weaponState.fivePity, records: weaponState.records }}
          onClose={() => setModal(null)}
          onReset={resetEverything}
        />
      )}
      {modal === 'history' && standardMode && (
        <HistoryModal
          mode="standard"
          state={state}
          standardState={standardState}
          canReset={anyProgress}
          onClose={() => setModal(null)}
          onReset={resetEverything}
        />
      )}
      {chartAsk && (
        <div className="chart-ask" role="dialog" aria-modal="true" aria-label="确认定轨">
          <div className="chart-ask-card">
            <h2>神铸定轨</h2>
            <p>{chartQuestion}</p>
            <div className="chart-ask-actions">
              <button type="button" className="text-btn" onClick={() => setChartAsk(null)}>
                先不改
              </button>
              <button type="button" className="text-btn solid" onClick={confirmChart}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}
      {session && phase === 'meteor' && (
        <MeteorShow key={session.id} tones={session.results.map(meteorTone)} onDone={() => finishMeteorRef.current()} />
      )}
      {session && phase === 'result' && (
        <ResultOverlay
          results={session.results}
          totalPulls={activePulls}
          onClose={() => setPhase('idle')}
          onAgain={() => startWish(session.results.length === 10 ? 10 : 1)}
        />
      )}
    </div>
  )
}

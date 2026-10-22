import { fiveKindLabel, meteorTone } from '../lib/gacha.ts'
import type { PullResult } from '../lib/types.ts'
import { CrystalIcon, SwordIcon } from './icons.tsx'

export function ResultOverlay({
  results,
  totalPulls,
  onClose,
  onAgain,
}: {
  results: PullResult[]
  totalPulls: number
  onClose: () => void
  onAgain: () => void
}) {
  const single = results.length === 1
  const fives = results.filter((result) => result.rarity === 5)

  return (
    <div className="result-layer" role="dialog" aria-label="祈愿结果">
      <div className="result-head">
        <h2>{single ? '祈愿 1 次' : '祈愿 10 次'}</h2>
        <p>
          累计 <strong>{totalPulls}</strong> 抽
        </p>
      </div>
      {fives.length > 0 && (
        <ul className="result-fives">
          {fives.map((result) => (
            <li key={`${result.totalPulls}-${result.name}`}>
              <b>{result.pity}</b> 抽 · {result.name}
              {result.constellation !== undefined ? ` · ${result.constellation}命` : ''}
              {result.fiveKind ? ` · ${fiveKindLabel(result.fiveKind)}` : ''}
              {result.masterless ? ' · 无主的命星' : ''}
            </li>
          ))}
        </ul>
      )}
      <div className={`result-row ${single ? 'result-row-single' : ''}`}>
        {results.map((result, index) => {
          const tone = meteorTone(result)
          return (
            <article
              key={`${result.totalPulls}-${index}`}
              className={`result-card tone-${tone} ${result.fiveKind ? `kind-${result.fiveKind}` : ''} ${single ? 'single' : ''}`}
              style={{ animationDelay: `${index * 45}ms` }}
            >
              <div className="card-stars" aria-label={`${result.rarity}星`}>
                {'★'.repeat(result.rarity)}
              </div>
              <div className="card-glyph">{result.itemType === 'weapon' ? <SwordIcon /> : <CrystalIcon />}</div>
              <div className="card-copy">
                {result.fiveKind && <span className={`card-tag tag-${result.fiveKind}`}>{fiveKindLabel(result.fiveKind)}</span>}
                {result.featured && result.rarity === 4 && <span className="card-tag tag-up">UP</span>}
                {result.masterless && <span className="card-tag tag-masterless">无主的命星</span>}
                <h3>{result.name}</h3>
                <p>
                  {result.itemType === 'character' ? '角色' : '武器'}
                  {result.constellation !== undefined ? ` · ${result.constellation}命` : ''}
                </p>
                {result.pity !== undefined && (
                  <p className="card-pity">
                    <b>{result.pity}</b> 抽
                  </p>
                )}
              </div>
            </article>
          )
        })}
      </div>
      <div className="result-actions">
        <button type="button" className="text-btn" onClick={onClose}>
          确认
        </button>
        <button type="button" className="wish-btn wish-btn-again" onClick={onAgain}>
          <span>再祈愿 {single ? '1' : '10'} 次</span>
        </button>
      </div>
    </div>
  )
}

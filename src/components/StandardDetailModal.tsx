import { STANDARD_EVENT_NAME } from '../data/standard.ts'
import type { StandardPool } from '../lib/types.ts'
import { Modal } from './Modal.tsx'

function NameList({ names }: { names: readonly string[] }) {
  if (names.length === 0) return <p className="empty">名单是空的。</p>
  return (
    <p className="standard-names">
      {names.map((name) => (
        <span key={name}>{name}</span>
      ))}
    </p>
  )
}

export function StandardDetailModal({ pool, onClose }: { pool: StandardPool; onClose: () => void }) {
  return (
    <Modal title={`「${STANDARD_EVENT_NAME}」常驻祈愿`} wide onClose={onClose}>
      <section className="rules">
      <h3>祈愿规则</h3>
      <p>常驻祈愿是永久性祈愿，可以获得常驻角色和武器。没有概率提升，也没有「歪」和大保底。</p>
      <ul>
        <li>五星基础概率 0.600%，其中角色 0.300%、武器 0.300%。第 74 抽起每抽提高 6 个百分点，第 90 抽必出。含保底的综合概率约为 1.600%。</li>
        <li>获得五星时，角色和武器各占一半，再在对应常驻名单里平分。下一发五星不会因此被保证。</li>
        <li>四星基础概率 5.100%，其中角色 2.550%、武器 2.550%。第 9 抽提升到 56.1%，第 10 抽必出四星或以上。含保底的综合概率约为 13%。第 10 抽若五星仍是基础概率，则约 99.4% 为四星、0.6% 为五星。</li>
        <li>获得四星时，角色和武器各占一半。四星角色包含全部常驻四星，以及安柏、凯亚、丽莎。四星武器只有常驻四星武器。</li>
        <li>其余为常驻三星武器。获得五星会同时重置四星计数。</li>
        <li>角色第一次获得是 0 命，重复获得升一命，6 命封顶。五星超过 6 命时，额外得到一枚无主的命星。四星到 6 命后不再增加。</li>
      </ul>
      </section>
      <section className="pool-block">
        <h3 className="pool-heading tone-gold">五星角色</h3>
        <NameList names={pool.fiveCharacters} />
      </section>
      <section className="pool-block">
        <h3 className="pool-heading tone-gold">五星武器</h3>
        <NameList names={pool.fiveWeapons} />
      </section>
      <section className="pool-block">
        <h3 className="pool-heading tone-purple">四星角色</h3>
        <NameList names={pool.fourCharacters} />
      </section>
      <section className="pool-block">
        <h3 className="pool-heading tone-purple">四星武器</h3>
        <NameList names={pool.fourWeapons} />
      </section>
    </Modal>
  )
}

import { STANDARD_SHOWCASE } from '../data/standard.ts'

function photoUrl(name: string): string {
  return `${import.meta.env.BASE_URL}id-photos/${encodeURIComponent(name)}.webp`
}

export function StandardCast() {
  return (
    <div className="standard-cast">
      {STANDARD_SHOWCASE.map((character) => (
        <article key={character.name} className="standard-hero">
          <div className="standard-photo">
            <img src={photoUrl(character.name)} alt="" />
            <img className="standard-element" src={`${import.meta.env.BASE_URL}elements/${encodeURIComponent(character.element)}元素.png`} alt="" />
          </div>
          <b>{character.name}</b>
          <small>{character.title}</small>
          <span className="stars" aria-label="五星">★★★★★</span>
        </article>
      ))}
      <article className="standard-weapon-mark">
        <b>天空之脊等</b>
        <small>全部类型</small>
        <span className="stars" aria-label="五星">★★★★★</span>
      </article>
    </div>
  )
}

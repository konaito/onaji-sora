import { useEffect, useMemo, useState } from 'react'
import {
  type Action,
  type Game,
  type Seat,
  type Sym,
  JP,
  SYMBOLS,
  beginPlay,
  card,
  confirmedCount,
  keepDraft,
  lock,
  lockNpcs,
  newGame,
  scoreOf,
  startDraft,
} from './game'
import './App.css'

const art = (f: string) => `${import.meta.env.BASE_URL}art/${f}`
const NPC_ART: Record<string, string> = {
  kangetsu: art('npc-kangetsu.png'),
  shuu: art('npc-shuu.png'),
  toorai: art('npc-toorai.png'),
}
const NPC_ROLE: Record<string, string> = {
  kangetsu: '観る人',
  shuu: '取る人',
  toorai: '打つ人',
}

function Tile({ sym, large }: { sym: Sym; large?: boolean }) {
  const i = SYMBOLS.indexOf(sym)
  return (
    <div
      className={`tile ${large ? 'lg' : ''}`}
      style={{
        backgroundImage: `url(${art('tiles.png')})`,
        backgroundPosition: `${(i / 5) * 100}% 50%`,
        backgroundSize: '600% 100%',
      }}
      title={JP[sym]}
    >
      <span>{JP[sym]}</span>
    </div>
  )
}

function PatternCard({
  id,
  on,
  onClick,
  mark,
}: {
  id: number
  on?: boolean
  onClick?: () => void
  mark?: string
}) {
  const c = card(id)
  return (
    <button type="button" className={`pcard ${on ? 'on' : ''}`} onClick={onClick} disabled={!onClick}>
      <div className="pcard-back" style={{ backgroundImage: `url(${art('cardback.png')})` }} />
      <div className="pcard-face">
        <em>VP {c.vp}</em>
        <strong>{c.name}</strong>
        <span>{c.text}</span>
        {mark && <b className="mark">{mark}</b>}
      </div>
    </button>
  )
}

export default function App() {
  const [g, setG] = useState<Game>(() => newGame())
  const [pick, setPick] = useState<number[]>([])
  const [utsuId, setUtsuId] = useState<number | null>(null)
  const [bet, setBet] = useState<Sym | null>(null)
  const [help, setHelp] = useState(false)
  const [flash, setFlash] = useState('')
  const me = g.seats[0]!

  const reset = () => {
    setG(newGame())
    setPick([])
    setUtsuId(null)
    setBet(null)
  }

  const sit = () => {
    setHelp(false)
    setG((x) => startDraft(x))
  }

  const toggleKeep = (id: number) => {
    setPick((p) => (p.includes(id) ? p.filter((n) => n !== id) : p.length >= 3 ? p : [...p, id]))
  }

  const confirmDraft = () => {
    if (pick.length !== 3) return
    setG((x) => beginPlay(keepDraft(x, 0, pick)))
  }

  const commit = (a: Action) => {
    setFlash(a.t === 'toru' ? '取る' : a.t === 'miru' ? '見る' : '打つ')
    setG((x) => lockNpcs(lock(x, 0, a)))
    setUtsuId(null)
    setBet(null)
    window.setTimeout(() => setFlash(''), 700)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (g.phase !== 'play' || g.locked[0]) return
      if (e.key === '1') commit({ t: 'toru', i: 0 })
      if (e.key === '2') commit({ t: 'toru', i: 1 })
      if (e.key === '3') commit({ t: 'toru', i: 2 })
      if (e.key === 'v' || e.key === 'V') commit({ t: 'miru' })
      if (e.key === 'f' || e.key === 'F') {
        const id = utsuId ?? me.hand[0]
        if (id) commit({ t: 'utsu', id, bet: bet ?? undefined })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [g.phase, g.locked, utsuId, bet, me.hand])

  const last = useMemo(() => g.log.slice(-8), [g.log])
  const waiting = g.phase === 'play' && !!g.locked[0]

  return (
    <div className="stage" style={{ backgroundImage: `url(${art('table.png')})` }}>
      <div className="veil" />
      <div className="mica" />
      <header className="top">
        <h1>同じ空</h1>
        {g.phase === 'play' && <p className="round">第{g.round}の空</p>}
        {g.phase === 'draft' && <p className="round">残す {pick.length}/3</p>}
        <button className="ghost" onClick={() => setHelp(true)}>遊び方</button>
      </header>

      {g.phase === 'title' && (
        <div className="titlewrap">
          <p className="kicker">同じ空の下、四人は別の天気を待っている</p>
          <HowTo />
          <div className="opponents">
            {g.seats.slice(1).map((s) => (
              <div key={s.name} className="opp">
                <img src={NPC_ART[s.npc]} alt={s.name} />
                <strong>{s.name}</strong>
                <span>{NPC_ROLE[s.npc]}</span>
              </div>
            ))}
          </div>
          <button className="gold" onClick={sit}>卓に着く</button>
        </div>
      )}

      {g.phase === 'draft' && (
        <div className="draft">
          <div className="opponents thin">
            {g.seats.slice(1).map((s) => (
              <div key={s.name} className="opp sm">
                <img src={NPC_ART[s.npc]} alt={s.name} />
                <strong>{s.name}</strong>
              </div>
            ))}
          </div>
          <p className="coach">5枚配られた。タップして3枚残す。残した待ちが、今局のあなた。</p>
          <div className="fan">
            {me.draft.map((id) => (
              <PatternCard
                key={id}
                id={id}
                on={pick.includes(id)}
                mark={pick.includes(id) ? '残す' : pick.length >= 3 ? '外す' : ''}
                onClick={() => toggleKeep(id)}
              />
            ))}
          </div>
          <button className="gold" disabled={pick.length !== 3} onClick={confirmDraft}>
            {pick.length === 3 ? 'この3枚で待つ' : `あと ${3 - pick.length} 枚選ぶ`}
          </button>
        </div>
      )}

      {(g.phase === 'play' || g.phase === 'end') && (
        <main className="table">
          <div className="npcs">
            {g.seats.slice(1).map((s) => (
              <Npc key={s.name} s={s} />
            ))}
          </div>

          <section className="skybox">
            {g.round === 1 && !waiting && (
              <p className="coach">同じ空。左・中・右のどれかを取るか、見るか、秘密の待ちを打つ。</p>
            )}
            <p className="lbl">空</p>
            <div className="sky">
              {g.sky.map((sym, i) => (
                <button
                  key={`${sym}-${i}`}
                  className="sky-slot"
                  disabled={g.phase !== 'play' || waiting}
                  onClick={() => commit({ t: 'toru', i: i as 0 | 1 | 2 })}
                >
                  <Tile sym={sym} large />
                  <i>{['左', '中', '右'][i]}</i>
                </button>
              ))}
            </div>
            {flash && <div className="flash">{flash}</div>}
          </section>

          <section className="kishutsu">
            <p className="lbl">既出 {g.kishutsu.length}</p>
            <div className="river">
              {g.kishutsu.map((sym, i) => (
                <Tile key={`${i}-${sym}`} sym={sym} />
              ))}
            </div>
          </section>

          <section className="self">
            <div className="noki">
              <p className="lbl">軒下（取った記号）</p>
              <div className="row">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="slot">
                    {me.noki[i] ? <Tile sym={me.noki[i]!} /> : <span className="empty">—</span>}
                  </div>
                ))}
              </div>
            </div>
            <p className="lbl">秘密の待ち　打つ前に1枚選ぶ</p>
            <div className="hand">
              {me.hand.map((id) => (
                <PatternCard
                  key={id}
                  id={id}
                  on={utsuId === id}
                  mark={utsuId === id ? '打つ' : ''}
                  onClick={() => setUtsuId(id)}
                />
              ))}
            </div>
            <div className="acts">
              <button className="act" disabled={waiting || g.phase !== 'play'} onClick={() => commit({ t: 'miru' })}>
                見る
                <small>袋の次を覗く · 観測 {me.obs}/2</small>
              </button>
              {([0, 1, 2] as const).map((i) => (
                <button key={i} className="act" disabled={waiting || g.phase !== 'play'} onClick={() => commit({ t: 'toru', i })}>
                  取る {['左', '中', '右'][i]}
                  <small>軒下へ。同じ位置は衝突</small>
                </button>
              ))}
              <button
                className="act strike"
                disabled={!utsuId || waiting || g.phase !== 'play'}
                onClick={() => utsuId && commit({ t: 'utsu', id: utsuId, bet: bet ?? undefined })}
              >
                打つ
                <small>{utsuId ? card(utsuId).name : '待ちを選んでから'}</small>
              </button>
            </div>
            {utsuId && me.obs > 0 && g.round < 8 && (
              <div className="bet">
                <span>賭け（任意）次の空に出たら+3、出なければ達成ごと崩れ</span>
                {SYMBOLS.map((s) => (
                  <button key={s} className={bet === s ? 'on' : ''} onClick={() => setBet((x) => (x === s ? null : s))}>
                    {JP[s]}
                  </button>
                ))}
              </div>
            )}
            <p className="score">
              {scoreOf(me)}点 · 達成 {confirmedCount(me)}/3 · 崩れ {me.broken.length}
            </p>
          </section>

          <aside className="log">
            {last.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </aside>
        </main>
      )}

      {g.phase === 'end' && (
        <div className="endcard">
          <h2>{g.winner.includes(0) ? '同じ空の下、あなたが読んだ' : `${g.seats[g.winner[0]!]!.name}の勝ち`}</h2>
          <ul>
            {g.seats.map((s, i) => (
              <li key={s.name} className={g.winner.includes(i) ? 'win' : ''}>
                <img src={s.npc === 'human' ? art('cardback.png') : NPC_ART[s.npc]} alt="" />
                {s.name} — {scoreOf(s)}点
              </li>
            ))}
          </ul>
          <button className="gold" onClick={reset}>もう一度</button>
        </div>
      )}

      {help && (
        <div className="help" onClick={() => setHelp(false)}>
          <article onClick={(e) => e.stopPropagation()}>
            <HowTo />
            <button className="gold" onClick={() => setHelp(false)}>とじる</button>
          </article>
        </div>
      )}
    </div>
  )
}

function HowTo() {
  return (
    <ol className="howto">
      <li>
        <strong>同じ空</strong>
        <span>毎ラウンド、袋から記号が3つ出る。四人とも同じものを見る。</span>
      </li>
      <li>
        <strong>別の待ち</strong>
        <span>あなただけ秘密の空模様を3枚持つ。同じ空が、誰かには宝物、誰かにはゴミ。</span>
      </li>
      <li>
        <strong>一手</strong>
        <span>見る（次を覗く）／取る（軒下へ）／打つ（待ちを公開して一発）。同時に出す。</span>
      </li>
      <li>
        <strong>圧</strong>
        <span>同じ位置を2人が取ったら誰も取れない。打って外すと崩れ、回収できない。8ラウンド、または達成3で終わり。</span>
      </li>
    </ol>
  )
}

function Npc({ s }: { s: Seat }) {
  return (
    <div className={`npc ${s.npc} ${s.line ? 'spoke' : ''}`}>
      <img src={NPC_ART[s.npc]} alt={s.name} />
      <div>
        <strong>{s.name}</strong>
        <em>{s.line || NPC_ROLE[s.npc]}</em>
        <small>{scoreOf(s)}点 · 軒下{s.noki.length}</small>
      </div>
    </div>
  )
}

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

  const sit = () => setG((x) => startDraft(x))

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
  })

  const last = useMemo(() => g.log.slice(-8), [g.log])

  return (
    <div className="stage" style={{ backgroundImage: `url(${art('table.png')})` }}>
      <div className="veil" />
      <header className="top">
        <h1>同じ空</h1>
        {g.phase !== 'title' && <p className="round">第 {Math.max(g.round, 1)} の空</p>}
        <button className="ghost" onClick={() => setHelp((h) => !h)}>早見</button>
      </header>

      {g.phase === 'title' && (
        <div className="titlecard">
          <p className="kicker">同じ空の下、四人は別の天気を待っている</p>
          <button className="gold" onClick={sit}>卓に着く</button>
        </div>
      )}

      {g.phase === 'draft' && (
        <div className="draft">
          <p>空模様を5枚見た。3枚残す。</p>
          <div className="row wrap">
            {me.draft.map((id) => {
              const c = card(id)
              const on = pick.includes(id)
              return (
                <button key={id} className={`pattern ${on ? 'on' : ''}`} onClick={() => toggleKeep(id)}>
                  <em>VP {c.vp}</em>
                  <strong>{c.name}</strong>
                  <span>{c.text}</span>
                </button>
              )
            })}
          </div>
          <button className="gold" disabled={pick.length !== 3} onClick={confirmDraft}>
            この3枚で待つ
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
            <p className="lbl">空</p>
            <div className="sky">
              {g.sky.map((sym, i) => (
                <button
                  key={`${sym}-${i}`}
                  className="sky-slot"
                  disabled={g.phase !== 'play' || !!g.locked[0]}
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
              <p className="lbl">軒下</p>
              <div className="row">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="slot">
                    {me.noki[i] ? <Tile sym={me.noki[i]!} /> : <span className="empty">空</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="hand">
              {me.hand.map((id) => {
                const c = card(id)
                const on = utsuId === id
                return (
                  <button key={id} className={`pattern slim ${on ? 'on' : ''}`} onClick={() => setUtsuId(id)}>
                    <em>VP {c.vp}</em>
                    <strong>{c.name}</strong>
                    <span>{c.text}</span>
                  </button>
                )
              })}
            </div>
            <div className="acts">
              <button className="act" disabled={!!g.locked[0] || g.phase !== 'play'} onClick={() => commit({ t: 'miru' })}>
                見る
                <small>観測 {me.obs}/2</small>
              </button>
              {([0, 1, 2] as const).map((i) => (
                <button key={i} className="act" disabled={!!g.locked[0] || g.phase !== 'play'} onClick={() => commit({ t: 'toru', i })}>
                  取る・{['左', '中', '右'][i]}
                </button>
              ))}
              <button
                className="act strike"
                disabled={!utsuId || !!g.locked[0] || g.phase !== 'play'}
                onClick={() => utsuId && commit({ t: 'utsu', id: utsuId, bet: bet ?? undefined })}
              >
                打つ
              </button>
            </div>
            {utsuId && me.obs > 0 && g.round < 8 && (
              <div className="bet">
                <span>賭け（任意・観測1）</span>
                {SYMBOLS.map((s) => (
                  <button key={s} className={bet === s ? 'on' : ''} onClick={() => setBet((x) => (x === s ? null : s))}>
                    {JP[s]}
                  </button>
                ))}
              </div>
            )}
            <p className="score">
              {me.name} {scoreOf(me)}点 / 達成 {confirmedCount(me)} / 崩れ {me.broken.length}
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
            <h3>早見</h3>
            <ol>
              <li>空3枚（左・中・右）</li>
              <li>前の賭けがあればこの空で確定</li>
              <li>見る / 取る / 打つのどれか一つ</li>
              <li>同じ位置を2人が取ったら全滅</li>
              <li>打つ判定は今の空3＋自分の軒下</li>
              <li>確定達成3、または8ラウンドで終了</li>
            </ol>
            <p>1 2 3 で取る、V 見る、F 打つ</p>
          </article>
        </div>
      )}
    </div>
  )
}

function Npc({ s }: { s: Seat }) {
  return (
    <div className={`npc ${s.npc}`}>
      <img src={NPC_ART[s.npc]} alt={s.name} />
      <div>
        <strong>{s.name}</strong>
        <em>{s.line || '……'}</em>
        <small>{scoreOf(s)}点 · 軒下{s.noki.length} · 観測{s.obs}</small>
      </div>
    </div>
  )
}

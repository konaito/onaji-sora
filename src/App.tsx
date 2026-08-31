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
const SEAL: Record<number, string> = { 2: '弐', 3: '参', 4: '四', 5: '五', 6: '六', 7: '七' }
const KAN = ['〇', '一', '二', '三', '四', '五', '六', '七', '八']

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
    />
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
    <button type="button" className={`pcard ${on ? 'on' : ''} ${mark === '外す' ? 'out' : ''}`} onClick={onClick} disabled={!onClick}>
      <div className="pcard-paper" style={{ backgroundImage: `url(${art('washi-card.png')})` }} />
      <i className="seal">{SEAL[c.vp] ?? c.vp}</i>
      <strong className="pname">{c.name}</strong>
      <span className="ptext">{c.text}</span>
      {mark && <b className={`hanko ${mark === '外す' ? 'out' : ''}`}>{mark}</b>}
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
    <div className="stage" data-phase={g.phase} style={{ backgroundImage: `url(${art('table.png')})` }}>
      <div className="veil" />
      <h1 className="brand">同じ空</h1>
      {g.phase === 'play' && <p className="round">第{KAN[g.round] ?? g.round}の空</p>}
      {g.phase === 'draft' && <p className="round">残す {pick.length}／三</p>}
      <button className="guide" onClick={() => setHelp(true)}>遊び方</button>

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
          <button className="mokuhyo" onClick={sit} style={{ backgroundImage: `url(${art('mokuhyo.png')})` }}>
            卓に着く
          </button>
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
          <p className="coach">条件札が5枚。勝ちたい待ちを3枚残す。高い点は難しい。</p>
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
          <button
            className="mokuhyo"
            disabled={pick.length !== 3}
            onClick={confirmDraft}
            style={{ backgroundImage: `url(${art('mokuhyo.png')})` }}
          >
            {pick.length === 3 ? 'この三枚で待つ' : `あと${['', '一', '二', '三'][3 - pick.length]}枚`}
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
              <p className="coach">今の3枚が空。取る＝手元へ。同じ位置は衝突して誰も取れない。打つ＝待ちを試す。外すと札は死ぬ。</p>
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
              <p className="lbl">軒下</p>
              <div className="row">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="slot">
                    {me.noki[i] ? <Tile sym={me.noki[i]!} /> : <span className="empty" />}
                  </div>
                ))}
              </div>
            </div>
            <p className="lbl">秘密の待ち</p>
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
                <small>次を覗く　観測 {me.obs}/二</small>
              </button>
              {([0, 1, 2] as const).map((i) => (
                <button key={i} className="act" disabled={waiting || g.phase !== 'play'} onClick={() => commit({ t: 'toru', i })}>
                  取る {['左', '中', '右'][i]}
                  <small>軒下へ。衝突は全滅</small>
                </button>
              ))}
              <button
                className="shu"
                disabled={!utsuId || waiting || g.phase !== 'play'}
                onClick={() => utsuId && commit({ t: 'utsu', id: utsuId, bet: bet ?? undefined })}
              >
                打
              </button>
            </div>
            {utsuId && me.obs > 0 && g.round < 8 && (
              <div className="bet">
                <span>賭け　次の空に出たら＋三、外れは崩れ</span>
                {SYMBOLS.map((s) => (
                  <button key={s} className={bet === s ? 'on' : ''} onClick={() => setBet((x) => (x === s ? null : s))}>
                    {JP[s]}
                  </button>
                ))}
              </div>
            )}
            <p className="score">
              {scoreOf(me)}点　達成 {confirmedCount(me)}／三　崩れ {me.broken.length}
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
                {s.name}　{scoreOf(s)}点
              </li>
            ))}
          </ul>
          <button className="mokuhyo" onClick={reset} style={{ backgroundImage: `url(${art('mokuhyo.png')})` }}>
            もう一度
          </button>
        </div>
      )}

      {help && (
        <div className="help" onClick={() => setHelp(false)}>
          <article onClick={(e) => e.stopPropagation()}>
            <HowTo />
            <button className="guide close" onClick={() => setHelp(false)}>とじる</button>
          </article>
        </div>
      )}
    </div>
  )
}

function HowTo() {
  const [p, setP] = useState(0)
  return (
    <div className="sheet">
      {p === 0 && (
        <>
          <h3>勝ち方</h3>
          <p>あなたは秘密の条件札を3枚持つ。名前は<strong>空模様</strong>。札に書いてある状況が、今の空と手元で揃ったら点になる。</p>
          <p>揃ったと思って<strong>打つ</strong>。当たれば札の点数。外すとその札は崩れ、戻ってこない。</p>
          <p>誰かが3つ達成するか、空が8回出終わったとき、点が多い人の勝ち。</p>
        </>
      )}
      {p === 1 && (
        <>
          <h3>一手だけ、四人同時</h3>
          <p>毎ラウンド、袋から記号が3つ出る。左・中・右。全員が同じ3つを見る。</p>
          <ul>
            <li><b>取る</b>　その位置の記号を手元（軒下）へ。同じ位置を2人以上が取ったら、誰も貰えない。</li>
            <li><b>見る</b>　次の空の手がかりを得る。</li>
            <li><b>打つ</b>　待ち1枚を公開。今の空＋軒下で判定。</li>
          </ul>
        </>
      )}
      {p === 2 && (
        <>
          <h3>最初にやること</h3>
          <p>5枚配られる。3枚残す。残した3枚が今局の勝ち筋。他人には見えない。</p>
          <div className="ex-sky">
            <Tile sym="hi" />
            <Tile sym="ame" />
            <Tile sym="kaminari" />
          </div>
          <p>この空なら「三色の空」は打てる。「無雷」は打てない。</p>
        </>
      )}
      <div className="pager">
        {[0, 1, 2].map((i) => (
          <button key={i} className={p === i ? 'on' : ''} onClick={() => setP(i)}>
            {i + 1}
          </button>
        ))}
        {p < 2 ? (
          <button className="next" onClick={() => setP(p + 1)}>つぎへ</button>
        ) : (
          <span className="ready">これで卓に着ける</span>
        )}
      </div>
    </div>
  )
}

function Npc({ s }: { s: Seat }) {
  return (
    <div className={`npc ${s.npc} ${s.line ? 'spoke' : ''}`}>
      <img src={NPC_ART[s.npc]} alt={s.name} />
      <div>
        <strong>{s.name}</strong>
        <em>{s.line || NPC_ROLE[s.npc]}</em>
        <small>{scoreOf(s)}点　軒下{s.noki.length}</small>
      </div>
    </div>
  )
}

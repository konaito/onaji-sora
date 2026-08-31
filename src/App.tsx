import { useEffect, useMemo, useState } from 'react'
import {
  type Action,
  type Game,
  type Seat,
  type Sym,
  JP,
  SYMBOLS,
  CARDS,
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
import * as se from './se'

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

function Tile({ sym, large }: { sym: Sym; large?: boolean }) {
  return (
    <img
      className={`tile ${large ? 'lg' : ''}`}
      src={art(`sym/${sym}.png`)}
      alt={JP[sym]}
      draggable={false}
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
  const [refOpen, setRefOpen] = useState(false)
  const [flash, setFlash] = useState('')
  const [mute, setMute] = useState(false)
  const me = g.seats[0]!

  const reset = () => {
    se.unlock()
    se.wood()
    setG(newGame())
    setPick([])
    setUtsuId(null)
    setBet(null)
  }

  const sit = () => {
    se.unlock()
    se.wood()
    setHelp(false)
    setG((x) => startDraft(x))
  }

  const toggleKeep = (id: number) => {
    se.unlock()
    se.paper()
    setPick((p) => (p.includes(id) ? p.filter((n) => n !== id) : p.length >= 3 ? p : [...p, id]))
  }

  const confirmDraft = () => {
    if (pick.length !== 3) return
    se.unlock()
    se.stamp()
    setG((x) => {
      const next = beginPlay(keepDraft(x, 0, pick))
      window.setTimeout(() => se.sky(), 180)
      return next
    })
  }

  const commit = (a: Action) => {
    se.unlock()
    if (a.t === 'toru') se.toru()
    else if (a.t === 'miru') se.miru()
    else se.utsu()
    setFlash(a.t === 'toru' ? '取る' : a.t === 'miru' ? '見る' : '打つ')
    setG((x) => {
      const next = lockNpcs(lock(x, 0, a))
      const added = next.log.slice(x.log.length)
      if (added.some((l) => l.includes('衝突'))) window.setTimeout(() => se.collide(), 80)
      if (added.some((l) => l.includes('達成'))) window.setTimeout(() => se.hit(), 90)
      if (added.some((l) => l.includes('崩れ'))) window.setTimeout(() => se.miss(), 90)
      if (next.phase === 'play' && next.round !== x.round) window.setTimeout(() => se.sky(), 220)
      return next
    })
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
      {g.phase === 'play' && <p className="round">ラウンド {g.round}/8</p>}
      {g.phase === 'draft' && <p className="round">手札 {pick.length}/3</p>}
      <div className="guides">
        <button className="guide" onClick={() => setHelp(true)}>遊び方</button>
        <button className="guide" onClick={() => setRefOpen(true)}>早見</button>
        <button
          className="guide"
          onClick={() => {
            const v = !mute
            setMute(v)
            se.setMuted(v)
            if (!v) {
              se.unlock()
              se.paper()
            }
          }}
        >
          {mute ? '音オフ' : '音'}
        </button>
      </div>

      {g.phase === 'title' && (
        <div className="titlewrap">
          <p className="kicker">勝利条件は得点。同時手番で、取る／見る／打つのどれか1つ。</p>
          <HowTo onOpenRef={() => { setHelp(false); setRefOpen(true) }} />
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
          <p className="coach">5枚配られた。3枚を手札に残し、2枚は山札に戻す。</p>
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
            {pick.length === 3 ? 'この3枚を手札にする' : `あと${3 - pick.length}枚選ぶ`}
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
              <p className="coach">場の左・中・右。同時手番で取る／見る／打つのどれか1つ。同じ位置は衝突。プレイして外すと捨て札。</p>
            )}
            <p className="lbl">場</p>
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
            <p className="lbl">捨て場 {g.kishutsu.length}</p>
            <div className="river">
              {g.kishutsu.map((sym, i) => (
                <Tile key={`${i}-${sym}`} sym={sym} />
              ))}
            </div>
          </section>

          <section className="self">
            <div className="noki">
              <p className="lbl">自分の場</p>
              <div className="row">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="slot">
                    {me.noki[i] ? <Tile sym={me.noki[i]!} /> : <span className="empty" />}
                  </div>
                ))}
              </div>
            </div>
            <p className="lbl">手札</p>
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
                <small>タイル袋の上を見る　トークン {me.obs}/2</small>
              </button>
              {([0, 1, 2] as const).map((i) => (
                <button key={i} className="act" disabled={waiting || g.phase !== 'play'} onClick={() => commit({ t: 'toru', i })}>
                  取る {['左', '中', '右'][i]}
                  <small>自分の場へ。衝突は誰も得ない</small>
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
                <span>追加宣言　次の場に出たら＋3、外れは捨て札</span>
                {SYMBOLS.map((s) => (
                  <button key={s} className={bet === s ? 'on' : ''} onClick={() => setBet((x) => (x === s ? null : s))}>
                    {JP[s]}
                  </button>
                ))}
              </div>
            )}
            <p className="score">
              {scoreOf(me)}点　成功 {confirmedCount(me)}／3　捨て札 {me.broken.length}
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
            <HowTo onOpenRef={() => { setHelp(false); setRefOpen(true) }} />
            <button className="guide close" onClick={() => setHelp(false)}>とじる</button>
          </article>
        </div>
      )}

      {refOpen && (
        <div className="help" onClick={() => setRefOpen(false)}>
          <article className="refart" onClick={(e) => e.stopPropagation()}>
            <RefSheet />
            <button className="guide close" onClick={() => setRefOpen(false)}>とじる</button>
          </article>
        </div>
      )}
    </div>
  )
}

function HowTo({ onOpenRef }: { onOpenRef?: () => void }) {
  return (
    <div className="sheet">
      <h3>遊び方</h3>
      <h4>1. 勝利条件</h4>
      <p>手札をプレイして得点する。8ラウンド終了時、または誰かが3回成功したとき、得点が一番多い人が勝ち。</p>
      <h4>2. 準備</h4>
      <p>山札から5枚配られる。3枚を<strong>手札</strong>に残し、2枚は山札に戻す。手札は非公開。</p>
      <h4>3. ラウンド（同時手番）</h4>
      <p>タイル袋から3枚を<strong>場</strong>に出す（左・中・右）。全員が同じ場を見る。各プレイヤーは同時に、次のアクションを<strong>1つ</strong>選ぶ。</p>
      <ul className="acts-mini">
        <li><b>取る</b>　場の左／中／右からタイル1枚を自分の場へ。同じ位置を2人以上が取ったら衝突で、誰も得ない。</li>
        <li><b>見る</b>　タイル袋の上を見て、次の場の手がかりを得る。</li>
        <li><b>打つ</b>　手札1枚をプレイする。今の場と自分の場で条件を満たせば得点。満たさなければそのカードは捨て札になり、戻らない。</li>
      </ul>
      <h4>4. 例</h4>
      <p>今の場がこれだとする。</p>
      <div className="ex-sky">
        <div className="sym"><Tile sym="hi" /><span>左</span></div>
        <div className="sym"><Tile sym="ame" /><span>中</span></div>
        <div className="sym"><Tile sym="kaminari" /><span>右</span></div>
      </div>
      <ul>
        <li>手札「三色の空」（場が3色）をプレイ → 成功、3点</li>
        <li>手札「無雷」（雷が0）をプレイ → 失敗、捨て札</li>
        <li>左を取る → 日が自分の場へ。他の人も左なら衝突で誰も得ない</li>
      </ul>
      <p className="refnote">最初は場の3枚と手札3枚だけ見ればいい。カード一覧は早見。カード文の「空」は場、「軒下」は自分の場、「既出」は捨て場。</p>
      {onOpenRef && (
        <p><button type="button" className="next" onClick={onOpenRef}>カード一覧（早見）</button></p>
      )}
    </div>
  )
}


const GROUPS: { title: string; hint: string; ids: number[] }[] = [
  { title: '空き軒', hint: '自分の場が0枚のとき', ids: [1, 2, 3] },
  { title: '満軒', hint: '自分の場が3枚のとき。成功すると自分の場は空になる', ids: [4, 5, 6] },
  { title: '偏り', hint: '場＋自分の場の合計', ids: [7, 8, 9] },
  { title: '同居', hint: '特定の記号が同時にいる', ids: [10, 11, 12, 13] },
  { title: 'なし', hint: '特定の記号がゼロ', ids: [14, 15, 16] },
  { title: '数え・色', hint: '枚数や色の形', ids: [17, 18, 19, 20, 21, 22] },
  { title: '捨て場', hint: '捨て場の公開情報', ids: [23, 24] },
]
const WHERE: Record<number, string> = {
  1: '自分の場', 2: '自分の場と場', 3: '自分の場と場',
  4: '自分の場', 5: '自分の場と場', 6: '自分の場',
  7: '場＋自分の場', 8: '場＋自分の場', 9: '場＋自分の場',
  10: '場＋自分の場', 11: '場＋自分の場', 12: '場のみ', 13: '場＋自分の場',
  14: '場＋自分の場', 15: '場＋自分の場', 16: '場のみ',
  17: '場＋自分の場', 18: '場＋自分の場', 19: '場＋自分の場',
  20: '場のみ', 21: '場のみ', 22: '場のみ',
  23: '捨て場と場', 24: '捨て場',
}
const COST: Record<string, string> = {
  all: '成功で自分の場を空に',
  kaze: '成功で風を捨てる',
  kaminari: '成功で雷を捨てる',
  'one-hi': '成功で日を1つ捨てる',
  tsuki: '成功で月を捨てる',
}

function RefSheet() {
  return (
    <div className="ref">
      <h3>早見</h3>
      <section>
        <h4>タイル　各8枚、タイル袋へ</h4>
        <div className="ex-sky">
          {SYMBOLS.map((s) => (
            <div key={s} className="sym">
              <Tile sym={s} />
              <span>{JP[s]}</span>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h4>構成</h4>
        <ul>
          <li><b>山札</b>　空模様カードの残り。裏向き。</li>
          <li><b>手札</b>　自分の空模様。3枚。非公開。</li>
          <li><b>場</b>　今ラウンドのタイル3枚。左・中・右。公開。</li>
          <li><b>自分の場</b>　得たタイル。最大3。溢れた1枚は捨て場へ。</li>
          <li><b>捨て場</b>　場に残ったタイル。公開。</li>
          <li><b>捨て札</b>　プレイに失敗した手札。0点。戻らない。</li>
        </ul>
      </section>
      <section>
        <h4>アクション（同時手番で1つ）</h4>
        <ul>
          <li><b>取る</b>　場の左／中／右のタイル1枚を自分の場へ得る。同じ位置は衝突で誰も得ない。</li>
          <li><b>見る</b>　タイル袋の上を見る（トークン、最大2）。</li>
          <li><b>打つ</b>　手札1枚をプレイする。場＋自分の場で判定（カードによる）。</li>
        </ul>
      </section>
      <section>
        <h4>カード　空模様24枚</h4>
        <p className="refnote">点は成功時の得点。「参照」は判定に使う場所。カード文の「空」は場、「軒下」は自分の場、「既出」は捨て場。</p>
        {GROUPS.map((g) => (
          <div key={g.title} className="g">
            <h5>{g.title}<small>{g.hint}</small></h5>
            <table>
              <thead>
                <tr><th>点</th><th>カード</th><th>条件</th><th>参照</th></tr>
              </thead>
              <tbody>
                {g.ids.map((id) => {
                  const c = CARDS.find((x) => x.id === id)!
                  return (
                    <tr key={id}>
                      <td className="vp">{c.vp}</td>
                      <td className="nm">{c.name}</td>
                      <td>{c.text}{c.consume ? `　${COST[c.consume]}` : ''}</td>
                      <td className="wh">{WHERE[id]}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}
      </section>
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
        <small>{scoreOf(s)}点　自分の場{s.noki.length}</small>
      </div>
    </div>
  )
}

export type Sym = 'hi' | 'tsuki' | 'ame' | 'kaze' | 'kaminari' | 'hoshi'
export const SYMBOLS: Sym[] = ['hi', 'tsuki', 'ame', 'kaze', 'kaminari', 'hoshi']
export const JP: Record<Sym, string> = {
  hi: '日', tsuki: '月', ame: '雨', kaze: '風', kaminari: '雷', hoshi: '星',
}

export type Action =
  | { t: 'miru' }
  | { t: 'toru'; i: 0 | 1 | 2 }
  | { t: 'utsu'; id: number; bet?: Sym }

export type Ctx = { sky: Sym[]; noki: Sym[]; kishutsu: Sym[] }
export type Card = {
  id: number
  name: string
  vp: number
  text: string
  consume?: 'all' | 'kaze' | 'kaminari' | 'one-hi' | 'tsuki'
  ok: (c: Ctx) => boolean
}

function empty(): Record<Sym, number> {
  return { hi: 0, tsuki: 0, ame: 0, kaze: 0, kaminari: 0, hoshi: 0 }
}
export function tally(xs: Sym[]): Record<Sym, number> {
  const c = empty()
  for (const x of xs) c[x]++
  return c
}
function kinds(c: Record<Sym, number>): number {
  return SYMBOLS.filter((s) => c[s] > 0).length
}
function most(c: Record<Sym, number>, s: Sym): boolean {
  return c[s] >= 1 && SYMBOLS.every((o) => o === s || c[s] > c[o])
}
function leastPresent(c: Record<Sym, number>, s: Sym): boolean {
  if (c[s] < 1) return false
  const present = SYMBOLS.filter((o) => c[o] > 0)
  return present.length >= 2 && present.every((o) => o === s || c[s] < c[o])
}
function pairPlus(sky: Sym[]): boolean {
  const c = tally(sky)
  return SYMBOLS.some((s) => c[s] >= 2)
}

export const CARDS: Card[] = [
  { id: 1, name: '空き軒の祈り', vp: 2, text: '軒下0', ok: (c) => c.noki.length === 0 },
  { id: 2, name: '空き軒・双', vp: 4, text: '軒下0かつ空に同じ記号2+', ok: (c) => c.noki.length === 0 && pairPlus(c.sky) },
  { id: 3, name: '空き軒・三色', vp: 5, text: '軒下0かつ空が3色', ok: (c) => c.noki.length === 0 && new Set(c.sky).size === 3 },
  { id: 4, name: '満軒', vp: 5, text: '軒下ちょうど3', consume: 'all', ok: (c) => c.noki.length === 3 },
  { id: 5, name: '満軒・無雷', vp: 6, text: '軒下3かつ雷0', consume: 'all', ok: (c) => c.noki.length === 3 && tally([...c.sky, ...c.noki]).kaminari === 0 },
  { id: 6, name: '満軒・三色軒', vp: 6, text: '軒下3枚が全部違う', consume: 'all', ok: (c) => c.noki.length === 3 && new Set(c.noki).size === 3 },
  { id: 7, name: '風盛り', vp: 4, text: '風が唯一の最多', consume: 'kaze', ok: (c) => most(tally([...c.sky, ...c.noki]), 'kaze') },
  { id: 8, name: '星かすか', vp: 5, text: '星が唯一の最少（星以外もある）', ok: (c) => leastPresent(tally([...c.sky, ...c.noki]), 'hoshi') },
  { id: 9, name: '雷過半', vp: 6, text: '雷が合計の半分より多い', consume: 'kaminari', ok: (c) => {
    const xs = [...c.sky, ...c.noki]
    return tally(xs).kaminari > xs.length / 2
  }},
  { id: 10, name: '日月同居', vp: 3, text: '日と月がいる', ok: (c) => { const x = tally([...c.sky, ...c.noki]); return x.hi >= 1 && x.tsuki >= 1 } },
  { id: 11, name: '雨風同居', vp: 3, text: '雨と風がいる', ok: (c) => { const x = tally([...c.sky, ...c.noki]); return x.ame >= 1 && x.kaze >= 1 } },
  { id: 12, name: '空の雷星', vp: 5, text: '空に雷と星', ok: (c) => { const x = tally(c.sky); return x.kaminari >= 1 && x.hoshi >= 1 } },
  { id: 13, name: '日雨無雷', vp: 5, text: '日と雨がいて雷0', ok: (c) => { const x = tally([...c.sky, ...c.noki]); return x.hi >= 1 && x.ame >= 1 && x.kaminari === 0 } },
  { id: 14, name: '無雷', vp: 2, text: '雷0', ok: (c) => tally([...c.sky, ...c.noki]).kaminari === 0 },
  { id: 15, name: '旱天', vp: 4, text: '雨0かつ雷0', ok: (c) => { const x = tally([...c.sky, ...c.noki]); return x.ame === 0 && x.kaminari === 0 } },
  { id: 16, name: '空に星なし', vp: 3, text: '空に星0', ok: (c) => tally(c.sky).hoshi === 0 },
  { id: 17, name: '日ちょうど二', vp: 4, text: '日がちょうど2', consume: 'one-hi', ok: (c) => tally([...c.sky, ...c.noki]).hi === 2 },
  { id: 18, name: '月ちょうど三', vp: 5, text: '月がちょうど3', consume: 'tsuki', ok: (c) => tally([...c.sky, ...c.noki]).tsuki === 3 },
  { id: 19, name: '二種のみ', vp: 5, text: '記号がちょうど2種類', ok: (c) => kinds(tally([...c.sky, ...c.noki])) === 2 },
  { id: 20, name: '三色の空', vp: 3, text: '空が3色', ok: (c) => new Set(c.sky).size === 3 },
  { id: 21, name: '二つ同じ空', vp: 4, text: '空が2+1', ok: (c) => {
    const vals = SYMBOLS.map((s) => tally(c.sky)[s]).sort((a, b) => b - a)
    return vals[0] === 2 && vals[1] === 1
  }},
  { id: 22, name: '一色の空', vp: 7, text: '空が全部同じ', ok: (c) => c.sky.length === 3 && c.sky.every((x) => x === c.sky[0]) },
  { id: 23, name: '既出の日四つ', vp: 6, text: '既出に日4+かつ今の空に日', ok: (c) => tally(c.kishutsu).hi >= 4 && tally(c.sky).hi >= 1 },
  { id: 24, name: '六記既出', vp: 7, text: '既出に6記号すべて', ok: (c) => SYMBOLS.every((s) => tally(c.kishutsu)[s] >= 1) },
]

export function card(id: number): Card {
  const x = CARDS.find((c) => c.id === id)
  if (!x) throw new Error('missing card')
  return x
}

function mulberry(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function shuffle<T>(xs: T[], rnd: () => number): T[] {
  const a = xs.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    const tmp = a[i]!
    a[i] = a[j]!
    a[j] = tmp
  }
  return a
}

export type Achieve = { id: number; vp: number; bet?: Sym; confirmed: boolean }
export type Seat = {
  name: string
  npc: 'human' | 'kangetsu' | 'shuu' | 'toorai'
  draft: number[]
  hand: number[]
  noki: Sym[]
  achieved: Achieve[]
  broken: number[]
  obs: number
  last?: Action
  line: string
}
export type Phase = 'title' | 'draft' | 'play' | 'end'
export type Game = {
  seed: number
  rnd: () => number
  bag: Sym[]
  kishutsu: Sym[]
  unused: number[]
  sky: Sym[]
  round: number
  phase: Phase
  seats: Seat[]
  locked: (Action | null)[]
  log: string[]
  catchupUsed: boolean[]
  winner: number[]
}

const NAMES = ['あなた', '観月', '拾雨', '踏雷'] as const
const NPCS: Seat['npc'][] = ['human', 'kangetsu', 'shuu', 'toorai']

export function scoreOf(s: Seat): number {
  return s.achieved.filter((a) => a.confirmed).reduce((n, a) => n + a.vp, 0)
}
export function confirmedCount(s: Seat): number {
  return s.achieved.filter((a) => a.confirmed).length
}

export function newGame(seed = Date.now()): Game {
  const rnd = mulberry(seed)
  const bag = shuffle(SYMBOLS.flatMap((s) => Array<Sym>(8).fill(s)), rnd)
  const deck = shuffle(CARDS.map((c) => c.id), rnd)
  const seats: Seat[] = [0, 1, 2, 3].map((i) => ({
    name: NAMES[i]!,
    npc: NPCS[i]!,
    draft: deck.slice(i * 5, i * 5 + 5),
    hand: [],
    noki: [],
    achieved: [],
    broken: [],
    obs: 0,
    line: '',
  }))
  return {
    seed, rnd, bag, kishutsu: [], unused: deck.slice(20), sky: [], round: 0,
    phase: 'title', seats, locked: [null, null, null, null],
    log: [], catchupUsed: [false, false, false, false], winner: [],
  }
}

export function startDraft(g: Game): Game {
  return { ...g, phase: 'draft' }
}

export function keepDraft(g: Game, seat: number, keep: number[]): Game {
  const s = { ...g.seats[seat]! }
  if (keep.length !== 3 || !keep.every((id) => s.draft.includes(id))) return g
  const back = s.draft.filter((id) => !keep.includes(id))
  s.hand = keep
  s.draft = []
  const seats = g.seats.map((x, i) => (i === seat ? s : x))
  return { ...g, seats, unused: [...g.unused, ...back] }
}

function npcKeep(g: Game, seat: number): Game {
  const ranked = g.seats[seat]!.draft.slice().sort((a, b) => card(b).vp - card(a).vp)
  return keepDraft(g, seat, ranked.slice(0, 3))
}

export function beginPlay(g: Game): Game {
  let x = g
  for (let i = 1; i < 4; i++) {
    if (x.seats[i]!.hand.length === 0) x = npcKeep(x, i)
  }
  return dealSky(x, 1)
}

function dealSky(g: Game, round: number): Game {
  const bag = g.bag.slice()
  const sky: Sym[] = [bag.shift()!, bag.shift()!, bag.shift()!]
  const log = [...g.log, `第${round}の空：${sky.map((x) => JP[x]).join('・')}`]
  const seats = g.seats.map((s) => resolveBets({ ...s, last: undefined, line: '' }, sky, log))
  return { ...g, bag, sky, round, phase: 'play', seats, locked: [null, null, null, null], log }
}

function resolveBets(s: Seat, sky: Sym[], log: string[]): Seat {
  const broken = s.broken.slice()
  const achieved: Achieve[] = []
  for (const a of s.achieved) {
    if (a.confirmed || !a.bet) {
      achieved.push(a)
      continue
    }
    if (sky.includes(a.bet)) {
      log.push(`${s.name}の賭け当たり（${JP[a.bet]}）+3`)
      achieved.push({ ...a, confirmed: true, vp: a.vp + 3 })
    } else {
      log.push(`${s.name}の賭け外れ。${card(a.id).name}は崩れ`)
      broken.push(a.id)
    }
  }
  return { ...s, achieved, broken }
}

export function lock(g: Game, seat: number, a: Action): Game {
  if (g.phase !== 'play' || g.locked[seat]) return g
  const act: Action = a.t === 'utsu' && g.round >= 8 ? { t: 'utsu', id: a.id } : a
  const locked = g.locked.slice() as (Action | null)[]
  locked[seat] = act
  const next: Game = { ...g, locked }
  if (locked.every(Boolean)) return resolveRound(next)
  return next
}

function resolveRound(g: Game): Game {
  const acts = g.locked as Action[]
  const log = [...g.log]
  const seats = g.seats.map((s, i) => ({ ...s, last: acts[i], line: label(acts[i]!) }))
  const skySlots = g.sky.slice() as (Sym | null)[]
  let kishutsu = g.kishutsu.slice()

  for (let i = 0; i < 4; i++) {
    if (acts[i]!.t !== 'miru') continue
    if (seats[i]!.obs < 2) seats[i]!.obs += 1
    log.push(`${seats[i]!.name}は見る`)
  }
  const claims: number[][] = [[], [], []]
  for (let i = 0; i < 4; i++) {
    const a = acts[i]!
    if (a.t === 'toru') claims[a.i]!.push(i)
  }
  for (let slot = 0; slot < 3; slot++) {
    const who = claims[slot]!
    if (who.length === 1) {
      const p = who[0]!
      const tile = skySlots[slot]
      if (!tile) continue
      skySlots[slot] = null
      const s = seats[p]!
      if (s.noki.length >= 3) {
        kishutsu.push(s.noki[0]!)
        s.noki = s.noki.slice(1)
      }
      s.noki = [...s.noki, tile]
      log.push(`${s.name}は${JP[tile]}を取る`)
    } else if (who.length > 1) {
      log.push(`${['左', '中', '右'][slot]}は衝突`)
    }
  }
  const publicSky = g.sky
  for (let i = 0; i < 4; i++) {
    const a = acts[i]!
    if (a.t !== 'utsu') continue
    const s = seats[i]!
    if (!s.hand.includes(a.id)) continue
    const cd = card(a.id)
    const ok = cd.ok({ sky: publicSky, noki: s.noki, kishutsu })
    s.hand = s.hand.filter((id) => id !== a.id)
    if (ok) {
      let bet = a.bet
      if (!bet || s.obs < 1 || g.round >= 8) bet = undefined
      else s.obs -= 1
      s.achieved = [...s.achieved, { id: a.id, vp: cd.vp, bet, confirmed: !bet }]
      if (cd.consume) s.noki = consumeNoki(s.noki, cd.consume)
      log.push(`${s.name}、${cd.name} 達成（${cd.vp}）`)
    } else {
      s.broken = [...s.broken, a.id]
      log.push(`${s.name}、${cd.name} 崩れ`)
    }
  }
  for (const t of skySlots) if (t) kishutsu.push(t)
  let next: Game = { ...g, kishutsu, seats, log, locked: [null, null, null, null] }
  if (g.round === 4) next = maybeCatchup(next)
  if (next.seats.some((s) => confirmedCount(s) >= 3) || g.round >= 8) return finish(next)
  return dealSky(next, g.round + 1)
}

function consumeNoki(noki: Sym[], kind: NonNullable<Card['consume']>): Sym[] {
  if (kind === 'all') return []
  if (kind === 'kaze') return noki.filter((x) => x !== 'kaze')
  if (kind === 'kaminari') return noki.filter((x) => x !== 'kaminari')
  if (kind === 'tsuki') return noki.filter((x) => x !== 'tsuki')
  const i = noki.indexOf('hi')
  return i < 0 ? noki : noki.filter((_, j) => j !== i)
}

function maybeCatchup(g: Game): Game {
  const unused = g.unused.slice()
  const used = g.catchupUsed.slice()
  const seats = g.seats.map((s, i) => {
    if (used[i] || confirmedCount(s) !== 0 || s.broken.length < 1 || unused.length < 1) return s
    used[i] = true
    const id = unused.shift()!
    g.log.push(`${s.name}は崩れを捨て、新しい空模様を引く`)
    return { ...s, broken: s.broken.slice(1), hand: [...s.hand, id] }
  })
  return { ...g, unused, seats, catchupUsed: used }
}

function finish(g: Game): Game {
  const rows = g.seats.map((s, i) => ({
    i, vp: scoreOf(s), ach: confirmedCount(s), br: s.broken.length, nk: s.noki.length,
  }))
  rows.sort((a, b) => b.vp - a.vp || b.ach - a.ach || a.br - b.br || a.nk - b.nk)
  const t = rows[0]!
  const winner = rows.filter((x) => x.vp === t.vp && x.ach === t.ach && x.br === t.br && x.nk === t.nk).map((x) => x.i)
  return { ...g, phase: 'end', winner, log: [...g.log, '局終了'] }
}

function label(a: Action): string {
  if (a.t === 'miru') return '見る'
  if (a.t === 'toru') return `取る・${['左', '中', '右'][a.i]}`
  return `打つ・${card(a.id).name}`
}

export function npcAction(g: Game, seat: number): Action {
  const s = g.seats[seat]!
  const ctx: Ctx = { sky: g.sky, noki: s.noki, kishutsu: g.kishutsu }
  const hits = s.hand.filter((id) => card(id).ok(ctx)).sort((a, b) => card(b).vp - card(a).vp)
  const best = hits[0]
  const want: Partial<Record<Sym, number>> = {}
  for (const id of s.hand) {
    const cd = card(id)
    if (cd.ok(ctx)) continue
    for (const sym of g.sky) {
      const noki = s.noki.length >= 3 ? [...s.noki.slice(1), sym] : [...s.noki, sym]
      if (cd.ok({ ...ctx, noki })) want[sym] = (want[sym] ?? 0) + cd.vp
    }
  }
  const bestWant = SYMBOLS.map((sym) => [sym, want[sym] ?? 0] as const).sort((a, b) => b[1] - a[1])[0]
  const slotOf = (sym: Sym): 0 | 1 | 2 | null => {
    const i = g.sky.indexOf(sym)
    return i === 0 || i === 1 || i === 2 ? i : null
  }
  const takeWanted = (): Action | null => {
    if (!bestWant || bestWant[1] <= 0) return null
    const sl = slotOf(bestWant[0])
    return sl === null ? null : { t: 'toru', i: sl }
  }

  if (s.npc === 'kangetsu') {
    if (best && card(best).vp >= 5) return maybeBet(g, s, best)
    if (s.obs < 1 && g.round < 8) return { t: 'miru' }
    if (best) return maybeBet(g, s, best)
    return takeWanted() ?? { t: 'miru' }
  }
  if (s.npc === 'shuu') {
    const tw = takeWanted()
    if (tw) return tw
    if (best) return { t: 'utsu', id: best }
    return { t: 'toru', i: (seat % 3) as 0 | 1 | 2 }
  }
  if (best && card(best).vp >= 4) return maybeBet(g, s, best)
  if (best) return maybeBet(g, s, best)
  const tw = takeWanted()
  if (tw) return tw
  if (s.obs < 1) return { t: 'miru' }
  return { t: 'toru', i: 1 }
}

function maybeBet(g: Game, s: Seat, id: number): Action {
  if (s.obs < 1 || g.round >= 8) return { t: 'utsu', id }
  const c = tally(g.kishutsu)
  const rare = SYMBOLS.slice().sort((a, b) => c[a] - c[b])[0]!
  return { t: 'utsu', id, bet: rare }
}

export function lockNpcs(g: Game): Game {
  let x = g
  for (let i = 1; i < 4; i++) {
    if (!x.locked[i]) x = lock(x, i, npcAction(x, i))
  }
  return x
}

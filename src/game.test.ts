import { describe, expect, it } from 'vitest'
import { CARDS, type Ctx, type Sym } from './game'

const ctx = (sky: Sym[], noki: Sym[] = [], kishutsu: Sym[] = []): Ctx => ({ sky, noki, kishutsu })
const find = (id: number) => CARDS.find((c) => c.id === id)!

describe('空模様', () => {
  it('1 空き軒', () => {
    expect(find(1).ok(ctx(['hi', 'ame', 'kaze'], []))).toBe(true)
    expect(find(1).ok(ctx(['hi', 'ame', 'kaze'], ['hi']))).toBe(false)
  })
  it('2 空き軒・双', () => {
    expect(find(2).ok(ctx(['hi', 'hi', 'ame']))).toBe(true)
    expect(find(2).ok(ctx(['hi', 'ame', 'kaze']))).toBe(false)
  })
  it('3 空き軒・三色', () => {
    expect(find(3).ok(ctx(['hi', 'ame', 'kaze']))).toBe(true)
    expect(find(3).ok(ctx(['hi', 'hi', 'ame']))).toBe(false)
  })
  it('4 満軒', () => {
    expect(find(4).ok(ctx(['hi', 'ame', 'kaze'], ['hi', 'ame', 'kaze']))).toBe(true)
  })
  it('5 満軒・無雷', () => {
    expect(find(5).ok(ctx(['hi', 'ame', 'kaze'], ['hi', 'tsuki', 'hoshi']))).toBe(true)
    expect(find(5).ok(ctx(['hi', 'ame', 'kaminari'], ['hi', 'tsuki', 'hoshi']))).toBe(false)
  })
  it('6 満軒・三色軒', () => {
    expect(find(6).ok(ctx(['hi', 'hi', 'hi'], ['ame', 'kaze', 'hoshi']))).toBe(true)
  })
  it('7 風盛り', () => {
    expect(find(7).ok(ctx(['kaze', 'kaze', 'hi'], ['kaze']))).toBe(true)
    expect(find(7).ok(ctx(['kaze', 'hi', 'ame']))).toBe(false)
  })
  it('8 星かすか', () => {
    expect(find(8).ok(ctx(['hoshi', 'hi', 'hi'], ['ame', 'ame']))).toBe(true)
    expect(find(8).ok(ctx(['hoshi', 'hoshi', 'hoshi']))).toBe(false)
  })
  it('9 雷過半', () => {
    expect(find(9).ok(ctx(['kaminari', 'kaminari', 'hi']))).toBe(true)
    expect(find(9).ok(ctx(['kaminari', 'hi', 'ame']))).toBe(false)
  })
  it('10 日月', () => {
    expect(find(10).ok(ctx(['hi', 'tsuki', 'ame']))).toBe(true)
  })
  it('11 雨風', () => {
    expect(find(11).ok(ctx(['ame', 'kaze', 'hi']))).toBe(true)
  })
  it('12 空の雷星', () => {
    expect(find(12).ok(ctx(['kaminari', 'hoshi', 'hi'], ['kaminari']))).toBe(true)
    expect(find(12).ok(ctx(['hi', 'ame', 'kaze'], ['kaminari', 'hoshi']))).toBe(false)
  })
  it('13 日雨無雷', () => {
    expect(find(13).ok(ctx(['hi', 'ame', 'kaze']))).toBe(true)
    expect(find(13).ok(ctx(['hi', 'ame', 'kaminari']))).toBe(false)
  })
  it('14 無雷', () => {
    expect(find(14).ok(ctx(['hi', 'ame', 'kaze']))).toBe(true)
  })
  it('15 旱天', () => {
    expect(find(15).ok(ctx(['hi', 'tsuki', 'kaze']))).toBe(true)
    expect(find(15).ok(ctx(['hi', 'ame', 'kaze']))).toBe(false)
  })
  it('16 空に星なし', () => {
    expect(find(16).ok(ctx(['hi', 'ame', 'kaze'], ['hoshi']))).toBe(true)
    expect(find(16).ok(ctx(['hi', 'ame', 'hoshi']))).toBe(false)
  })
  it('17 日ちょうど二', () => {
    expect(find(17).ok(ctx(['hi', 'ame', 'kaze'], ['hi']))).toBe(true)
  })
  it('18 月ちょうど三', () => {
    expect(find(18).ok(ctx(['tsuki', 'tsuki', 'hi'], ['tsuki']))).toBe(true)
  })
  it('19 二種のみ', () => {
    expect(find(19).ok(ctx(['hi', 'hi', 'ame']))).toBe(true)
    expect(find(19).ok(ctx(['hi', 'ame', 'kaze']))).toBe(false)
  })
  it('20 三色の空', () => {
    expect(find(20).ok(ctx(['hi', 'ame', 'kaze']))).toBe(true)
  })
  it('21 二つ同じ空', () => {
    expect(find(21).ok(ctx(['hi', 'hi', 'ame']))).toBe(true)
    expect(find(21).ok(ctx(['hi', 'hi', 'hi']))).toBe(false)
  })
  it('22 一色の空', () => {
    expect(find(22).ok(ctx(['hi', 'hi', 'hi']))).toBe(true)
  })
  it('23 既出の日四つ', () => {
    expect(find(23).ok(ctx(['hi', 'ame', 'kaze'], [], ['hi', 'hi', 'hi', 'hi']))).toBe(true)
    expect(find(23).ok(ctx(['ame', 'kaze', 'hoshi'], [], ['hi', 'hi', 'hi', 'hi']))).toBe(false)
  })
  it('24 六記既出', () => {
    expect(find(24).ok(ctx(['hi', 'hi', 'hi'], [], ['hi', 'tsuki', 'ame', 'kaze', 'kaminari', 'hoshi']))).toBe(true)
  })
})

const MIN = 1;
const MAX = 300;
const MAX_COUNT = 1000;
const CLASSES = [
  { from: 1, size: 9 },
  { from: 10, size: 90 },
  { from: 100, size: 201 },
];
const classOf = (x) => (x < 10 ? 0 : x < 100 ? 1 : 2);

const BASE = 95n;
const toChar = (d) => String.fromCharCode(32 + d);
const fromChar = (c) => {
  const d = c.charCodeAt(0) - 32;
  if (d < 0 || d >= 95) throw new Error(`недопустимый символ: ${JSON.stringify(c)}`);
  return BigInt(d);
};

function bigToString(v) {
  let s = '';
  while (v > 0n) {
    s = toChar(Number(v % BASE)) + s;
    v /= BASE;
  }
  return s;
}

function stringToBig(s) {
  let v = 0n;
  for (const c of s) v = v * BASE + fromChar(c);
  return v;
}

function binom(n, k) {
  k = Math.min(k, n - k);
  let r = 1n;
  for (let i = 1; i <= k; i++) r = (r * BigInt(n - k + i)) / BigInt(i);
  return r;
}

const count = (n, k) => binom(n + k - 1, n);

function rank(values, k) {
  let m = values.length + k - 1;
  let s = values.length;
  let ways = binom(m, s);
  let r = 0n;
  let v = 0;
  for (const x of values) {
    for (; v < x; v++, m--) ways = (ways * BigInt(m - s)) / BigInt(m);
    r += (ways * BigInt(m - s)) / BigInt(m);
    ways = (ways * BigInt(s)) / BigInt(m);
    s--;
    m--;
  }
  return r;
}

function unrank(r, n, k) {
  let m = n + k - 1;
  let s = n;
  let ways = binom(m, s);
  const values = [];
  for (let v = 0; s > 0; m--) {
    const bars = (ways * BigInt(m - s)) / BigInt(m);
    if (r >= bars) {
      values.push(v);
      r -= bars;
      ways = (ways * BigInt(s)) / BigInt(m);
      s--;
    } else {
      v++;
      ways = bars;
    }
  }
  return values;
}

function validate(numbers) {
  if (!Array.isArray(numbers)) throw new TypeError('ожидается массив');
  if (numbers.length > MAX_COUNT) throw new RangeError(`больше ${MAX_COUNT} чисел`);
  for (const x of numbers) {
    if (!Number.isInteger(x) || x < MIN || x > MAX) throw new RangeError(`число вне диапазона ${MIN}..${MAX}: ${x}`);
  }
}

const SMALL = 32;
const countSize = (flag) => BigInt(flag ? MAX_COUNT + 1 : SMALL);

function serialize(numbers) {
  validate(numbers);
  const sorted = [...numbers].sort((a, b) => a - b);
  const parts = [
    [sorted.map(classOf), CLASSES.length],
    ...CLASSES.map((c, i) => [sorted.filter((x) => classOf(x) === i).map((x) => x - c.from), c.size]),
  ];
  let v = 0n;
  for (const [values, k] of parts.reverse()) v = v * count(values.length, k) + rank(values, k);
  const n = sorted.length;
  const flag = n < SMALL ? 0 : 1;
  return bigToString((v * countSize(flag) + BigInt(n)) * 2n + BigInt(flag));
}

function deserialize(str) {
  let v = stringToBig(str);
  const take = (n, k) => {
    const total = count(n, k);
    const r = v % total;
    v /= total;
    return unrank(r, n, k);
  };
  const size = countSize(Number(v % 2n));
  v /= 2n;
  const n = Number(v % size);
  v /= size;
  const classes = take(n, CLASSES.length);
  return CLASSES.flatMap((c, i) => take(classes.filter((x) => x === i).length, c.size).map((x) => x + c.from));
}

module.exports = { serialize, deserialize };

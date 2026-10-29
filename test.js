const fs = require('fs');
const path = require('path');
const { serialize, deserialize } = require('./serializer');

function makeRandom(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = makeRandom(42);
const rnd = (n, max = 300) => Array.from({ length: n }, () => 1 + Math.floor(random() * max));
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const naive = (arr) => arr.join(',');
const byNum = (x, y) => x - y;
const sameMultiset = (a, b) => {
  if (a.length !== b.length) return false;
  const sa = [...a].sort(byNum), sb = [...b].sort(byNum);
  return sa.every((x, i) => x === sb[i]);
};

const cases = [
  ['пример из условия (4 числа)', [1, 300, 237, 188]],
  ['простой: 1,2,3,4,5', [1, 2, 3, 4, 5]],
  ['простой: 5 одинаковых', [7, 7, 7, 7, 7]],
  ['простой: 5 максимальных', [300, 300, 300, 300, 300]],
  ['самый тесный: 1,1,1,10,10', [1, 1, 1, 10, 10]],
  ['случайные 5', rnd(5)],
  ['случайные 50', rnd(50)],
  ['случайные 100', rnd(100)],
  ['случайные 500', rnd(500)],
  ['случайные 1000', rnd(1000)],
  ['все 1-значные (1..9)', range(1, 9)],
  ['все 2-значные (10..99)', range(10, 99)],
  ['все 3-значные (100..300)', range(100, 300)],
  ['каждого по 3 (900 чисел)', range(1, 300).flatMap((x) => [x, x, x])],
  ['1000 случайных 1-значных', rnd(1000, 9)],
  ['1000 раз число 300', Array(1000).fill(300)],
  ['1000 чисел 1..300 по кругу', Array.from({ length: 1000 }, (_, i) => (i % 300) + 1)],
];

let ok = true;
const report = [
  'Тесты сериализации. Строки взяты в « » — сама строка внутри, пробел тоже символ алфавита.',
  'Коэффициент = длина исходной / длина сжатой.',
  '',
];
console.log('     тест                           исходная  сжатая  коэфф.');
for (const [name, arr] of cases) {
  const src = naive(arr);
  const packed = serialize(arr);
  const pass = sameMultiset(arr, deserialize(packed)) && packed.length * 2 <= src.length;
  ok &&= pass;
  const ratio = (src.length / packed.length).toFixed(2);
  console.log(`${pass ? 'OK  ' : 'FAIL'} ${name.padEnd(30)} ${String(src.length).padStart(6)} ${String(packed.length).padStart(7)}  x${ratio}`);
  console.log(`     исходная: «${src.length > 60 ? src.slice(0, 60) + '…' : src}»`);
  console.log(`     сжатая:   «${packed}»\n`);
  report.push(
    `=== ${name}`,
    `исходная (${src.length}): «${src}»`,
    `сжатая (${packed.length}): «${packed}»`,
    `коэффициент сжатия: ${ratio}`,
    '',
  );
}
fs.writeFileSync(path.join(__dirname, 'results.txt'), report.join('\n'));
console.log('полные строки записаны в results.txt');

for (const bad of [[0, 1, 2, 3, 4], [1, 2, 3, 4, 301], [1, 2, 3, 4, 1.5], Array(1001).fill(1)]) {
  try {
    serialize(bad);
    ok = false;
    console.log('FAIL: не упал на неверном вводе', bad.slice(0, 6));
  } catch {}
}

let worst = { ratio: Infinity };
for (let t = 0; t < 100000; t++) {
  const n = 5 + Math.floor(random() * (t % 10 === 0 ? 996 : 30));
  const arr = rnd(n, [9, 99, 300, 30][t % 4]);
  const packed = serialize(arr);
  if (!sameMultiset(arr, deserialize(packed))) { ok = false; console.log('ROUNDTRIP FAIL', arr); break; }
  const ratio = naive(arr).length / packed.length;
  if (ratio < worst.ratio) worst = { ratio, arr };
}
console.log(`\nстресс 100 000 наборов: худший коэффициент x${worst.ratio.toFixed(2)} на [${worst.arr}]`);
console.log(ok && worst.ratio >= 2 ? 'ВСЁ ОК' : 'ЕСТЬ ПРОБЛЕМЫ');

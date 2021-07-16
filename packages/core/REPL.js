import Benchmark from 'benchmark';

let ia = 0;
let ib = 0;
let ic = 0;

let a = null;
let b = null;
let c = null;

const COUNT = 20;

const $keywords = {
  [Symbol('a')]: 12,
  [Symbol('b')]: 15,
  [Symbol('c')]: 17,
  [Symbol('d')]: 18,
  a: 11,
  b: 13,
  c: 14,
  d: 18,
};

global.gc(true);

const suite = new Benchmark.Suite();
suite
  .add('Object.keys', () => {
    a = Object.keys($keywords);
  })
  .add('Object.getOwnPropertyNames', () => {
    b = Object.getOwnPropertyNames($keywords);
  })
  .add('Symbol Map', () => {
    c = Object.getOwnPropertySymbols($keywords).concat(Object.keys($keywords));
  })
  .on('error', err => console.error(err))

  .on('cycle', function (event) {
    global.gc(true);
    console.log(String(event.target));
  })
  .on('complete', function () {
    console.log([a, b, c]);
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  });

suite.run();

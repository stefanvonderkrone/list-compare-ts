const measure = <TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  count: number,
  ...args: TArgs
) => {
  const start = performance.now();
  for (let i = 0; i < count; ++i) {
    fn(...args);
  }
  return performance.now() - start;
};

const rnd = (max: number) => Math.ceil(Math.random() * max);

const createList = (length: number, max: number) =>
  Array.from({ length }, () => rnd(max));

const list1 = createList(10000, 100);
const list2 = createList(10000, 200);

const mapSet = <T, U>(set: Set<T>, fn: (x: T) => U): U[] => {
  const count = set.size;
  let i = 0;
  const xs = new Array(count);
  for (const x of set) {
    xs[i] = fn(x);
    i++;
  }
  return xs;
};

// naive
const naive = <T>(
  list1: T[],
  list2: T[],
  comparator?: (a: T, b: T) => number
) => {
  // console.log(list1, list2);
  const set = new Set([...list1, ...list2].sort(comparator));
  // console.log(set);
  return {
    left: mapSet(set, (x) => (list1.includes(x) ? x : null)),
    right: mapSet(set, (x) => (list2.includes(x) ? x : null)),
  };
};

// map

const map = <T>(
  list1: T[],
  list2: T[],
  comparator?: (a: T, b: T) => number
) => {
  // intermediate map to store information whether key is in
  // list1 and/or list2
  // 1 means key is only in list1
  // 2 means key is only in list2
  // 3 means key is in both lists (bitwise OR 1 and 2: 1 | 2 = 3)
  const map = new Map<T, 1 | 2 | 3>();
  for (let x of list1) {
    // set all keys of list1 in our map to 1
    map.set(x, 1);
  }
  for (let y of list2) {
    // set all keys of list2 in our map to 2 or 3
    map.set(y, map.has(y) ? 3 : 2);
  }
  // get all keys in our map and sort them
  const keys = [...map.keys()].sort(comparator);
  const size = keys.length;
  // for performance, we create the resulting arrays with their final size
  const left: (T | null)[] = new Array(size);
  const right: (T | null)[] = new Array(size);
  // loop over all keys and fill the new array with the keys
  for (let i = 0; i < size; ++i) {
    const key = keys[i];
    const value = map.get(key) ?? 0;
    // we use bitwise AND to determine whether key is in list1 and/or list2
    left[i] = (value & 1) === 1 ? key : null;
    right[i] = (value & 2) === 2 ? key : null;
  }
  return { left, right };
};

// console.log(map(list1.slice(0, 10), list2.slice(0, 10)));

const benchmark = (
  steps: number[],
  name: string,
  fn: (
    list1: number[],
    list2: number[],
    comparator?: (a: number, b: number) => number
  ) => {
    left: (number | null)[];
    right: (number | null)[];
  }
) => {
  console.groupCollapsed(name);
  const results = steps.map((count) => {
    return steps.map((size) => {
      const result = measure(
        fn,
        count,
        list1.slice(0, size),
        list2.slice(0, size),
        (a: number, b: number) => a - b
      );
      console.log(name, count, size, result, result);
      return result;
    });
  });
  console.groupEnd();
  return results;
};

const steps = [10, 100, 1000, 10000];

const naiveResults = benchmark(steps, 'naive', naive);
const mapResults = benchmark(steps, 'map', map);

steps.forEach((count, countIndex) => {
  console.group('count: ' + count);
  steps.forEach((size, sizeIndex) => {
    const naiveResult = naiveResults[countIndex][sizeIndex];
    const mapResult = mapResults[countIndex][sizeIndex];
    console.log('size:', size);
    console.log(
      'naiveResult:',
      naiveResult,
      'per iteration:',
      (naiveResult / count).toFixed(3)
    );
    console.log(
      'mapResult:',
      mapResult,
      'per iteration:',
      (mapResult / count).toFixed(3)
    );
    console.log('factor:', (naiveResult / mapResult).toFixed(3));
  });
  console.groupEnd();
});

// steps.forEach(count => {
//   steps.forEach(size => {
//     console.log(
//       'naive',
//       count,
//       size,
//       measure(naive, count, list1.slice(0, size), list2.slice(0, size))
//     );
//   });
// });

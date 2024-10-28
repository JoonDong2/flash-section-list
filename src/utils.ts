export const omit = (obj: any, props: readonly string[], mutable = false) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  const copy = mutable ? obj : { ...obj };
  for (let i = 0; i < props.length; i++) {
    const prop = props[i];
    if (prop) {
      delete copy[prop];
    }
  }
  return copy;
};

const _gcd = (a: number, b: number) => {
  while (b !== 0) {
    let temp = b;
    b = a % b;
    a = temp;
  }
  return a;
};

const _lcm = (a: number, b: number) => {
  return (a * b) / _gcd(a, b);
};

export const lcm = (numbers: number[]) => {
  return numbers.reduce((acc, cur) => _lcm(acc, cur), 1);
};

export const findFirstProp = (obj: any, props: string[]) => {
  if (!obj || typeof obj !== 'object') return;
  for (let i = 0; i < props.length; i++) {
    const prop = props[i]!;
    const value = obj[prop];
    if (value !== undefined) return value;
  }
};

export const binarySearchClosestIndex = (
  arr: number[] | undefined,
  value: number
) => {
  if (!arr?.length) return -1;

  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midValue = arr[mid]!;
    if (midValue === value) {
      return mid;
    }
    if (low === mid || high === mid) {
      // return low or high
      if (arr[high]! <= value) {
        return high;
      }
      return low;
    }

    // left
    if (midValue > value) {
      high = mid;
    }
    // right
    else if (midValue < value) {
      low = mid;
    }
  }
  return -1;
};

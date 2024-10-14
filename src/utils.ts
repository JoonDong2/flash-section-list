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

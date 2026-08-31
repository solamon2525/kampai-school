export const ENGINE_VERSION = 'p4-math-1.0.0';

export const ACTIVITY_DEFINITIONS = {
  math24: {
    label: 'เกม 24',
    indicator: 'ค 1.1 ป.4/10, ค 1.1 ป.4/12',
    inputKind: 'math24',
  },
  improper_to_mixed: {
    label: 'เศษเกินเป็นจำนวนคละ',
    indicator: 'ค 1.1 ป.4/3, ค 1.1 ป.4/4',
    inputKind: 'mixed-number',
  },
  mixed_to_improper: {
    label: 'จำนวนคละเป็นเศษเกิน',
    indicator: 'ค 1.1 ป.4/3, ค 1.1 ป.4/4',
    inputKind: 'fraction',
  },
  fraction_add_sub: {
    label: 'บวก/ลบเศษส่วนตัวส่วนเท่ากัน',
    indicator: 'ค 1.1 ป.4/13, ค 1.1 ป.4/14',
    inputKind: 'fraction',
  },
};

const MIXED_KEYS = ['improper_to_mixed', 'mixed_to_improper', 'fraction_add_sub', 'math24'];

export function createSeededRandom(seed) {
  let state = Number(BigInt.asUintN(32, BigInt(seed))) || 0x6d2b79f5;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

function canonicalNumbers(numbers) {
  return [...numbers].sort((a, b) => a - b).join('-');
}

function solve24(numbers) {
  const nodes = numbers.map((value, index) => ({ value, ast: { type: 'number', index, value } }));
  const search = (items) => {
    if (items.length === 1) return items[0].value === 24 ? items[0].ast : null;
    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        const a = items[i];
        const b = items[j];
        const rest = items.filter((_, index) => index !== i && index !== j);
        const candidates = [
          ['+', a, b, a.value + b.value],
          ['*', a, b, a.value * b.value],
          ['-', a, b, a.value - b.value],
          ['-', b, a, b.value - a.value],
          ['/', a, b, b.value !== 0 && a.value % b.value === 0 ? a.value / b.value : 0],
          ['/', b, a, a.value !== 0 && b.value % a.value === 0 ? b.value / a.value : 0],
        ];
        for (const [op, left, right, value] of candidates) {
          if (!Number.isInteger(value) || value <= 0) continue;
          if (op === '*' && (left.value === 1 || right.value === 1)) continue;
          if (op === '/' && right.value === 1) continue;
          const ast = { type: 'operation', op, left: left.ast, right: right.ast };
          const answer = search([...rest, { value, ast }]);
          if (answer) return answer;
        }
      }
    }
    return null;
  };
  return search(nodes);
}

function generateMath24(random, difficulty, used) {
  const range = difficulty === 'easy' ? [1, 8] : difficulty === 'hard' ? [2, 13] : [1, 10];
  for (let guard = 0; guard < 5000; guard += 1) {
    const numbers = Array.from({ length: 4 }, () => randomInt(random, range[0], range[1]));
    const canonicalKey = `math24:${canonicalNumbers(numbers)}`;
    if (used.has(canonicalKey)) continue;
    const solution = solve24(numbers);
    if (!solution) continue;
    used.add(canonicalKey);
    return {
      activityKey: 'math24',
      difficulty,
      canonicalKey,
      prompt: {
        kind: 'math24',
        title: 'สร้างผลลัพธ์ให้ได้ 24',
        numbers,
        operators: ['+', '-', '*', '/'],
      },
      answerKey: { kind: 'math24', solution },
    };
  }
  throw new Error('math24_generation_exhausted');
}

function generateImproperToMixed(random, difficulty, used) {
  const maxDenominator = difficulty === 'easy' ? 8 : difficulty === 'hard' ? 15 : 12;
  const maxWhole = difficulty === 'easy' ? 5 : difficulty === 'hard' ? 12 : 8;
  for (let guard = 0; guard < 1000; guard += 1) {
    const denominator = randomInt(random, 2, maxDenominator);
    const whole = randomInt(random, 1, maxWhole);
    const remainder = randomInt(random, 1, denominator - 1);
    const numerator = whole * denominator + remainder;
    const canonicalKey = `improper:${numerator}/${denominator}`;
    if (used.has(canonicalKey)) continue;
    used.add(canonicalKey);
    return {
      activityKey: 'improper_to_mixed', difficulty, canonicalKey,
      prompt: { kind: 'improper_to_mixed', numerator, denominator },
      answerKey: { kind: 'mixed_number', whole, numerator: remainder, denominator },
    };
  }
  throw new Error('improper_generation_exhausted');
}

function generateMixedToImproper(random, difficulty, used) {
  const maxDenominator = difficulty === 'easy' ? 8 : difficulty === 'hard' ? 15 : 12;
  const maxWhole = difficulty === 'easy' ? 5 : difficulty === 'hard' ? 12 : 8;
  for (let guard = 0; guard < 1000; guard += 1) {
    const denominator = randomInt(random, 2, maxDenominator);
    const whole = randomInt(random, 1, maxWhole);
    const numerator = randomInt(random, 1, denominator - 1);
    const answerNumerator = whole * denominator + numerator;
    const canonicalKey = `mixed:${whole}:${numerator}/${denominator}`;
    if (used.has(canonicalKey)) continue;
    used.add(canonicalKey);
    return {
      activityKey: 'mixed_to_improper', difficulty, canonicalKey,
      prompt: { kind: 'mixed_to_improper', whole, numerator, denominator },
      answerKey: { kind: 'fraction', numerator: answerNumerator, denominator, requireSimplified: false },
    };
  }
  throw new Error('mixed_generation_exhausted');
}

function generateFractionAddSub(random, difficulty, used) {
  const maxDenominator = difficulty === 'easy' ? 10 : difficulty === 'hard' ? 18 : 14;
  for (let guard = 0; guard < 2000; guard += 1) {
    const denominator = randomInt(random, 3, maxDenominator);
    const operator = random() < 0.5 ? '+' : '-';
    let left = randomInt(random, 1, denominator - 1);
    let right = randomInt(random, 1, denominator - 1);
    if (operator === '-' && right > left) [left, right] = [right, left];
    if (operator === '-' && left === right) continue;
    const rawNumerator = operator === '+' ? left + right : left - right;
    const divisor = gcd(rawNumerator, denominator);
    const numerator = rawNumerator / divisor;
    const answerDenominator = denominator / divisor;
    const canonicalKey = `fraction:${left}/${denominator}${operator}${right}/${denominator}`;
    if (used.has(canonicalKey)) continue;
    used.add(canonicalKey);
    return {
      activityKey: 'fraction_add_sub', difficulty, canonicalKey,
      prompt: { kind: 'fraction_add_sub', left, right, denominator, operator },
      answerKey: { kind: 'fraction', numerator, denominator: answerDenominator, requireSimplified: true },
    };
  }
  throw new Error('fraction_generation_exhausted');
}

const GENERATORS = {
  math24: generateMath24,
  improper_to_mixed: generateImproperToMixed,
  mixed_to_improper: generateMixedToImproper,
  fraction_add_sub: generateFractionAddSub,
};

export function generateQuestionSet({ activityKey, difficulty, count, seed }) {
  if (!['easy', 'medium', 'hard'].includes(difficulty)) throw new Error('invalid_difficulty');
  if (!Number.isInteger(count) || count < 1 || count > 31) throw new Error('invalid_question_count');
  const random = createSeededRandom(seed);
  const used = new Set();
  return Array.from({ length: count }, (_, index) => {
    const key = activityKey === 'mixed' ? MIXED_KEYS[index % MIXED_KEYS.length] : activityKey;
    const generator = GENERATORS[key];
    if (!generator) throw new Error('invalid_activity_key');
    return { ...generator(random, difficulty, used), sequenceNo: index };
  });
}

function readInteger(value) {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) return Number(value);
  return null;
}

export function evaluateMath24Ast(ast, sourceNumbers) {
  const usedIndices = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') throw new Error('invalid_node');
    if (node.type === 'number') {
      const index = readInteger(node.index);
      const value = readInteger(node.value);
      if (index === null || index < 0 || index >= sourceNumbers.length) throw new Error('invalid_source_index');
      if (value !== sourceNumbers[index]) throw new Error('source_value_mismatch');
      usedIndices.push(index);
      return value;
    }
    if (node.type !== 'operation' || !['+', '-', '*', '/'].includes(node.op)) throw new Error('invalid_operation');
    const left = walk(node.left);
    const right = walk(node.right);
    if ((node.op === '+' || node.op === '-') && right === 0) throw new Error('neutral_operation');
    if (node.op === '*' && (left === 1 || right === 1)) throw new Error('neutral_operation');
    if (node.op === '/' && right === 1) throw new Error('neutral_operation');
    let value;
    if (node.op === '+') value = left + right;
    if (node.op === '-') value = left - right;
    if (node.op === '*') value = left * right;
    if (node.op === '/') {
      if (right === 0 || left % right !== 0) throw new Error('non_integer_division');
      value = left / right;
    }
    if (!Number.isInteger(value) || value <= 0) throw new Error('non_positive_intermediate');
    return value;
  };
  const value = walk(ast);
  const sorted = [...usedIndices].sort((a, b) => a - b);
  if (sorted.length !== sourceNumbers.length || sorted.some((index, position) => index !== position)) {
    throw new Error('source_numbers_not_used_once');
  }
  return value;
}

export function validateAnswer(question, response) {
  try {
    if (question.prompt.kind === 'math24') {
      return evaluateMath24Ast(response?.ast, question.prompt.numbers) === 24;
    }
    if (question.answerKey.kind === 'mixed_number') {
      const whole = readInteger(response?.whole);
      const numerator = readInteger(response?.numerator);
      const denominator = readInteger(response?.denominator);
      if (whole === null || numerator === null || denominator === null || denominator <= 0) return false;
      if (numerator < 0 || numerator >= denominator) return false;
      const expected = question.answerKey;
      return (whole * denominator + numerator) * expected.denominator
        === (expected.whole * expected.denominator + expected.numerator) * denominator;
    }
    if (question.answerKey.kind === 'fraction') {
      const numerator = readInteger(response?.numerator);
      const denominator = readInteger(response?.denominator);
      if (numerator === null || denominator === null || denominator <= 0) return false;
      const expected = question.answerKey;
      const equivalent = numerator * expected.denominator === expected.numerator * denominator;
      if (!equivalent) return false;
      return !expected.requireSimplified || gcd(numerator, denominator) === 1;
    }
    return false;
  } catch {
    return false;
  }
}

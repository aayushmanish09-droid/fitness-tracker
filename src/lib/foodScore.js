// ─────────────────────────────────────────────────────────────────
// Food assessment (MVP, rule-based).
// For each food the user types we return:
//   • a calorie estimate as a RANGE (known facts for staples like rice
//     & bananas; wider ranges for variable items like burgers, adjusted
//     by detected modifiers — grilled vs fried, double, extra sauce…)
//   • a clear, specific reason ("high in protein", "mostly added sugar")
//   • a sentiment (good / bad / neutral) so the UI can colour it
// and an overall 1–10 health score + plain-English summary.
// ─────────────────────────────────────────────────────────────────

const round10 = (x) => Math.round(x / 10) * 10
const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase())

// food: keys (lowercase substrings), label, cal [low,high] for a typical
// logged serving, basis (where the number comes from), delta (signed score
// weight), tag (the nutrient story), reason (shown to the user).
const FOODS = [
  // ── Protein / whole foods (positive) ──────────────────────────
  { keys: ['egg'], label: 'Eggs', cal: [140, 230], basis: '~2 eggs (≈78 kcal each)', delta: 1.2, tag: 'protein', reason: 'High in protein and healthy fats — keeps you full.' },
  { keys: ['chicken'], label: 'Chicken', cal: [200, 360], basis: '~150g breast (≈165 kcal/100g)', delta: 1.4, tag: 'protein', reason: 'Lean, high-protein — great for muscle and staying full.' },
  { keys: ['salmon', 'tuna', 'cod', 'fish'], label: 'Fish', cal: [180, 340], basis: '~150g fillet', delta: 1.4, tag: 'protein & omega-3', reason: 'High in protein plus healthy omega-3 fats.' },
  { keys: ['steak', 'beef'], label: 'Beef', cal: [250, 460], basis: '~150g', delta: 1.0, tag: 'protein', reason: 'High in protein, though higher in saturated fat.' },
  { keys: ['greek yogurt', 'yogurt', 'yoghurt'], label: 'Greek yogurt', cal: [100, 180], basis: 'a cup', delta: 1.1, tag: 'protein & probiotics', reason: 'Protein plus gut-friendly probiotics.' },
  { keys: ['protein shake', 'whey', 'protein powder', 'protein'], label: 'Protein shake', cal: [120, 260], basis: '1 scoop + milk/water', delta: 1.2, tag: 'protein', reason: 'A clean, convenient protein hit.' },
  { keys: ['cottage cheese'], label: 'Cottage cheese', cal: [110, 200], basis: 'a serving', delta: 1.0, tag: 'protein', reason: 'High in slow-digesting protein.' },
  { keys: ['tofu', 'lentil', 'beans', 'chickpea'], label: 'Beans / legumes', cal: [150, 300], basis: 'a serving', delta: 0.9, tag: 'plant protein & fiber', reason: 'Plant protein with filling fiber.' },
  { keys: ['nuts', 'almond', 'peanut', 'walnut', 'cashew'], label: 'Nuts', cal: [150, 320], basis: 'a handful', delta: 0.8, tag: 'healthy fats', reason: 'Healthy fats — calorie-dense, so keep portions small.' },

  // ── Smart carbs / produce (positive) ──────────────────────────
  { keys: ['rice'], label: 'Rice', cal: [200, 300], basis: '1 cup cooked (≈130 kcal/100g)', delta: 0.6, tag: 'complex carbs', reason: 'Complex-carb energy to fuel training.' },
  { keys: ['oat', 'oatmeal', 'porridge'], label: 'Oats', cal: [150, 300], basis: 'a bowl', delta: 1.0, tag: 'fiber & slow carbs', reason: 'Fiber and slow-release energy.' },
  { keys: ['sweet potato'], label: 'Sweet potato', cal: [110, 220], basis: '1 medium', delta: 0.9, tag: 'complex carbs & fiber', reason: 'Complex carbs with fiber and vitamins.' },
  { keys: ['quinoa'], label: 'Quinoa', cal: [180, 280], basis: '1 cup cooked', delta: 0.9, tag: 'protein & complex carbs', reason: 'Complex carbs plus a little protein.' },
  { keys: ['banana'], label: 'Banana', cal: [90, 120], basis: '1 medium (≈105 kcal)', delta: 0.9, tag: 'carbs & potassium', reason: 'Quick carbs and potassium — good pre/post workout.' },
  { keys: ['apple'], label: 'Apple', cal: [80, 110], basis: '1 medium (≈95 kcal)', delta: 0.9, tag: 'fiber & vitamins', reason: 'Fiber and vitamins with natural sugar.' },
  { keys: ['berries', 'orange', 'mango', 'grapes', 'pear', 'pineapple', 'fruit'], label: 'Fruit', cal: [60, 150], basis: 'a serving', delta: 0.9, tag: 'fiber & vitamins', reason: 'Natural sugars wrapped in fiber and vitamins.' },
  { keys: ['broccoli', 'spinach', 'salad', 'kale', 'carrot', 'cucumber', 'tomato', 'greens', 'vegetable', 'veggie', 'veggies'], label: 'Vegetables', cal: [40, 200], basis: 'a serving (dressing varies)', delta: 1.2, tag: 'fiber & vitamins', reason: 'Fiber, vitamins and very filling for few calories.' },
  { keys: ['milk'], label: 'Milk', cal: [100, 160], basis: 'a glass', delta: 0.5, tag: 'protein & calcium', reason: 'Protein and calcium.' },

  // ── Mixed / depends (neutral-ish) ─────────────────────────────
  { keys: ['sandwich', 'wrap'], label: 'Sandwich', cal: [300, 600], basis: 'one (fillings vary)', delta: 0.3, tag: 'mixed', reason: 'Depends on the filling — lean protein + veg is best.' },
  { keys: ['toast', 'bread', 'bagel'], label: 'Bread', cal: [80, 320], basis: 'a couple of slices', delta: 0.2, tag: 'carbs', reason: 'Carbs — whole-grain is the better pick.' },

  // ── Processed / treats (negative) ─────────────────────────────
  { keys: ['coke', 'cola', 'pepsi', 'sprite', 'fanta', 'mountain dew', 'soda', 'energy drink'], label: 'Soda', cal: [140, 250], basis: 'a can/bottle (≈140 kcal/can)', delta: -1.4, tag: 'added sugar', reason: 'Pure added sugar with zero nutrition.' },
  { keys: ['donut', 'doughnut'], label: 'Donut', cal: [250, 450], basis: '1–2', delta: -1.5, tag: 'sugar & fried dough', reason: 'Fried dough and sugar — empty calories.' },
  { keys: ['candy', 'sweets', 'gummies', 'skittles', 'chocolate bar'], label: 'Candy', cal: [150, 350], basis: 'a serving', delta: -1.3, tag: 'added sugar', reason: 'Mostly added sugar — a quick spike then a crash.' },
  { keys: ['fries', 'french fries'], label: 'Fries', cal: [300, 560], basis: 'small → large', delta: -1.3, tag: 'fried refined carbs', reason: 'Deep-fried refined carbs soaked in oil.' },
  { keys: ['chips', 'crisps'], label: 'Chips', cal: [150, 350], basis: 'a bag', delta: -1.1, tag: 'fried carbs & salt', reason: 'Fried, salty refined carbs.' },
  { keys: ['pizza'], label: 'Pizza', cal: [280, 850], basis: 'slice(s) — varies a lot', delta: -1.2, tag: 'refined carbs & fat', reason: 'Refined carbs, cheese and oil.' },
  { keys: ['cheeseburger', 'hamburger', 'burger'], label: 'Burger', cal: [350, 900], basis: 'one (patty & sauce vary)', delta: -1.2, tag: 'fat & refined carbs', reason: 'A big hit of fat and refined carbs.' },
  { keys: ['mcdonald', 'kfc', 'taco bell', 'fast food', 'nuggets'], label: 'Fast food', cal: [400, 950], basis: 'a meal', delta: -1.3, tag: 'fat, salt & sugar', reason: 'Loaded with fat, salt and sugar.' },
  { keys: ['cake', 'pastry', 'cookie', 'brownie', 'ice cream', 'cheesecake', 'dessert'], label: 'Dessert', cal: [250, 550], basis: 'a serving', delta: -1.2, tag: 'added sugar & fat', reason: 'Sugar and fat — a treat, not fuel.' },
  { keys: ['bacon', 'sausage', 'hot dog'], label: 'Processed meat', cal: [200, 450], basis: 'a serving', delta: -0.8, tag: 'saturated fat & salt', reason: 'High in saturated fat and salt.' },
  { keys: ['beer', 'wine', 'vodka', 'whiskey', 'cocktail', 'alcohol'], label: 'Alcohol', cal: [120, 350], basis: 'a drink', delta: -1.2, tag: 'empty calories', reason: 'Empty calories that stall recovery.' },
  { keys: ['syrup', 'honey', 'sugar'], label: 'Added sugar', cal: [50, 200], basis: 'added to food/drink', delta: -0.9, tag: 'added sugar', reason: 'Extra added sugar.' },
]

// Modifiers detected within a chunk; adjust calories + score + reason.
const MODIFIERS = [
  { keys: ['deep fried', 'deep-fried', 'fried', 'crispy', 'battered'], calMult: [1.2, 1.45], delta: -1.4, note: 'fried, so much higher in fat & calories' },
  { keys: ['grilled', 'baked', 'steamed', 'boiled', 'poached', 'roasted', 'air fried', 'air-fried'], calMult: [0.85, 0.95], delta: 0.4, note: 'grilled/baked — a leaner prep' },
  { keys: ['double', 'triple', 'large', 'big', 'jumbo', 'xl', 'extra large'], calMult: [1.35, 1.6], delta: -0.3, note: 'large portion' },
  { keys: ['small', 'mini', 'half', 'light'], calMult: [0.6, 0.8], delta: 0.2, note: 'small portion' },
  { keys: ['extra cheese', 'extra sauce', 'loaded', 'smothered', 'creamy', 'mayo', 'extra'], calMult: [1.15, 1.4], delta: -0.5, note: 'extra sauce/cheese piles on calories' },
  { keys: ['no sauce', 'no cheese', 'plain', 'dry', 'no bun'], calMult: [0.8, 0.9], delta: 0.3, note: 'kept plain' },
]

// Find every food mentioned in a chunk (so "chicken and rice" → both, and
// "grilled chicken with extra sauce" → chicken + its modifiers). Drops a food
// whose only matched key is a substring of a longer match (e.g. apple⊂pineapple).
function matchFoods(chunk) {
  const hits = []
  for (const f of FOODS) {
    let bestKey = ''
    for (const k of f.keys) if (chunk.includes(k) && k.length > bestKey.length) bestKey = k
    if (bestKey) hits.push({ food: f, key: bestKey })
  }
  hits.sort((a, b) => b.key.length - a.key.length)
  const accepted = []
  for (const h of hits) {
    if (accepted.some((a) => a.food === h.food)) continue
    if (accepted.some((a) => a.food !== h.food && a.key.includes(h.key))) continue
    accepted.push(h)
  }
  return accepted.map((a) => a.food)
}

function detectModifiers(chunk) {
  const found = []
  for (const m of MODIFIERS) {
    if (m.keys.some((k) => chunk.includes(k))) found.push(m)
  }
  return found
}

function stripModifiers(chunk) {
  let s = chunk
  for (const m of MODIFIERS) for (const k of m.keys) s = s.split(k).join(' ')
  return s.trim()
}

function buildItem(food, mods) {
  let [low, high] = food.cal
  let delta = food.delta
  const notes = []
  for (const m of mods) {
    low *= m.calMult[0]
    high *= m.calMult[1]
    delta += m.delta
    notes.push(m.note)
  }
  const sentiment = delta > 0.25 ? 'good' : delta < -0.25 ? 'bad' : 'neutral'
  let reason = food.reason
  if (notes.length) reason += ` (${notes.join('; ')})`
  return {
    label: food.label,
    known: true,
    sentiment,
    tag: food.tag,
    basis: food.basis,
    calLow: round10(low),
    calHigh: round10(high),
    delta,
    reason,
  }
}

// Analyse one comma-chunk → array of items (one per recognised food, applying
// that chunk's modifiers; or a single "unknown" item; or nothing for stray
// modifier-only text like "extra sauce").
function analyseChunk(chunk) {
  const foods = matchFoods(chunk)
  const mods = detectModifiers(chunk)

  if (foods.length === 0) {
    const leftover = stripModifiers(chunk).replace(/[^a-z]/g, '')
    if (leftover.length < 2) return [] // just a modifier phrase, skip
    return [
      {
        label: titleCase(chunk),
        known: false,
        sentiment: 'neutral',
        calLow: 0,
        calHigh: 0,
        delta: 0,
        reason: 'No nutrition data for this — not counted in the estimate.',
      },
    ]
  }
  return foods.map((food) => buildItem(food, mods))
}

function uniq(arr) {
  return [...new Set(arr)]
}

export function calculateFoodHealthScore(rawText) {
  const text = (rawText || '').toLowerCase().trim()
  if (!text) {
    return {
      score: 5,
      explanation: 'No food entered.',
      calories: { low: 0, high: 0, partial: false },
      items: [],
    }
  }

  // Split only on strong separators; multi-food detection within a chunk
  // handles "X and Y" / "X with <sauce>" so modifiers stay attached.
  const chunks = text
    .split(/,|\n|\/|;/)
    .map((c) => c.trim())
    .filter(Boolean)

  const items = (chunks.length ? chunks : [text]).flatMap(analyseChunk)

  // calories
  let low = 0
  let high = 0
  let partial = false
  for (const it of items) {
    if (it.known) {
      low += it.calLow
      high += it.calHigh
    } else partial = true
  }

  // score: positives weighted 0.9, negatives 0.6 (gentler) — calibrated so
  // eggs+chicken+rice ≈ 8 and pizza+coke+fries ≈ 3.
  let posSum = 0
  let negSum = 0
  for (const it of items) {
    if (it.delta > 0) posSum += it.delta
    else if (it.delta < 0) negSum += -it.delta
  }
  const score = Math.round(Math.max(1, Math.min(10, 5 + posSum * 0.9 - negSum * 0.6)))

  // explanation referencing actual nutrients
  const goods = items.filter((i) => i.sentiment === 'good')
  const bads = items.filter((i) => i.sentiment === 'bad')
  const goodLabels = goods.map((i) => i.label)
  const badLabels = bads.map((i) => i.label)
  const goodTags = uniq(goods.map((i) => i.tag).filter(Boolean))
  const badTags = uniq(bads.map((i) => i.tag).filter(Boolean))

  let explanation
  if (score >= 8) {
    explanation = `Strong day — ${list(goodLabels)} bring ${list(goodTags) || 'solid nutrition'}.`
  } else if (score >= 6) {
    explanation = badLabels.length
      ? `Decent day. ${list(goodLabels) || 'Whole foods'} help, just watch the ${list(badLabels)} (${list(badTags)}).`
      : `Solid, balanced day — ${list(goodTags) || 'good choices'}.`
  } else if (score >= 4) {
    explanation = `Mixed day. ${
      goodLabels.length ? `${list(goodLabels)} is a plus, but ` : ''
    }${list(badLabels) || 'processed food'} added ${list(badTags) || 'extra sugar & fat'} and pulled the score down.`
  } else {
    explanation = `Heavy on ${list(badTags) || 'processed food'} today (${list(badLabels) || 'junk food'}). Add more protein and whole foods tomorrow.`
  }

  return { score, explanation, calories: { low, high, partial }, items }
}

function list(arr) {
  if (!arr || arr.length === 0) return ''
  if (arr.length === 1) return arr[0]
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`
  return `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`
}

// Format a calorie range for display, e.g. "≈ 520–760 kcal".
export function formatCalories(calories) {
  if (!calories || (!calories.low && !calories.high)) return null
  const { low, high, partial } = calories
  const core = low === high ? `≈ ${low} kcal` : `≈ ${low}–${high} kcal`
  return partial ? `${core}+` : core
}

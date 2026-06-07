// ─────────────────────────────────────────────────────────────────
// Food assessment — rule-based, USDA-sourced calorie data.
//
// For every recognised food we store:
//   cal100g      — kcal per 100 g (USDA FoodData Central)
//   servingG     — [low, high] grams for ONE serving with no quantity given
//   namedPortions — { 'cup': g, 'slice': g, 'tbsp': g, ... }
//
// When the user types a quantity ("2 eggs", "100g chicken", "1 cup rice")
// we use it to give a much tighter estimate.  Without a quantity we fall
// back to the servingG range so there's always a sensible answer.
// ─────────────────────────────────────────────────────────────────

// ── 1. Food database ────────────────────────────────────────────

// cal100g values from USDA FoodData Central (cooked / as typically eaten).
// servingG: [min, max] grams when no quantity mentioned.
// namedPortions: specific named sizes → grams.
// delta / tag / reason / sentiment: same as before (for the health score).

const FOODS = [
  // ── Protein ──────────────────────────────────────────────────
  {
    keys: ['egg', 'boiled egg', 'fried egg', 'scrambled egg', 'poached egg'],
    label: 'Egg',
    cal100g: 143, // whole egg, cooked
    servingG: [50, 150], // 1–3 eggs
    namedPortions: { egg: 50, eggs: 50, 'large egg': 60, 'boiled egg': 50, 'fried egg': 56 },
    delta: 1.2, tag: 'protein & healthy fats',
    reason: 'High in protein and healthy fats — keeps you full.',
  },
  {
    keys: ['chicken breast', 'grilled chicken', 'baked chicken', 'chicken'],
    label: 'Chicken',
    cal100g: 165, // cooked breast
    servingG: [120, 200],
    namedPortions: { breast: 174, thigh: 109, drumstick: 77, wing: 49 },
    delta: 1.4, tag: 'lean protein',
    reason: 'Lean, high-protein — great for muscle and staying full.',
  },
  {
    keys: ['salmon'],
    label: 'Salmon',
    cal100g: 208,
    servingG: [140, 200],
    namedPortions: { fillet: 154, 'half fillet': 77 },
    delta: 1.4, tag: 'protein & omega-3',
    reason: 'High in protein plus heart-healthy omega-3 fats.',
  },
  {
    keys: ['tuna'],
    label: 'Tuna',
    cal100g: 132, // canned in water
    servingG: [100, 185],
    namedPortions: { can: 170, tin: 170 },
    delta: 1.3, tag: 'lean protein',
    reason: 'Very lean protein source.',
  },
  {
    keys: ['cod', 'tilapia', 'haddock', 'white fish'],
    label: 'White fish',
    cal100g: 105,
    servingG: [120, 200],
    namedPortions: { fillet: 163 },
    delta: 1.3, tag: 'lean protein',
    reason: 'Very lean, high-protein white fish.',
  },
  {
    keys: ['steak', 'beef steak', 'ribeye', 'sirloin'],
    label: 'Steak',
    cal100g: 271,
    servingG: [150, 300],
    namedPortions: { steak: 215 },
    delta: 0.9, tag: 'protein',
    reason: 'High in protein, though higher in saturated fat.',
  },
  {
    keys: ['ground beef', 'minced beef', 'beef mince'],
    label: 'Ground beef',
    cal100g: 215, // 80/20 cooked
    servingG: [100, 200],
    namedPortions: {},
    delta: 0.8, tag: 'protein',
    reason: 'Good protein but moderate saturated fat.',
  },
  {
    keys: ['shrimp', 'prawns', 'prawn'],
    label: 'Shrimp/prawns',
    cal100g: 99,
    servingG: [85, 150],
    namedPortions: {},
    delta: 1.3, tag: 'lean protein',
    reason: 'Very lean, high-protein shellfish.',
  },
  {
    keys: ['turkey'],
    label: 'Turkey',
    cal100g: 135,
    servingG: [100, 180],
    namedPortions: { slice: 28 },
    delta: 1.3, tag: 'lean protein',
    reason: 'Very lean protein source.',
  },
  {
    keys: ['greek yogurt', 'greek yoghurt'],
    label: 'Greek yogurt',
    cal100g: 59,
    servingG: [150, 250],
    namedPortions: { cup: 245, bowl: 200, pot: 150 },
    delta: 1.1, tag: 'protein & probiotics',
    reason: 'High in protein and gut-friendly probiotics.',
  },
  {
    keys: ['yogurt', 'yoghurt'],
    label: 'Yogurt',
    cal100g: 61,
    servingG: [150, 250],
    namedPortions: { cup: 245, pot: 150 },
    delta: 0.9, tag: 'protein & probiotics',
    reason: 'Protein and probiotics — check the sugar content.',
  },
  {
    keys: ['cottage cheese'],
    label: 'Cottage cheese',
    cal100g: 98,
    servingG: [100, 225],
    namedPortions: { cup: 226 },
    delta: 1.0, tag: 'slow-digesting protein',
    reason: 'High in slow-digesting protein — great before bed.',
  },
  {
    keys: ['protein shake', 'whey shake', 'protein smoothie'],
    label: 'Protein shake',
    cal100g: 100, // ~25g protein per 100 kcal typical
    servingG: [200, 400], // mixed with liquid
    namedPortions: { shake: 300, scoop: 30 },
    delta: 1.2, tag: 'protein',
    reason: 'A clean, convenient protein hit.',
  },
  {
    keys: ['whey', 'casein', 'protein powder'],
    label: 'Protein powder',
    cal100g: 370, // dry powder
    servingG: [25, 60], // 1–2 scoops dry
    namedPortions: { scoop: 30 },
    delta: 1.2, tag: 'protein',
    reason: 'Concentrated protein — check the label for added sugars.',
  },
  {
    keys: ['tofu'],
    label: 'Tofu',
    cal100g: 76,
    servingG: [85, 170],
    namedPortions: {},
    delta: 1.0, tag: 'plant protein',
    reason: 'Solid plant protein with minimal fat.',
  },
  {
    keys: ['lentils', 'lentil'],
    label: 'Lentils',
    cal100g: 116, // cooked
    servingG: [150, 250],
    namedPortions: { cup: 198 },
    delta: 1.0, tag: 'plant protein & fiber',
    reason: 'Plant protein packed with fiber.',
  },
  {
    keys: ['black beans', 'kidney beans', 'chickpeas', 'chickpea', 'beans', 'bean'],
    label: 'Beans / legumes',
    cal100g: 127, // cooked average
    servingG: [130, 250],
    namedPortions: { cup: 177 },
    delta: 0.9, tag: 'plant protein & fiber',
    reason: 'Plant protein with filling fiber.',
  },
  {
    keys: ['edamame'],
    label: 'Edamame',
    cal100g: 121,
    servingG: [100, 155],
    namedPortions: { cup: 155 },
    delta: 1.0, tag: 'plant protein',
    reason: 'Complete plant protein with fiber.',
  },

  // ── Dairy ────────────────────────────────────────────────────
  {
    keys: ['milk', 'whole milk'],
    label: 'Milk',
    cal100g: 61, // whole
    servingG: [240, 240],
    namedPortions: { cup: 244, glass: 244, ml: 1 },
    delta: 0.5, tag: 'protein & calcium',
    reason: 'Protein and calcium.',
  },
  {
    keys: ['skim milk', 'skimmed milk', 'low fat milk'],
    label: 'Skim milk',
    cal100g: 35,
    servingG: [240, 240],
    namedPortions: { cup: 244, glass: 244 },
    delta: 0.6, tag: 'protein & calcium',
    reason: 'Low-fat protein and calcium.',
  },
  {
    keys: ['cheese', 'cheddar', 'mozzarella'],
    label: 'Cheese',
    cal100g: 402, // cheddar
    servingG: [20, 60],
    namedPortions: { slice: 28, cube: 17 },
    delta: 0.2, tag: 'calcium & fat',
    reason: 'Calcium but calorie-dense — keep portions small.',
  },

  // ── Nuts & seeds ─────────────────────────────────────────────
  {
    keys: ['almonds', 'almond'],
    label: 'Almonds',
    cal100g: 579,
    servingG: [23, 45],
    namedPortions: { handful: 30 },
    delta: 0.8, tag: 'healthy fats & protein',
    reason: 'Healthy fats and protein — calorie-dense, so keep portions small.',
  },
  {
    keys: ['peanuts', 'peanut'],
    label: 'Peanuts',
    cal100g: 567,
    servingG: [28, 56],
    namedPortions: { handful: 30 },
    delta: 0.7, tag: 'protein & healthy fats',
    reason: 'Good protein and fats — portion-dense.',
  },
  {
    keys: ['peanut butter'],
    label: 'Peanut butter',
    cal100g: 588,
    servingG: [16, 32],
    namedPortions: { tbsp: 16, tablespoon: 16, spoon: 16 },
    delta: 0.7, tag: 'protein & healthy fats',
    reason: 'Protein and healthy fats — 2 tbsp is ~190 kcal.',
  },
  {
    keys: ['walnuts', 'walnut'],
    label: 'Walnuts',
    cal100g: 654,
    servingG: [28, 56],
    namedPortions: { handful: 30 },
    delta: 0.8, tag: 'omega-3 & healthy fats',
    reason: 'Plant omega-3s and healthy fats.',
  },
  {
    keys: ['cashews', 'cashew'],
    label: 'Cashews',
    cal100g: 553,
    servingG: [28, 56],
    namedPortions: { handful: 30 },
    delta: 0.7, tag: 'healthy fats',
    reason: 'Healthy fats — calorie-dense.',
  },
  {
    keys: ['nuts', 'mixed nuts'],
    label: 'Nuts',
    cal100g: 607,
    servingG: [28, 56],
    namedPortions: { handful: 30 },
    delta: 0.8, tag: 'healthy fats',
    reason: 'Healthy fats — calorie-dense, keep portions to a handful.',
  },

  // ── Grains / carbs ───────────────────────────────────────────
  {
    keys: ['white rice', 'basmati rice', 'jasmine rice'],
    label: 'White rice',
    cal100g: 130, // cooked
    servingG: [150, 300],
    namedPortions: { cup: 186, bowl: 220, plate: 300 },
    delta: 0.6, tag: 'complex carbs',
    reason: 'Complex-carb energy to fuel training.',
  },
  {
    keys: ['brown rice'],
    label: 'Brown rice',
    cal100g: 123, // cooked
    servingG: [150, 300],
    namedPortions: { cup: 195, bowl: 220 },
    delta: 0.8, tag: 'complex carbs & fiber',
    reason: 'More fiber than white rice — better blood sugar control.',
  },
  {
    keys: ['rice'],
    label: 'Rice',
    cal100g: 130,
    servingG: [150, 280],
    namedPortions: { cup: 186, bowl: 220, plate: 280 },
    delta: 0.6, tag: 'complex carbs',
    reason: 'Complex-carb energy — 1 cup cooked ≈ 242 kcal.',
  },
  {
    keys: ['oatmeal', 'porridge'],
    label: 'Oatmeal / porridge',
    cal100g: 71, // cooked with water
    servingG: [250, 400],
    namedPortions: { bowl: 350, cup: 240 },
    delta: 1.0, tag: 'fiber & slow carbs',
    reason: 'Fiber and slow-release energy — very filling.',
  },
  {
    keys: ['oats', 'rolled oats', 'oat'],
    label: 'Oats',
    cal100g: 389, // dry
    servingG: [40, 80], // dry weight
    namedPortions: { cup: 81, '½ cup': 40, 'half cup': 40 },
    delta: 1.0, tag: 'fiber & slow carbs',
    reason: 'Fiber and slow-release energy — ½ cup dry ≈ 150 kcal.',
  },
  {
    keys: ['pasta', 'spaghetti', 'penne', 'fettuccine', 'noodles'],
    label: 'Pasta',
    cal100g: 158, // cooked
    servingG: [150, 280],
    namedPortions: { cup: 140, bowl: 250, plate: 300 },
    delta: 0.5, tag: 'carbs',
    reason: 'Carb-heavy — portion size really matters here.',
  },
  {
    keys: ['bread', 'white bread'],
    label: 'Bread',
    cal100g: 265,
    servingG: [25, 75],
    namedPortions: { slice: 28, loaf: 680, roll: 45 },
    delta: 0.2, tag: 'refined carbs',
    reason: 'Refined carbs — whole-grain is the better pick.',
  },
  {
    keys: ['whole grain bread', 'wholegrain bread', 'wholemeal bread', 'brown bread'],
    label: 'Wholegrain bread',
    cal100g: 252,
    servingG: [25, 75],
    namedPortions: { slice: 32 },
    delta: 0.6, tag: 'fiber & complex carbs',
    reason: 'More fiber and nutrients than white bread.',
  },
  {
    keys: ['bagel'],
    label: 'Bagel',
    cal100g: 257,
    servingG: [98, 130],
    namedPortions: { bagel: 105 },
    delta: 0.1, tag: 'refined carbs',
    reason: 'Dense refined carbs — one bagel ≈ 270 kcal.',
  },
  {
    keys: ['tortilla', 'wrap'],
    label: 'Tortilla / wrap',
    cal100g: 299,
    servingG: [45, 72],
    namedPortions: { tortilla: 45, wrap: 45, 'large wrap': 72 },
    delta: 0.3, tag: 'carbs',
    reason: 'Moderate carbs — filling depends on what\'s inside.',
  },
  {
    keys: ['sweet potato'],
    label: 'Sweet potato',
    cal100g: 86, // baked
    servingG: [130, 200],
    namedPortions: { medium: 130, large: 200, small: 90 },
    delta: 0.9, tag: 'complex carbs & fiber',
    reason: 'Complex carbs with fiber and vitamins A & C.',
  },
  {
    keys: ['potato', 'baked potato'],
    label: 'Potato',
    cal100g: 93, // baked
    servingG: [130, 300],
    namedPortions: { medium: 173, large: 299, small: 138 },
    delta: 0.5, tag: 'carbs',
    reason: 'Decent carb source — watch what goes on top.',
  },
  {
    keys: ['quinoa'],
    label: 'Quinoa',
    cal100g: 120, // cooked
    servingG: [130, 250],
    namedPortions: { cup: 185 },
    delta: 0.9, tag: 'complete protein & complex carbs',
    reason: 'One of the few plant complete proteins, plus complex carbs.',
  },

  // ── Fruit ────────────────────────────────────────────────────
  {
    keys: ['banana'],
    label: 'Banana',
    cal100g: 89,
    servingG: [100, 150],
    namedPortions: { banana: 118, small: 100, medium: 118, large: 136 },
    delta: 0.9, tag: 'carbs & potassium',
    reason: 'Quick carbs and potassium — 1 medium ≈ 105 kcal.',
  },
  {
    keys: ['apple'],
    label: 'Apple',
    cal100g: 52,
    servingG: [150, 220],
    namedPortions: { apple: 182, small: 149, medium: 182, large: 223 },
    delta: 0.9, tag: 'fiber & vitamins',
    reason: 'Fiber and vitamins — 1 medium ≈ 95 kcal.',
  },
  {
    keys: ['orange'],
    label: 'Orange',
    cal100g: 47,
    servingG: [131, 200],
    namedPortions: { orange: 131, medium: 131, large: 184 },
    delta: 0.9, tag: 'vitamin C & fiber',
    reason: 'Vitamin C and fiber — 1 medium ≈ 62 kcal.',
  },
  {
    keys: ['blueberries', 'blueberry', 'raspberries', 'strawberries', 'strawberry', 'berries', 'berry'],
    label: 'Berries',
    cal100g: 57, // average
    servingG: [100, 200],
    namedPortions: { cup: 148, handful: 80, bowl: 150 },
    delta: 1.0, tag: 'antioxidants & fiber',
    reason: 'Low calorie, high in antioxidants and fiber.',
  },
  {
    keys: ['mango'],
    label: 'Mango',
    cal100g: 60,
    servingG: [165, 330],
    namedPortions: { mango: 200, cup: 165, half: 100 },
    delta: 0.8, tag: 'vitamins & carbs',
    reason: 'Natural sugars with vitamins A and C.',
  },
  {
    keys: ['grapes', 'grape'],
    label: 'Grapes',
    cal100g: 69,
    servingG: [80, 150],
    namedPortions: { cup: 92, handful: 70 },
    delta: 0.7, tag: 'natural sugar',
    reason: 'Natural sugars — can add up quickly.',
  },
  {
    keys: ['pineapple'],
    label: 'Pineapple',
    cal100g: 50,
    servingG: [80, 165],
    namedPortions: { cup: 165, slice: 80 },
    delta: 0.8, tag: 'vitamins & natural sugar',
    reason: 'Vitamins and natural sugar.',
  },
  {
    keys: ['avocado'],
    label: 'Avocado',
    cal100g: 160,
    servingG: [68, 150],
    namedPortions: { avocado: 150, half: 68, whole: 150, slice: 30 },
    delta: 0.9, tag: 'healthy fats & fiber',
    reason: 'Healthy monounsaturated fats and fiber — half ≈ 109 kcal.',
  },

  // ── Vegetables ───────────────────────────────────────────────
  {
    keys: ['broccoli'],
    label: 'Broccoli',
    cal100g: 34,
    servingG: [85, 200],
    namedPortions: { cup: 91, bowl: 140 },
    delta: 1.2, tag: 'fiber & vitamins',
    reason: 'Fiber, vitamins C & K — very low calorie.',
  },
  {
    keys: ['spinach'],
    label: 'Spinach',
    cal100g: 23,
    servingG: [30, 100],
    namedPortions: { cup: 30, bowl: 80, handful: 30 },
    delta: 1.2, tag: 'iron & vitamins',
    reason: 'Iron, vitamins K and A — barely any calories.',
  },
  {
    keys: ['kale'],
    label: 'Kale',
    cal100g: 35,
    servingG: [30, 100],
    namedPortions: { cup: 67, handful: 30 },
    delta: 1.2, tag: 'vitamins & antioxidants',
    reason: 'Very nutritious — vitamins K, A, C for barely any calories.',
  },
  {
    keys: ['salad', 'mixed salad', 'green salad'],
    label: 'Salad',
    cal100g: 20, // base greens, not including dressing
    servingG: [85, 300],
    namedPortions: { bowl: 200, plate: 250, side: 85 },
    delta: 1.1, tag: 'fiber & vitamins',
    reason: 'Very low calorie — watch the dressing, which adds a lot.',
  },
  {
    keys: ['carrot', 'carrots'],
    label: 'Carrots',
    cal100g: 41,
    servingG: [50, 130],
    namedPortions: { carrot: 61, cup: 128, handful: 60 },
    delta: 1.0, tag: 'beta-carotene & fiber',
    reason: 'Beta-carotene and fiber for very few calories.',
  },
  {
    keys: ['cucumber'],
    label: 'Cucumber',
    cal100g: 16,
    servingG: [52, 200],
    namedPortions: { cup: 119, half: 150 },
    delta: 1.0, tag: 'hydration',
    reason: 'Almost no calories — mostly water and hydration.',
  },
  {
    keys: ['tomato', 'tomatoes'],
    label: 'Tomato',
    cal100g: 18,
    servingG: [90, 180],
    namedPortions: { tomato: 123, medium: 123, cup: 149 },
    delta: 1.0, tag: 'lycopene & vitamins',
    reason: 'Very low calorie with lycopene and vitamin C.',
  },
  {
    keys: ['vegetables', 'veggies', 'veggie', 'veg', 'greens', 'mixed veg'],
    label: 'Vegetables',
    cal100g: 30, // average mixed
    servingG: [85, 250],
    namedPortions: { cup: 130, bowl: 200, side: 85, plate: 250 },
    delta: 1.2, tag: 'fiber & vitamins',
    reason: 'Fiber, vitamins and very filling for few calories.',
  },

  // ── Eggs & dairy combos ──────────────────────────────────────
  {
    keys: ['omelette', 'omelet'],
    label: 'Omelette',
    cal100g: 154,
    servingG: [150, 250],
    namedPortions: { omelette: 200 },
    delta: 1.0, tag: 'protein',
    reason: 'Protein-rich — calories vary a lot with fillings.',
  },

  // ── Sandwiches & mixed meals ─────────────────────────────────
  {
    keys: ['sandwich'],
    label: 'Sandwich',
    cal100g: 225,
    servingG: [150, 280],
    namedPortions: { sandwich: 200 },
    delta: 0.3, tag: 'mixed',
    reason: 'Depends on the filling — lean protein + veg is best.',
  },

  // ── Processed / treat foods ──────────────────────────────────
  {
    keys: ['cola', 'coke', 'pepsi', 'coca cola', 'diet coke', 'diet pepsi'],
    label: 'Cola',
    cal100g: 37, // regular (diet = 0)
    servingG: [330, 500],
    namedPortions: { can: 330, bottle: 500, glass: 250, cup: 250, ml: 1 },
    delta: -1.4, tag: 'added sugar',
    reason: 'Pure added sugar — a can has ≈ 9 teaspoons of sugar.',
  },
  {
    keys: ['sprite', 'fanta', '7up', 'lemonade soda', 'soda', 'fizzy drink', 'fizzy'],
    label: 'Soda',
    cal100g: 39,
    servingG: [330, 500],
    namedPortions: { can: 330, bottle: 500, glass: 250 },
    delta: -1.3, tag: 'added sugar',
    reason: 'Added sugar with no nutritional value.',
  },
  {
    keys: ['energy drink', 'red bull', 'monster', 'prime'],
    label: 'Energy drink',
    cal100g: 45,
    servingG: [250, 500],
    namedPortions: { can: 250, large: 500 },
    delta: -1.2, tag: 'added sugar & caffeine',
    reason: 'Added sugar plus very high caffeine.',
  },
  {
    keys: ['orange juice', 'apple juice', 'grape juice', 'fruit juice'],
    label: 'Fruit juice',
    cal100g: 45,
    servingG: [240, 360],
    namedPortions: { glass: 240, cup: 240, ml: 1 },
    delta: -0.3, tag: 'natural sugar, no fiber',
    reason: 'Natural sugar but no fiber — spikes blood sugar faster than whole fruit.',
  },
  {
    keys: ['donut', 'doughnut', 'glazed donut'],
    label: 'Donut',
    cal100g: 452,
    servingG: [50, 100],
    namedPortions: { donut: 60, doughnut: 60, 'glazed donut': 50 },
    delta: -1.5, tag: 'fried dough & sugar',
    reason: 'Fried dough loaded with sugar — 1 glazed ≈ 270 kcal.',
  },
  {
    keys: ['chocolate bar', 'kitkat', 'snickers', 'mars bar', 'twix', 'chocolate'],
    label: 'Chocolate bar',
    cal100g: 535,
    servingG: [45, 100],
    namedPortions: { bar: 55, piece: 14, square: 10 },
    delta: -1.3, tag: 'added sugar & fat',
    reason: 'Added sugar and fat — a standard bar ≈ 235 kcal.',
  },
  {
    keys: ['dark chocolate'],
    label: 'Dark chocolate',
    cal100g: 546,
    servingG: [30, 60],
    namedPortions: { square: 10, piece: 10, bar: 40 },
    delta: -0.4, tag: 'antioxidants & fat',
    reason: 'Antioxidants, but still calorie-dense — keep it to 1–2 squares.',
  },
  {
    keys: ['candy', 'sweets', 'gummies', 'skittles', 'haribo', 'jelly beans'],
    label: 'Candy',
    cal100g: 385,
    servingG: [40, 100],
    namedPortions: { bag: 56, handful: 40, pack: 56 },
    delta: -1.3, tag: 'added sugar',
    reason: 'Pure added sugar — a quick spike then a crash.',
  },
  {
    keys: ['french fries', 'fries', 'chips (fries)'],
    label: 'Fries',
    cal100g: 312,
    servingG: [117, 400],
    namedPortions: { small: 117, medium: 154, large: 157, 'small fries': 117, 'medium fries': 154, 'large fries': 157 },
    delta: -1.3, tag: 'fried refined carbs',
    reason: 'Deep-fried refined carbs — medium serving ≈ 480 kcal.',
  },
  {
    keys: ['chips', 'crisps', 'potato chips'],
    label: 'Chips / crisps',
    cal100g: 536,
    servingG: [28, 150],
    namedPortions: { bag: 28, pack: 28, 'small bag': 28, 'large bag': 150, handful: 30 },
    delta: -1.1, tag: 'fried carbs & salt',
    reason: 'Fried, salty refined carbs — easy to over-eat.',
  },
  {
    keys: ['pizza'],
    label: 'Pizza',
    cal100g: 266, // cheese pizza average
    servingG: [107, 500],
    namedPortions: { slice: 107, 'large slice': 150, 'small pizza': 300, 'whole pizza': 800 },
    delta: -1.2, tag: 'refined carbs & fat',
    reason: 'Refined carbs, cheese and oil — 1 slice ≈ 285 kcal.',
  },
  {
    keys: ['cheeseburger', 'hamburger', 'burger'],
    label: 'Burger',
    cal100g: 295,
    servingG: [154, 300],
    namedPortions: { burger: 200, cheeseburger: 154, 'double burger': 268, 'big mac': 215 },
    delta: -1.2, tag: 'fat & refined carbs',
    reason: 'Fat and refined carbs — a standard cheeseburger ≈ 454 kcal.',
  },
  {
    keys: ['hot dog'],
    label: 'Hot dog',
    cal100g: 290,
    servingG: [98, 180],
    namedPortions: { 'hot dog': 98 },
    delta: -1.0, tag: 'saturated fat & salt',
    reason: 'Processed meat high in saturated fat and salt.',
  },
  {
    keys: ['fried chicken'],
    label: 'Fried chicken',
    cal100g: 246,
    servingG: [100, 300],
    namedPortions: { piece: 113, drumstick: 55, breast: 180 },
    delta: -1.1, tag: 'fried fat',
    reason: 'Frying adds a lot of fat — significantly higher than grilled.',
  },
  {
    keys: ['nuggets', 'chicken nuggets'],
    label: 'Chicken nuggets',
    cal100g: 296,
    servingG: [80, 200],
    namedPortions: { nugget: 16, '6 nuggets': 96, '10 nuggets': 160 },
    delta: -1.1, tag: 'fried & processed',
    reason: 'Fried and highly processed — 6 nuggets ≈ 284 kcal.',
  },
  {
    keys: ['mcdonald', "mcdonald's", 'mcdonalds', 'big mac', 'quarter pounder'],
    label: "McDonald's",
    cal100g: 290,
    servingG: [300, 600], // meal estimate
    namedPortions: { 'big mac': 215, 'quarter pounder': 178, meal: 600 },
    delta: -1.3, tag: 'fat, salt & sugar',
    reason: 'Fast food loaded with fat, salt and hidden sugar.',
  },
  {
    keys: ['kfc'],
    label: 'KFC',
    cal100g: 350,
    servingG: [200, 500],
    namedPortions: { piece: 113, meal: 450 },
    delta: -1.3, tag: 'fried fat & salt',
    reason: 'Deep-fried and salty — a KFC meal ≈ 600–900 kcal.',
  },
  {
    keys: ['bacon'],
    label: 'Bacon',
    cal100g: 541, // cooked
    servingG: [20, 60],
    namedPortions: { slice: 8, rasher: 18, strip: 8 },
    delta: -0.8, tag: 'saturated fat & salt',
    reason: 'Very high in saturated fat and salt.',
  },
  {
    keys: ['sausage', 'sausages'],
    label: 'Sausage',
    cal100g: 339,
    servingG: [56, 170],
    namedPortions: { sausage: 56, link: 40 },
    delta: -0.8, tag: 'saturated fat & salt',
    reason: 'Processed meat — high in saturated fat and salt.',
  },
  {
    keys: ['ice cream'],
    label: 'Ice cream',
    cal100g: 207,
    servingG: [65, 200],
    namedPortions: { scoop: 65, bowl: 150, cup: 130 },
    delta: -1.1, tag: 'sugar & fat',
    reason: 'Sugar and fat — 1 scoop ≈ 135 kcal.',
  },
  {
    keys: ['cake', 'birthday cake', 'chocolate cake'],
    label: 'Cake',
    cal100g: 371,
    servingG: [100, 200],
    namedPortions: { slice: 100, piece: 100 },
    delta: -1.2, tag: 'sugar & fat',
    reason: 'Sugar and fat — 1 slice ≈ 371 kcal.',
  },
  {
    keys: ['cookie', 'cookies', 'biscuit', 'biscuits'],
    label: 'Cookies / biscuits',
    cal100g: 502,
    servingG: [16, 80],
    namedPortions: { cookie: 16, biscuit: 10, 'pack of 2': 24 },
    delta: -1.1, tag: 'sugar & refined carbs',
    reason: 'Sugar and refined carbs — easy to eat too many.',
  },
  {
    keys: ['brownie'],
    label: 'Brownie',
    cal100g: 466,
    servingG: [50, 120],
    namedPortions: { brownie: 70, square: 50 },
    delta: -1.2, tag: 'sugar & fat',
    reason: 'Dense sugar and fat — one brownie ≈ 326 kcal.',
  },
  {
    keys: ['beer', 'lager'],
    label: 'Beer',
    cal100g: 43,
    servingG: [330, 500],
    namedPortions: { can: 330, bottle: 330, pint: 568, glass: 330 },
    delta: -1.2, tag: 'empty calories',
    reason: 'Empty calories — a pint ≈ 182 kcal, plus it slows recovery.',
  },
  {
    keys: ['wine', 'red wine', 'white wine'],
    label: 'Wine',
    cal100g: 85,
    servingG: [150, 250],
    namedPortions: { glass: 150, large: 250 },
    delta: -1.1, tag: 'empty calories',
    reason: 'Empty calories — a glass ≈ 125 kcal.',
  },
  {
    keys: ['vodka', 'whiskey', 'whisky', 'gin', 'rum', 'tequila', 'spirits'],
    label: 'Spirits',
    cal100g: 231,
    servingG: [25, 50],
    namedPortions: { shot: 25, double: 50 },
    delta: -1.2, tag: 'empty calories',
    reason: 'Empty calories — a shot ≈ 58 kcal (mixers add more).',
  },

  // ── Sauces / condiments ──────────────────────────────────────
  {
    keys: ['ketchup', 'tomato sauce'],
    label: 'Ketchup',
    cal100g: 101,
    servingG: [15, 30],
    namedPortions: { tbsp: 15, tablespoon: 15, squirt: 10 },
    delta: -0.4, tag: 'added sugar',
    reason: 'Surprisingly sugary — 1 tbsp ≈ 15 kcal.',
  },
  {
    keys: ['mayonnaise', 'mayo'],
    label: 'Mayonnaise',
    cal100g: 680,
    servingG: [14, 30],
    namedPortions: { tbsp: 14, tablespoon: 14 },
    delta: -0.6, tag: 'fat',
    reason: 'Very high in fat — 1 tbsp ≈ 95 kcal.',
  },
  {
    keys: ['olive oil'],
    label: 'Olive oil',
    cal100g: 884,
    servingG: [13, 27],
    namedPortions: { tbsp: 13, tablespoon: 13, drizzle: 7 },
    delta: 0.4, tag: 'healthy fats',
    reason: 'Healthy monounsaturated fat — but very calorie-dense at 120 kcal/tbsp.',
  },
  {
    keys: ['butter'],
    label: 'Butter',
    cal100g: 717,
    servingG: [7, 14],
    namedPortions: { tbsp: 14, tablespoon: 14, pat: 5 },
    delta: -0.3, tag: 'saturated fat',
    reason: 'High in saturated fat — 1 tbsp ≈ 100 kcal.',
  },

  // ── Coffee / tea ─────────────────────────────────────────────
  {
    keys: ['black coffee', 'espresso', 'americano'],
    label: 'Black coffee',
    cal100g: 1,
    servingG: [240, 400],
    namedPortions: { cup: 240, mug: 350, shot: 30 },
    delta: 0.1, tag: 'negligible calories',
    reason: 'Almost zero calories (until you add milk/sugar).',
  },
  {
    keys: ['latte', 'flat white', 'cappuccino', 'macchiato'],
    label: 'Coffee with milk',
    cal100g: 50,
    servingG: [240, 360],
    namedPortions: { cup: 240, large: 360 },
    delta: 0.2, tag: 'protein from milk',
    reason: 'Moderate calories from milk — adds up if you have several.',
  },
  {
    keys: ['tea', 'green tea', 'herbal tea', 'black tea'],
    label: 'Tea',
    cal100g: 1,
    servingG: [240, 360],
    namedPortions: { cup: 240, mug: 350 },
    delta: 0.1, tag: 'negligible calories',
    reason: 'Almost zero calories — antioxidants are a bonus.',
  },
  {
    keys: ['hot chocolate', 'mocha'],
    label: 'Hot chocolate',
    cal100g: 74,
    servingG: [240, 360],
    namedPortions: { cup: 240, mug: 350 },
    delta: -0.5, tag: 'sugar & fat',
    reason: 'A cup ≈ 180 kcal — mostly sugar and fat.',
  },
]

// ── 2. Quantity / unit parser ────────────────────────────────────

const WORD_NUMS = {
  zero: 0, half: 0.5, a: 1, an: 1, one: 1, two: 2, three: 3, four: 4,
  five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  'a couple': 2, couple: 2, few: 3, handful: 1,
}

// Multiplier modifiers detected in the chunk.
// sizeOnly:true → skip when a named portion already encodes size (avoids double-counting)
const MODIFIERS = [
  { keys: ['deep fried', 'deep-fried', 'fried'], calMult: 1.35, delta: -1.2, note: 'fried — much higher in fat', sizeOnly: false },
  { keys: ['grilled', 'baked', 'roasted', 'steamed', 'poached', 'air fried', 'air-fried', 'boiled'], calMult: 0.9, delta: 0.4, note: 'grilled/baked — leaner prep', sizeOnly: false },
  { keys: ['triple', 'jumbo', 'xl', 'extra large', 'supersize'], calMult: 1.6, delta: -0.4, note: 'very large portion', sizeOnly: true },
  { keys: ['double', 'large', 'big'], calMult: 1.3, delta: -0.25, note: 'larger portion', sizeOnly: true },
  { keys: ['small', 'mini', 'half', 'light', 'thin'], calMult: 0.65, delta: 0.2, note: 'smaller portion', sizeOnly: true },
  { keys: ['extra cheese', 'loaded', 'smothered', 'extra sauce', 'with sauce', 'with cheese'], calMult: 1.25, delta: -0.4, note: 'extra toppings add calories', sizeOnly: false },
  { keys: ['no sauce', 'no cheese', 'plain', 'dry', 'no bun', 'without bun', 'without sauce'], calMult: 0.85, delta: 0.3, note: 'kept plain', sizeOnly: false },
  { keys: ['whipped cream', 'cream', 'full fat', 'full-fat'], calMult: 1.2, delta: -0.3, note: 'added cream/full fat', sizeOnly: false },
]

// Unit → grams conversion (approximate)
const WEIGHT_UNITS = { g: 1, gram: 1, grams: 1, kg: 1000, kilogram: 1000,
  oz: 28.35, ounce: 28.35, ounces: 28.35, lb: 453.6, pound: 453.6, pounds: 453.6 }
// Volume → ml (then we use food.namedPortions or divide by 100 for density ≈ 1)
const VOLUME_UNITS = { ml: 1, milliliter: 1, millilitre: 1, l: 1000, liter: 1000, litre: 1000 }
// Named portion units — looked up in food.namedPortions first, then these fallbacks
const PORTION_UNITS = ['cup', 'tbsp', 'tablespoon', 'tsp', 'teaspoon', 'slice', 'piece',
  'scoop', 'rasher', 'strip', 'can', 'bottle', 'glass', 'pint', 'bowl', 'plate', 'mug', 'shot',
  'serving', 'handful']

// Regex: capture optional number then optional unit anywhere in the chunk
const QTY_RE = /([\d.]+)\s*(g|grams?|kg|kilograms?|oz|ounces?|lbs?|pounds?|ml|milliliters?|millilitres?|l(?:iters?|itres?)?\b|cups?|tbsps?|tablespoons?|tsps?|teaspoons?|pieces?|slices?|scoops?|rashers?|strips?|cans?|bottles?|glasses?|pints?|bowls?|plates?|mugs?|shots?|servings?)?\b/i
const WORD_QTY_RE = /\b(a half|half|a couple of|a couple|couple|a few|few|a handful|handful|an?|one|two|three|four|five|six|seven|eight|nine|ten)\b[\s-]*(g|grams?|kg|oz|ounces?|lbs?|pounds?|ml|cups?|tbsps?|tablespoons?|slices?|pieces?|scoops?|glasses?|bowls?|plates?|shots?)?/i

function parseQuantity(chunk) {
  // Try numeric first (e.g. "200g", "1 cup", "3 slices", "2.5")
  const m = chunk.match(QTY_RE)
  if (m) {
    const numQty = parseFloat(m[1])
    const unit = (m[2] || '').toLowerCase().replace(/s$/, '')
    if (!isNaN(numQty) && numQty > 0) return { qty: numQty, unit }
  }
  // Try word numbers (e.g. "a banana", "two eggs", "half cup")
  const wm = chunk.match(WORD_QTY_RE)
  if (wm) {
    const numQty = WORD_NUMS[wm[1].toLowerCase().trim()] ?? null
    const unit = (wm[2] || '').toLowerCase().replace(/s$/, '')
    if (numQty !== null) return { qty: numQty, unit }
  }
  return { qty: null, unit: null }
}

function singularize(u) {
  return (u || '').toLowerCase().replace(/s$/, '')
}

function calsForFood(food, qty, unit, chunkText) {
  const low = food.servingG[0]
  const high = food.servingG[1]

  if (qty !== null && qty > 0) {
    const unitSing = singularize(unit)

    // 1. Weight units → grams exactly
    if (WEIGHT_UNITS[unitSing] || WEIGHT_UNITS[unit]) {
      const factor = WEIGHT_UNITS[unitSing] || WEIGHT_UNITS[unit]
      const g = qty * factor
      const cal = (g / 100) * food.cal100g
      return [Math.round(cal * 0.9), Math.round(cal * 1.1)]
    }

    // 2. Volume units (ml, l)
    if (VOLUME_UNITS[unitSing] || VOLUME_UNITS[unit]) {
      const factor = VOLUME_UNITS[unitSing] || VOLUME_UNITS[unit]
      const g = qty * factor
      const cal = (g / 100) * food.cal100g
      return [Math.round(cal * 0.9), Math.round(cal * 1.1)]
    }

    // 3. Named portion → look up in food.namedPortions first, then standard table
    const STANDARD_PORTIONS = {
      cup: 240, tbsp: 15, tablespoon: 15, tsp: 5, teaspoon: 5,
      glass: 240, bowl: 200, plate: 300, mug: 350, pint: 568,
      handful: 30, scoop: 30, serving: null,
    }
    const portionG =
      food.namedPortions[unitSing] ??
      food.namedPortions[unit] ??
      STANDARD_PORTIONS[unitSing]

    if (portionG != null) {
      const cal = qty * (portionG / 100) * food.cal100g
      return [Math.round(cal * 0.9), Math.round(cal * 1.1)]
    }

    // 4. Named item / pure count ("2 eggs", "3 pizza slices")
    // Also check if the unit IS the food name (e.g. unit="egg" for "2 egg")
    const namedG = food.namedPortions[unitSing] ?? food.namedPortions[unit]
    if (namedG != null) {
      const cal = qty * (namedG / 100) * food.cal100g
      return [Math.round(cal * 0.9), Math.round(cal * 1.1)]
    }

    // 5. Count with no unit → qty × midpoint of one serving
    const midG = (low + high) / 2
    const cal = qty * (midG / 100) * food.cal100g
    return [Math.round(cal * 0.9), Math.round(cal * 1.1)]
  }

  // No quantity — try to find a named portion in the chunk text itself
  // (e.g. "large fries" → namedPortions['large'] = 157g)
  for (const [key, g] of Object.entries(food.namedPortions)) {
    if (chunkText.includes(key) && g) {
      const cal = (g / 100) * food.cal100g
      return [Math.round(cal * 0.9), Math.round(cal * 1.1)]
    }
  }

  // Fallback: typical serving range
  return [
    Math.round((low / 100) * food.cal100g),
    Math.round((high / 100) * food.cal100g),
  ]
}

// ── 3. Food matching ─────────────────────────────────────────────

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
  return MODIFIERS.filter((m) => m.keys.some((k) => chunk.includes(k)))
}

// Did a named portion key match the chunk? If so, size modifiers are redundant.
function namedPortionMatches(food, chunk) {
  for (const key of Object.keys(food.namedPortions)) {
    if (chunk.includes(key) && food.namedPortions[key]) return true
  }
  return false
}

function analyseChunk(chunk) {
  const foods = matchFoods(chunk)
  const allMods = detectModifiers(chunk)
  const { qty, unit } = parseQuantity(chunk)

  if (foods.length === 0) {
    const cleaned = chunk.replace(/[\d.,]/g, '').replace(/\b(g|kg|ml|oz|lb)\b/g, '').trim()
    if (cleaned.length < 2) return []
    return [{ label: titleCase(chunk), known: false, sentiment: 'neutral',
      calLow: 0, calHigh: 0, delta: 0, reason: 'No nutrition data — not counted in the estimate.' }]
  }

  return foods.map((food) => {
    // If a named portion encoded the size, skip size-only modifiers to avoid double-counting
    const hasNamedPortion = qty != null || namedPortionMatches(food, chunk)
    const mods = allMods.filter((m) => !m.sizeOnly || !hasNamedPortion)

    let [calLow, calHigh] = calsForFood(food, qty, unit, chunk)
    let delta = food.delta
    const notes = []
    for (const m of mods) {
      calLow = Math.round(calLow * m.calMult)
      calHigh = Math.round(calHigh * m.calMult)
      delta += m.delta
      notes.push(m.note)
    }
    const sentiment = delta > 0.25 ? 'good' : delta < -0.25 ? 'bad' : 'neutral'
    let reason = food.reason
    if (notes.length) reason += ` (${notes.join('; ')})`
    return { label: food.label, known: true, sentiment, tag: food.tag,
      basis: notes.length ? `${food.cal100g} kcal/100g · ${notes.join(', ')}` : `${food.cal100g} kcal/100g`,
      calLow, calHigh, delta, reason }
  })
}

// ── 4. Scoring & main export ─────────────────────────────────────

const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase())
const roundCal = (x) => Math.round(x / 5) * 5
const uniq = (arr) => [...new Set(arr)]

export function calculateFoodHealthScore(rawText) {
  const text = (rawText || '').toLowerCase().trim()
  if (!text) return { score: 5, explanation: 'No food entered.', calories: { low: 0, high: 0, partial: false }, items: [] }

  const chunks = text.split(/,|\n|;/).map((c) => c.trim()).filter(Boolean)
  const items = (chunks.length ? chunks : [text]).flatMap(analyseChunk)

  let calLow = 0, calHigh = 0, partial = false
  for (const it of items) {
    if (it.known) { calLow += it.calLow; calHigh += it.calHigh }
    else partial = true
  }

  let posSum = 0, negSum = 0
  for (const it of items) {
    if (it.delta > 0) posSum += it.delta
    else if (it.delta < 0) negSum += -it.delta
  }
  const score = Math.round(Math.max(1, Math.min(10, 5 + posSum * 0.9 - negSum * 0.6)))

  const goods = items.filter((i) => i.sentiment === 'good')
  const bads = items.filter((i) => i.sentiment === 'bad')
  const goodLabels = goods.map((i) => i.label)
  const badLabels = bads.map((i) => i.label)
  const goodTags = uniq(goods.map((i) => i.tag).filter(Boolean))
  const badTags = uniq(bads.map((i) => i.tag).filter(Boolean))

  let explanation
  if (score >= 8) explanation = `Strong day — ${list(goodLabels)} bring ${list(goodTags) || 'solid nutrition'}.`
  else if (score >= 6) explanation = badLabels.length ? `Decent day. ${list(goodLabels) || 'Whole foods'} help, just watch the ${list(badLabels)} (${list(badTags)}).` : `Solid, balanced day — ${list(goodTags) || 'good choices'}.`
  else if (score >= 4) explanation = `Mixed day. ${goodLabels.length ? `${list(goodLabels)} is a plus, but ` : ''}${list(badLabels) || 'processed food'} added ${list(badTags) || 'extra sugar & fat'}.`
  else explanation = `Heavy on ${list(badTags) || 'processed food'} today (${list(badLabels) || 'junk food'}). Add more protein and whole foods tomorrow.`

  return {
    score,
    explanation,
    calories: { low: roundCal(calLow), high: roundCal(calHigh), partial },
    items,
  }
}

function list(arr) {
  if (!arr || arr.length === 0) return ''
  if (arr.length === 1) return arr[0]
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`
  return `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`
}

export function formatCalories(calories) {
  if (!calories || (!calories.low && !calories.high)) return null
  const { low, high, partial } = calories
  const core = low === high || Math.abs(high - low) < 15 ? `≈ ${low} kcal` : `≈ ${low}–${high} kcal`
  return partial ? `${core}+` : core
}

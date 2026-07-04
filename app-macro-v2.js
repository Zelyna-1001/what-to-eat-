const STORAGE_SETTINGS = 'todayeat.settings.v1';
const STORAGE_FOODS = 'todayeat.foods.v1';
const STORAGE_PLAN = 'todayeat.plan.v1';
const STORAGE_SEEN = 'todayeat.seenIntro.v1';

const meals = {
  breakfast: { name: '早餐', emoji: '🌞' },
  lunch: { name: '午餐', emoji: '🍱' },
  dinner: { name: '晚餐', emoji: '🌙' },
  post: { name: '练后餐', emoji: '💪' }
};

const dayConfigs = {
  strength: {
    name: '无氧日', emoji: '🏋️', factor: 1.445,
    macroPerKg: { protein: 1.95, carbs: 2.34, fat: 0.89 },
    mealRatio: { breakfast: 0.25, lunch: 0.35, dinner: 0.25, post: 0.15 }
  },
  cardio: {
    name: '有氧日', emoji: '🚴', factor: 1.30,
    macroPerKg: { protein: 1.78, carbs: 1.78, fat: 0.81 },
    mealRatio: { breakfast: 0.25, lunch: 0.35, dinner: 0.30, post: 0.10 }
  },
  rest: {
    name: '休息日', emoji: '🛌', factor: 1.155,
    macroPerKg: { protein: 1.53, carbs: 1.29, fat: 0.73 },
    mealRatio: { breakfast: 0.30, lunch: 0.40, dinner: 0.25, post: 0.05 }
  }
};

const typeLabel = {
  combo: '组合餐', protein: '蛋白质', carb: '主食', veg: '蔬菜', fruit: '水果', drink: '饮品', snack: '减脂零食', other: '其他'
};

let settings = loadSettings();
let foods = loadFoods();
let plan = loadPlan();
let dayType = normalizeDayType(plan.dayType || 'strength');

function $(id) { return document.getElementById(id); }
function money(n) { return '¥' + Number(n || 0).toFixed(Number(n || 0) % 1 ? 1 : 0); }
function kcal(n) { return Math.round(Number(n || 0)) + ' kcal'; }
function grams(n) { return Math.round(Number(n || 0)) + 'g'; }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function clamp(num, min, max) { return Math.max(min, Math.min(max, num)); }
function round5(n) { return Math.round(Number(n || 0) / 5) * 5; }
function round50(n) { return Math.round(Number(n || 0) / 50) * 50; }
function readNumber(id, fallback = 0) { const v = parseFloat($(id).value); return Number.isFinite(v) ? v : fallback; }
function normalizeDayType(t) { if (t === 'training') return 'strength'; if (t === 'rest') return 'rest'; if (t === 'cardio') return 'cardio'; return 'strength'; }

function defaultSettings() {
  return { sex: 'female', age: 21, height: 165, weight: 62, budget: 22, deficit: 450 };
}

function f(name, serving, calories, price, protein, carbs, fat, fiber, type, mealTags, note = '') {
  return { id: uid(), name, serving, calories, price, protein, carbs, fat, fiber, type, mealTags, note };
}

function defaultFoods() {
  return [
    f('食堂一荤两素', '1掌荤菜 + 2拳素菜，约300g', 360, 9.0, 30, 18, 18, 6, 'combo', ['lunch','dinner'], '预算紧时优先选瘦肉/鸡蛋/豆腐类荤菜，少油汁'),
    f('食堂一荤两素 + 米饭', '1掌荤菜 + 2拳素菜 + 1拳米饭', 500, 10.5, 34, 50, 18, 6, 'combo', ['lunch','dinner'], '午餐优先；晚餐可改半拳饭'),
    f('米饭', '1拳，约120g熟饭', 140, 1.0, 2.5, 32, 0.3, 0.5, 'carb', ['lunch','dinner'], ''),
    f('米饭半份', '半拳，约60g熟饭', 70, 0.5, 1.2, 16, 0.2, 0.3, 'carb', ['lunch','dinner'], '休息日晚餐适合'),
    f('全麦面包', '2片，约60g', 160, 3.0, 7, 28, 3, 4, 'carb', ['breakfast','post'], ''),
    f('玉米', '1根，约200g', 170, 3.0, 6, 36, 2.5, 3.5, 'carb', ['breakfast','lunch','dinner','post'], ''),
    f('红薯', '1拳，约150g', 135, 2.5, 2, 31, 0.2, 4, 'carb', ['breakfast','lunch','dinner','post'], ''),
    f('鸡蛋', '1个，约50g', 70, 1.2, 6, 0.6, 5, 0, 'protein', ['breakfast','lunch','dinner','post'], ''),
    f('鸡蛋两个', '2个，约100g', 140, 2.4, 12, 1.2, 10, 0, 'protein', ['breakfast','post'], '蛋白质不够时用'),
    f('豆腐', '1掌，约150g', 160, 3.5, 14, 6, 9, 1, 'protein', ['lunch','dinner'], '便宜蛋白来源'),
    f('鸡胸/瘦肉小份', '1掌，约100g', 170, 6.5, 28, 2, 5, 0, 'protein', ['lunch','dinner','post'], '可用食堂瘦肉、鸡胸肉代替'),
    f('番茄鸡蛋', '1拳菜 + 1个蛋，约200g', 190, 5.0, 12, 12, 11, 2, 'protein', ['lunch','dinner'], '食堂常见'),
    f('青菜/西兰花', '2拳，约250g', 90, 3.5, 5, 13, 3, 5, 'veg', ['lunch','dinner'], ''),
    f('黄瓜/生菜', '2拳，约250g', 45, 2.0, 2, 8, 0.3, 2, 'veg', ['lunch','dinner','snack'], '饿了可加，不太影响热量'),
    f('小番茄', '1拳，约150g', 45, 3.0, 1.5, 9, 0.3, 2, 'fruit', ['breakfast','snack','post'], '减脂零食'),
    f('无糖豆浆', '300ml', 90, 2.0, 8, 5, 3, 1.2, 'drink', ['breakfast','post'], ''),
    f('牛奶', '250ml', 150, 3.0, 8, 12, 8, 0, 'drink', ['breakfast','post'], '想控脂可换低脂奶'),
    f('无糖酸奶', '100g', 70, 3.0, 5, 7, 2.5, 0, 'drink', ['breakfast','post','snack'], '选择无糖/低糖'),
    f('香蕉', '1根，约100g', 90, 2.5, 1, 22, 0.3, 2.5, 'fruit', ['breakfast','post','snack'], '训练前后可用'),
    f('苹果', '1个，约180g', 95, 3.0, 0.5, 25, 0.3, 4, 'fruit', ['breakfast','snack'], ''),
    f('紫菜蛋花汤', '1碗，约250ml', 70, 2.0, 5, 4, 3, 0.5, 'protein', ['lunch','dinner'], ''),
    f('蛋白粉', '1勺，约30g', 120, 4.0, 24, 3, 2, 0, 'protein', ['post','breakfast'], '可选，不想用可以删除'),
    f('海苔', '1小包，约5g', 25, 1.5, 1, 2, 1, 0.5, 'snack', ['snack','post'], '解馋用'),
    f('魔芋果冻', '1个，约100g', 25, 2.0, 0, 6, 0, 1, 'snack', ['snack'], '注意别用它替代正餐'),
    f('坚果少量', '半小把，约10g', 60, 2.0, 2, 2, 5, 1, 'snack', ['snack'], '脂肪够了就少吃')
  ];
}

function loadSettings() {
  try { return { ...defaultSettings(), ...(JSON.parse(localStorage.getItem(STORAGE_SETTINGS)) || {}) }; }
  catch { return defaultSettings(); }
}
function saveSettings() { localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings)); }
function loadFoods() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_FOODS)); } catch {}
  const defaults = defaultFoods();
  if (!Array.isArray(saved) || !saved.length) {
    localStorage.setItem(STORAGE_FOODS, JSON.stringify(defaults));
    return defaults;
  }
  const normalized = saved.map(food => ({ serving: food.serving || food.servingDesc || '1份', fiber: 0, ...food }));
  const names = new Set(normalized.map(x => String(x.name || '').trim()));
  const missing = defaults.filter(x => !names.has(x.name));
  const merged = [...normalized, ...missing];
  localStorage.setItem(STORAGE_FOODS, JSON.stringify(merged));
  return merged;
}
function saveFoods() { localStorage.setItem(STORAGE_FOODS, JSON.stringify(foods)); }
function loadPlan() {
  try {
    const p = JSON.parse(localStorage.getItem(STORAGE_PLAN));
    if (p) return { dayType: normalizeDayType(p.dayType), locked: p.locked || {}, meals: p.meals || {}, note: p.note || '' };
  } catch {}
  return { dayType: 'strength', locked: {}, meals: {} };
}
function savePlan() { localStorage.setItem(STORAGE_PLAN, JSON.stringify({ ...plan, dayType })); }

function bmr() {
  const base = 10 * Number(settings.weight || 0) + 6.25 * Number(settings.height || 0) - 5 * Number(settings.age || 0);
  return settings.sex === 'male' ? base + 5 : base - 161;
}
function targets(type = dayType) {
  const cfg = dayConfigs[type] || dayConfigs.strength;
  const weight = Number(settings.weight || 0);
  const calories = Math.max(settings.sex === 'female' ? 1000 : 1200, round50(bmr() * cfg.factor - Number(settings.deficit || 0)));
  return {
    calories,
    protein: round5(weight * cfg.macroPerKg.protein),
    carbs: round5(weight * cfg.macroPerKg.carbs),
    fat: round5(weight * cfg.macroPerKg.fat)
  };
}
function mealTargets(mealKey) {
  const t = targets(dayType);
  const ratio = dayConfigs[dayType].mealRatio[mealKey] || 0.25;
  return { calories: t.calories * ratio, protein: t.protein * ratio, carbs: t.carbs * ratio, fat: t.fat * ratio, price: Number(settings.budget || 0) * ratio };
}
function totals(items) {
  return (items || []).reduce((acc, food) => {
    acc.calories += Number(food.calories || 0);
    acc.price += Number(food.price || 0);
    acc.protein += Number(food.protein || 0);
    acc.carbs += Number(food.carbs || 0);
    acc.fat += Number(food.fat || 0);
    acc.fiber += Number(food.fiber || 0);
    return acc;
  }, { calories: 0, price: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
}

function sample(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
function addUnique(list, item, max) {
  if (item && !list.some(x => x.id === item.id) && list.length < max) list.push(item);
}
function candidatesFor(mealKey) {
  return foods.filter(x => (x.mealTags || []).includes(mealKey));
}
function randomMealCandidate(mealKey, avoidIds = []) {
  const pool = candidatesFor(mealKey).filter(x => !avoidIds.includes(x.id));
  if (!pool.length) return [];
  const byType = type => shuffle(pool.filter(x => x.type === type));
  const maxItems = mealKey === 'lunch' || mealKey === 'dinner' ? 4 : 3;
  const candidate = [];
  if (mealKey === 'breakfast') {
    addUnique(candidate, sample([...byType('protein'), ...byType('drink')]), maxItems);
    addUnique(candidate, sample([...byType('carb'), ...byType('fruit')]), maxItems);
    if (Math.random() > 0.45) addUnique(candidate, sample([...byType('drink'), ...byType('snack')]), maxItems);
  } else if (mealKey === 'lunch' || mealKey === 'dinner') {
    if (Math.random() > 0.35) addUnique(candidate, sample(byType('combo')), maxItems);
    if (!candidate.some(x => x.type === 'combo')) {
      addUnique(candidate, sample(byType('protein')), maxItems);
      addUnique(candidate, sample(byType('carb')), maxItems);
      addUnique(candidate, sample(byType('veg')), maxItems);
    }
    if (Math.random() > 0.55) addUnique(candidate, sample([...byType('veg'), ...byType('protein')]), maxItems);
  } else if (mealKey === 'post') {
    addUnique(candidate, sample([...byType('protein'), ...byType('drink')]), maxItems);
    addUnique(candidate, sample([...byType('carb'), ...byType('fruit')]), maxItems);
    if (dayType === 'rest' && Math.random() > 0.55) return [sample([...byType('drink'), ...byType('fruit'), ...byType('snack')])].filter(Boolean);
    if (Math.random() > 0.65) addUnique(candidate, sample(byType('snack')), maxItems);
  }
  if (!candidate.length) addUnique(candidate, sample(pool), maxItems);
  return candidate;
}
function scoreCombo(items, target, dailyBudgetLeft = Infinity) {
  const t = totals(items);
  const macroScore = Math.abs(t.calories - target.calories) * 0.8
    + Math.abs(t.protein - target.protein) * 6
    + Math.abs(t.carbs - target.carbs) * 2.5
    + Math.abs(t.fat - target.fat) * 4;
  const pricePenalty = Math.max(0, t.price - target.price) * 20 + Math.max(0, t.price - dailyBudgetLeft) * 100;
  const varietyBonus = new Set(items.map(x => x.type)).size * 10;
  return macroScore + pricePenalty - varietyBonus;
}
function bestMealFor(mealKey, avoidIds = [], budgetLeft = Infinity) {
  const target = mealTargets(mealKey);
  let best = [];
  let bestScore = Infinity;
  for (let i = 0; i < 700; i++) {
    const cand = randomMealCandidate(mealKey, avoidIds);
    const sc = scoreCombo(cand, target, budgetLeft);
    if (sc < bestScore) { best = cand; bestScore = sc; }
  }
  return best;
}
function generateFullPlan(keepLocked = true) {
  const locked = keepLocked ? (plan.locked || {}) : {};
  const budget = Number(settings.budget || 0);
  const target = targets(dayType);
  let bestMeals = {};
  let bestScore = Infinity;
  let bestTotals = null;
  for (let attempt = 0; attempt < 500; attempt++) {
    const current = {};
    const used = [];
    let budgetLeft = budget;
    for (const key of Object.keys(meals)) {
      if (locked[key] && plan.meals && Array.isArray(plan.meals[key])) {
        current[key] = plan.meals[key];
      } else {
        current[key] = bestMealFor(key, used, Math.max(0, budgetLeft));
      }
      used.push(...(current[key] || []).map(x => x.id));
      budgetLeft -= totals(current[key]).price;
    }
    const t = totals(Object.values(current).flat());
    const score = Math.abs(t.calories - target.calories) * 0.8
      + Math.abs(t.protein - target.protein) * 6
      + Math.abs(t.carbs - target.carbs) * 2.4
      + Math.abs(t.fat - target.fat) * 4
      + Math.max(0, t.price - budget) * 160
      + Math.max(0, target.protein * 0.75 - t.protein) * 10
      - Math.min(t.fiber, 20) * 2;
    if (score < bestScore) { bestMeals = current; bestScore = score; bestTotals = t; }
  }
  plan = { ...plan, dayType, meals: bestMeals, locked, note: balanceNote(bestTotals), createdAt: new Date().toISOString() };
  savePlan();
  render();
}
function rerollMeal(mealKey) {
  const budget = Number(settings.budget || 0);
  const otherItems = Object.entries(plan.meals || {}).filter(([k]) => k !== mealKey).flatMap(([, arr]) => arr || []);
  const used = otherItems.map(x => x.id);
  const budgetLeft = Math.max(0, budget - totals(otherItems).price);
  let best = [];
  let bestScore = Infinity;
  for (let i = 0; i < 900; i++) {
    const cand = randomMealCandidate(mealKey, used);
    const allTotals = totals([...otherItems, ...cand]);
    const target = targets(dayType);
    const sc = Math.abs(allTotals.calories - target.calories) * 0.8
      + Math.abs(allTotals.protein - target.protein) * 6
      + Math.abs(allTotals.carbs - target.carbs) * 2.4
      + Math.abs(allTotals.fat - target.fat) * 4
      + Math.max(0, allTotals.price - budget) * 160
      + Math.max(0, totals(cand).price - budgetLeft) * 90;
    if (sc < bestScore) { best = cand; bestScore = sc; }
  }
  plan.meals = plan.meals || {};
  plan.meals[mealKey] = best;
  plan.locked = plan.locked || {};
  plan.locked[mealKey] = false;
  plan.note = balanceNote(totals(Object.values(plan.meals).flat()));
  savePlan(); render();
}

function updateTargets() {
  const t = targets(dayType);
  $('budgetText').textContent = money(settings.budget);
  $('calorieTargetText').textContent = kcal(t.calories);
  $('macroTargetText').textContent = `P${grams(t.protein)} C${grams(t.carbs)} F${grams(t.fat)}`;
  $('deficitText').textContent = kcal(settings.deficit);
  $('profileHint').textContent = `当前：${settings.sex === 'female' ? '女' : '男'}，${settings.age}岁，${settings.height}cm，${settings.weight}kg。${dayConfigs[dayType].name}目标：蛋白${grams(t.protein)}、碳水${grams(t.carbs)}、脂肪${grams(t.fat)}。`;
  ['strength','cardio','rest'].forEach(k => $(k + 'Btn').classList.toggle('active', dayType === k));
}
function renderPlan() {
  const all = Object.values(plan.meals || {}).flat();
  const hasPlan = all.length > 0;
  const target = targets(dayType);
  $('planTitle').textContent = hasPlan ? `${dayConfigs[dayType].emoji} ${dayConfigs[dayType].name}建议组合` : '先生成一组';
  const t = totals(all);
  $('planSummary').innerHTML = `
    <div><span>总热量 / 目标</span><strong>${kcal(t.calories)} / ${kcal(target.calories)}</strong></div>
    <div><span>总价格 / 预算</span><strong>${money(t.price)} / ${money(settings.budget)}</strong></div>
    <div><span>蛋白质</span><strong>${grams(t.protein)} / ${grams(target.protein)}</strong></div>
    <div><span>碳水 / 脂肪</span><strong>${grams(t.carbs)} / ${grams(t.fat)}</strong></div>
  `;
  $('mealList').innerHTML = Object.entries(meals).map(([key, meta]) => mealCard(key, meta)).join('');
  $('planNote').textContent = hasPlan ? (plan.note || balanceNote(t)) : '点击“随机组合”，会按无氧日/有氧日/休息日的热量、蛋白、碳水、脂肪和每日预算生成早餐、午餐、晚餐、练后餐。';
  $('planNote').classList.toggle('plan-warning', t.price > Number(settings.budget || 0));
}
function balanceNote(t) {
  if (!t) return '';
  const budget = Number(settings.budget || 0);
  const target = targets(dayType);
  const parts = [];
  parts.push(t.price <= budget ? '价格未超过预算' : `超出预算 ${money(t.price - budget)}，可减少零食/酸奶或换半拳米饭`);
  parts.push(Math.abs(t.calories - target.calories) <= target.calories * 0.12 ? '热量接近目标' : (t.calories > target.calories ? '热量偏高' : '热量偏低'));
  parts.push(t.protein >= target.protein * 0.85 ? '蛋白质基本够' : '蛋白质偏少，可加鸡蛋/豆腐/无糖豆浆/蛋白粉');
  parts.push(t.carbs > target.carbs * 1.18 ? '碳水偏高，可把1拳饭改半拳' : '碳水可控');
  parts.push(t.fat > target.fat * 1.18 ? '脂肪偏高，少选油多的荤菜' : '脂肪可控');
  return parts.join(' · ');
}
function mealCard(key, meta) {
  const arr = (plan.meals && plan.meals[key]) || [];
  const t = totals(arr);
  const mt = mealTargets(key);
  const locked = plan.locked && plan.locked[key];
  return `
    <article class="meal-card ${locked ? 'locked' : ''}">
      <div class="meal-top">
        <div class="meal-title"><span class="meal-emoji">${meta.emoji}</span>${meta.name}</div>
        <div class="meal-actions">
          <button class="tiny-btn" data-reroll="${key}">换一个</button>
          <button class="tiny-btn ${locked ? 'active' : ''}" data-lock="${key}">${locked ? '已吃/锁定' : '标记已吃'}</button>
        </div>
      </div>
      <div class="meal-item-list">${arr.length ? arr.map(foodLine).join('') : '<div class="meal-item"><strong>还没生成</strong><small>点击“随机组合”</small></div>'}</div>
      <div class="meal-stats">
        <span>${kcal(t.calories)} / 约${kcal(mt.calories)}</span><span>${money(t.price)}</span><span>P ${grams(t.protein)}</span><span>C ${grams(t.carbs)}</span><span>F ${grams(t.fat)}</span>
      </div>
    </article>`;
}
function foodLine(food) {
  return `<div class="meal-item"><strong>${escapeHtml(food.name || '未命名食物')}</strong><small>${escapeHtml(food.serving || '1份')} · ${kcal(food.calories)} · ${money(food.price)} · P${grams(food.protein)} C${grams(food.carbs)} F${grams(food.fat)}</small></div>`;
}
function renderFoods() {
  const mealFilter = $('foodFilterMeal').value;
  const typeFilter = $('foodFilterType').value;
  const list = foods.filter(food => {
    const mealOk = mealFilter === 'all' || (food.mealTags || []).includes(mealFilter);
    const typeOk = typeFilter === 'all' || food.type === typeFilter;
    return mealOk && typeOk;
  });
  $('foodList').innerHTML = list.length ? list.map(foodCard).join('') : '<div class="empty">还没有符合筛选的食物。点右下角 + 添加。</div>';
}
function foodCard(food) {
  const mealText = (food.mealTags || []).map(k => meals[k]?.name || (k === 'snack' ? '零食/加餐' : k)).join(' / ');
  return `
    <article class="food-card" data-edit-food="${food.id}">
      <div class="food-card-top">
        <div class="food-line">
          <div class="food-name">${escapeHtml(food.name || '未命名食物')}</div>
          <div class="food-serving">${escapeHtml(food.serving || '1份')}</div>
          <div class="badge-row"><span class="badge">${typeLabel[food.type] || '其他'}</span><span class="badge">${escapeHtml(mealText || '未分类餐次')}</span></div>
        </div>
        <strong>${money(food.price)}</strong>
      </div>
      <div class="food-macros"><span>${kcal(food.calories)}</span><span>P ${grams(food.protein)}</span><span>C ${grams(food.carbs)}</span><span>F ${grams(food.fat)}</span><span>纤维 ${grams(food.fiber)}</span></div>
      ${food.note ? `<p class="muted small">${escapeHtml(food.note)}</p>` : ''}
    </article>`;
}
function render() { updateTargets(); renderPlan(); renderFoods(); }
function escapeHtml(text) { return String(text ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch])); }

function openFoodDialog(food = null) {
  $('foodDialogTitle').textContent = food ? '编辑食物' : '添加食物';
  $('editingFoodId').value = food?.id || '';
  $('foodNameInput').value = food?.name || '';
  $('foodServingInput').value = food?.serving || '';
  $('foodCaloriesInput').value = food?.calories ?? '';
  $('foodPriceInput').value = food?.price ?? '';
  $('foodProteinInput').value = food?.protein ?? '';
  $('foodCarbInput').value = food?.carbs ?? '';
  $('foodFatInput').value = food?.fat ?? '';
  $('foodFiberInput').value = food?.fiber ?? '';
  $('foodTypeInput').value = food?.type || 'combo';
  $('foodNoteInput').value = food?.note || '';
  document.querySelectorAll('input[name="mealTags"]').forEach(cb => cb.checked = (food?.mealTags || ['breakfast','lunch','dinner']).includes(cb.value));
  $('deleteFoodBtn').hidden = !food;
  $('foodDialog').showModal();
}
function saveFoodFromForm() {
  const mealTags = [...document.querySelectorAll('input[name="mealTags"]:checked')].map(x => x.value);
  const data = {
    id: $('editingFoodId').value || uid(),
    name: $('foodNameInput').value.trim() || '未命名食物',
    serving: $('foodServingInput').value.trim() || '1份',
    calories: readNumber('foodCaloriesInput', 0), price: readNumber('foodPriceInput', 0),
    protein: readNumber('foodProteinInput', 0), carbs: readNumber('foodCarbInput', 0), fat: readNumber('foodFatInput', 0), fiber: readNumber('foodFiberInput', 0),
    type: $('foodTypeInput').value,
    mealTags: mealTags.length ? mealTags : ['breakfast','lunch','dinner'],
    note: $('foodNoteInput').value.trim()
  };
  const index = foods.findIndex(x => x.id === data.id);
  if (index >= 0) foods[index] = data; else foods.unshift(data);
  saveFoods(); $('foodDialog').close(); render();
}
function openSettingsDialog() {
  $('sexInput').value = settings.sex;
  $('ageInput').value = settings.age;
  $('heightInput').value = settings.height;
  $('weightInput').value = settings.weight;
  $('budgetInput').value = settings.budget;
  $('deficitInput').value = settings.deficit;
  $('settingsDialog').showModal();
}
function saveSettingsFromForm(mode = 'settings') {
  const ids = mode === 'init'
    ? { sex: 'initSex', age: 'initAge', height: 'initHeight', weight: 'initWeight', budget: 'initBudget', deficit: 'initDeficit' }
    : { sex: 'sexInput', age: 'ageInput', height: 'heightInput', weight: 'weightInput', budget: 'budgetInput', deficit: 'deficitInput' };
  settings = { sex: $(ids.sex).value, age: parseInt($(ids.age).value, 10) || 21, height: parseFloat($(ids.height).value) || 165, weight: parseFloat($(ids.weight).value) || 62, budget: parseFloat($(ids.budget).value) || 22, deficit: parseFloat($(ids.deficit).value) || 450 };
  saveSettings(); render();
}
function exportBackup() {
  const data = { version: 2, exportedAt: new Date().toISOString(), settings, foods, plan: { ...plan, dayType } };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = URL.createObjectURL(blob); a.download = `今天吃什么-备份-${date}.json`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
}
function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || !Array.isArray(data.foods)) throw new Error('备份格式不对');
      if (!confirm('导入会覆盖当前设置、食物库和当前组合，确认导入吗？')) return;
      settings = { ...defaultSettings(), ...(data.settings || {}) };
      foods = data.foods.map(food => ({ serving: food.serving || food.servingDesc || '1份', fiber: 0, ...food }));
      plan = data.plan || { dayType: 'strength', locked: {}, meals: {} };
      dayType = normalizeDayType(plan.dayType || 'strength');
      saveSettings(); saveFoods(); savePlan(); $('backupDialog').close(); render(); alert('导入成功');
    } catch (e) { alert('导入失败：' + e.message); }
  };
  reader.readAsText(file);
}
function fillInitialInputs() {
  $('initSex').value = settings.sex; $('initAge').value = settings.age; $('initHeight').value = settings.height; $('initWeight').value = settings.weight; $('initBudget').value = settings.budget; $('initDeficit').value = settings.deficit;
}
function initEvents() {
  $('settingsBtn').addEventListener('click', openSettingsDialog);
  $('closeSettingsBtn').addEventListener('click', () => $('settingsDialog').close());
  $('settingsForm').addEventListener('submit', e => { e.preventDefault(); saveSettingsFromForm('settings'); $('settingsDialog').close(); });
  $('firstRunForm').addEventListener('submit', e => { e.preventDefault(); saveSettingsFromForm('init'); localStorage.setItem(STORAGE_SEEN, '1'); $('firstRunDialog').close(); });
  ['strength','cardio','rest'].forEach(k => $(k + 'Btn').addEventListener('click', () => { dayType = k; plan.dayType = k; savePlan(); render(); }));
  $('generateBtn').addEventListener('click', () => generateFullPlan(true));
  $('addFoodBtn').addEventListener('click', () => openFoodDialog());
  $('closeFoodBtn').addEventListener('click', () => $('foodDialog').close());
  $('foodForm').addEventListener('submit', e => { e.preventDefault(); saveFoodFromForm(); });
  $('deleteFoodBtn').addEventListener('click', () => { const id = $('editingFoodId').value; if (id && confirm('确定删除这个食物吗？')) { foods = foods.filter(x => x.id !== id); saveFoods(); $('foodDialog').close(); render(); } });
  $('foodList').addEventListener('click', e => { const card = e.target.closest('[data-edit-food]'); if (card) openFoodDialog(foods.find(x => x.id === card.dataset.editFood)); });
  $('mealList').addEventListener('click', e => { const reroll = e.target.closest('[data-reroll]'); const lock = e.target.closest('[data-lock]'); if (reroll) rerollMeal(reroll.dataset.reroll); if (lock) { plan.locked = plan.locked || {}; const key = lock.dataset.lock; plan.locked[key] = !plan.locked[key]; savePlan(); render(); } });
  $('foodFilterMeal').addEventListener('change', renderFoods);
  $('foodFilterType').addEventListener('change', renderFoods);
  $('backupBtn').addEventListener('click', () => $('backupDialog').showModal());
  $('closeBackupBtn').addEventListener('click', () => $('backupDialog').close());
  $('exportBtn').addEventListener('click', exportBackup);
  $('importInput').addEventListener('change', e => { if (e.target.files[0]) importBackup(e.target.files[0]); e.target.value = ''; });
  $('resetDemoBtn').addEventListener('click', () => { if (confirm('会把食物库重置为示例食物，当前自定义食物会被覆盖。继续吗？')) { foods = defaultFoods(); saveFoods(); render(); } });
}

initEvents();
fillInitialInputs();
render();
if (!localStorage.getItem(STORAGE_SEEN)) setTimeout(() => $('firstRunDialog').showModal(), 300);
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

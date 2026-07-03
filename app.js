const STORAGE_SETTINGS = 'todayeat.settings.v1';
const STORAGE_FOODS = 'todayeat.foods.v1';
const STORAGE_PLAN = 'todayeat.plan.v1';

const meals = {
  breakfast: { name: '早餐', emoji: '🌞', ratio: 0.25 },
  lunch: { name: '午餐', emoji: '🍱', ratio: 0.40 },
  dinner: { name: '晚餐', emoji: '🌙', ratio: 0.35 }
};

const typeLabel = {
  protein: '蛋白质', carb: '主食', veg: '蔬菜', fruit: '水果', drink: '饮品', other: '其他'
};

let settings = loadSettings();
let foods = loadFoods();
let plan = loadPlan();
let dayType = plan.dayType || 'training';

function $(id) { return document.getElementById(id); }
function money(n) { return '¥' + (Number(n || 0)).toFixed(Number(n || 0) % 1 ? 1 : 0); }
function kcal(n) { return Math.round(Number(n || 0)) + ' kcal'; }
function grams(n) { return (Number(n || 0)).toFixed(Number(n || 0) % 1 ? 1 : 0) + 'g'; }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function clamp(num, min, max) { return Math.max(min, Math.min(max, num)); }
function readNumber(id, fallback = 0) { const v = parseFloat($(id).value); return Number.isFinite(v) ? v : fallback; }

function defaultSettings() {
  return { sex: 'female', age: 21, height: 165, weight: 62, budget: 22, deficit: 450 };
}

function defaultFoods() {
  return [
    f('鸡蛋', 70, 0.8, 6.2, 0.6, 5, 0, 'protein', ['breakfast','lunch','dinner'], '便利店/食堂都好买'),
    f('无糖豆浆', 90, 2.5, 7, 6, 3, 1.2, 'drink', ['breakfast'], ''),
    f('燕麦片', 180, 2.0, 6, 31, 4, 4, 'carb', ['breakfast'], '可配牛奶或豆浆'),
    f('玉米', 160, 3.0, 5, 34, 2, 3, 'carb', ['breakfast','lunch','dinner'], ''),
    f('全麦面包两片', 170, 3.0, 7, 30, 3, 4, 'carb', ['breakfast'], ''),
    f('牛奶', 130, 3.0, 7, 10, 6, 0, 'drink', ['breakfast','snack'], ''),
    f('苹果', 95, 2.5, 0.5, 25, 0.3, 4, 'fruit', ['breakfast','snack'], ''),
    f('米饭半份', 170, 1.5, 3, 37, 0.4, 0.6, 'carb', ['lunch','dinner'], ''),
    f('鸡胸肉', 180, 7.0, 32, 0, 4, 0, 'protein', ['lunch','dinner'], ''),
    f('番茄鸡蛋', 210, 6.0, 13, 9, 13, 2, 'protein', ['lunch','dinner'], '食堂常见'),
    f('青菜/西兰花', 80, 4.0, 4, 12, 1, 5, 'veg', ['lunch','dinner'], ''),
    f('黄瓜/生菜', 45, 2.0, 2, 8, 0.3, 2, 'veg', ['lunch','dinner'], ''),
    f('紫菜蛋花汤', 70, 2.0, 5, 4, 3, 0.5, 'protein', ['lunch','dinner'], ''),
    f('豆腐', 160, 4.0, 14, 6, 9, 1, 'protein', ['lunch','dinner'], ''),
    f('酸奶', 120, 4.0, 6, 16, 3, 0, 'drink', ['breakfast','snack'], '注意选低糖'),
    f('香蕉', 105, 2.5, 1, 27, 0.4, 3, 'fruit', ['breakfast','snack'], '训练日前后可用'),
    f('牛肉/瘦肉小份', 220, 8.0, 25, 3, 10, 0, 'protein', ['lunch','dinner'], ''),
    f('红薯', 160, 3.0, 2, 36, 0.2, 4, 'carb', ['breakfast','lunch','dinner'], '')
  ];
}
function f(name, calories, price, protein, carbs, fat, fiber, type, mealTags, note) {
  return { id: uid(), name, calories, price, protein, carbs, fat, fiber, type, mealTags, note };
}

function loadSettings() {
  try { return { ...defaultSettings(), ...(JSON.parse(localStorage.getItem(STORAGE_SETTINGS)) || {}) }; }
  catch { return defaultSettings(); }
}
function saveSettings() { localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings)); }
function loadFoods() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_FOODS));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {}
  const list = defaultFoods();
  localStorage.setItem(STORAGE_FOODS, JSON.stringify(list));
  return list;
}
function saveFoods() { localStorage.setItem(STORAGE_FOODS, JSON.stringify(foods)); }
function loadPlan() {
  try { return JSON.parse(localStorage.getItem(STORAGE_PLAN)) || { dayType: 'training', locked: {}, meals: {} }; }
  catch { return { dayType: 'training', locked: {}, meals: {} }; }
}
function savePlan() { localStorage.setItem(STORAGE_PLAN, JSON.stringify(plan)); }

function bmr() {
  const { sex, age, height, weight } = settings;
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}
function targetCalories(type = dayType) {
  const factor = type === 'training' ? 1.55 : 1.35;
  const target = bmr() * factor - Number(settings.deficit || 0);
  return Math.max(settings.sex === 'female' ? 1200 : 1400, Math.round(target));
}
function proteinTarget() { return Math.round(Number(settings.weight || 0) * 1.2); }

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

function comboForMeal(mealKey, calorieTarget, budgetLimit, avoidIds = []) {
  const pool = foods.filter(x => (x.mealTags || []).includes(mealKey) && !avoidIds.includes(x.id));
  if (!pool.length) return [];
  const maxItems = mealKey === 'breakfast' ? 3 : 4;
  let best = [];
  let bestScore = Infinity;
  for (let i = 0; i < 900; i++) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const count = 1 + Math.floor(Math.random() * Math.min(maxItems, shuffled.length));
    let candidate = shuffled.slice(0, count);
    // encourage variety: for lunch/dinner try to include carb + protein + veg if available
    if (mealKey !== 'breakfast') {
      const mustTypes = ['protein', 'carb', 'veg'];
      for (const t of mustTypes) {
        if (!candidate.some(x => x.type === t)) {
          const item = pool.filter(x => x.type === t && !candidate.some(c => c.id === x.id)).sort(() => Math.random() - 0.5)[0];
          if (item && candidate.length < maxItems) candidate.push(item);
        }
      }
    }
    const t = totals(candidate);
    if (t.price > budgetLimit * 1.15) continue;
    const pricePenalty = t.price > budgetLimit ? (t.price - budgetLimit) * 18 : 0;
    const calorieDiff = Math.abs(t.calories - calorieTarget);
    const typeVariety = new Set(candidate.map(x => x.type)).size;
    const proteinBonus = Math.min(t.protein, proteinTarget() * meals[mealKey].ratio) * 2;
    const vegBonus = candidate.some(x => x.type === 'veg') ? 20 : 0;
    const score = calorieDiff + pricePenalty - typeVariety * 12 - proteinBonus - vegBonus;
    if (score < bestScore) { best = candidate; bestScore = score; }
  }
  return best.length ? best : [pool[Math.floor(Math.random() * pool.length)]];
}

function generateFullPlan(keepLocked = true) {
  const target = targetCalories(dayType);
  const budget = Number(settings.budget || 0);
  const locked = keepLocked ? (plan.locked || {}) : {};
  let bestMeals = {};
  let bestScore = Infinity;
  let bestNote = '';
  for (let attempt = 0; attempt < 500; attempt++) {
    const current = {};
    const used = [];
    for (const key of Object.keys(meals)) {
      if (locked[key] && plan.meals && plan.meals[key]) {
        current[key] = plan.meals[key];
        used.push(...current[key].map(x => x.id));
      } else {
        current[key] = comboForMeal(key, target * meals[key].ratio, budget * meals[key].ratio, used);
        used.push(...current[key].map(x => x.id));
      }
    }
    const all = Object.values(current).flat();
    const t = totals(all);
    const calorieDiff = Math.abs(t.calories - target);
    const overBudget = Math.max(0, t.price - budget);
    const pTarget = proteinTarget();
    const proteinDiff = Math.max(0, pTarget - t.protein);
    const fiberDiff = Math.max(0, 18 - t.fiber);
    const hasVegMeals = Object.entries(current).filter(([k, arr]) => k !== 'breakfast' && arr.some(x => x.type === 'veg')).length;
    const score = calorieDiff + overBudget * 80 + proteinDiff * 7 + fiberDiff * 4 - hasVegMeals * 25;
    if (score < bestScore) {
      bestMeals = current;
      bestScore = score;
      bestNote = t.price > budget ? '食物库里暂时没有完全不超预算的组合，这是最接近的一组。可以加一些更便宜的食物后再随机。' : '';
    }
  }
  plan = { ...plan, dayType, meals: bestMeals, locked, note: bestNote, createdAt: new Date().toISOString() };
  savePlan();
  render();
}

function rerollMeal(mealKey) {
  const target = targetCalories(dayType);
  const budget = Number(settings.budget || 0);
  const used = Object.entries(plan.meals || {})
    .filter(([key]) => key !== mealKey)
    .flatMap(([, arr]) => arr || [])
    .map(x => x.id);
  const currentOther = Object.entries(plan.meals || {})
    .filter(([key]) => key !== mealKey)
    .flatMap(([, arr]) => arr || []);
  const remainingBudget = Math.max(0, budget - totals(currentOther).price);
  const remainingCalories = Math.max(100, target - totals(currentOther).calories);
  plan.meals = plan.meals || {};
  plan.meals[mealKey] = comboForMeal(mealKey, remainingCalories, remainingBudget, used);
  plan.locked = plan.locked || {};
  plan.locked[mealKey] = false;
  savePlan();
  render();
}

function render() {
  updateTargets();
  renderPlan();
  renderFoods();
}

function updateTargets() {
  $('budgetText').textContent = money(settings.budget);
  $('calorieTargetText').textContent = kcal(targetCalories(dayType));
  $('deficitText').textContent = kcal(settings.deficit);
  $('profileHint').textContent = `当前：${settings.sex === 'female' ? '女' : '男'}，${settings.age}岁，${settings.height}cm，${settings.weight}kg。蛋白目标约 ${proteinTarget()}g/天。`;
  $('trainingBtn').classList.toggle('active', dayType === 'training');
  $('restBtn').classList.toggle('active', dayType === 'rest');
}

function renderPlan() {
  const all = Object.values(plan.meals || {}).flat();
  const hasPlan = all.length > 0;
  $('planTitle').textContent = hasPlan ? (dayType === 'training' ? '训练日建议组合' : '休息日建议组合') : '先生成一组';
  const t = totals(all);
  $('planSummary').innerHTML = `
    <div><span>总热量</span><strong>${kcal(t.calories)}</strong></div>
    <div><span>总价格</span><strong>${money(t.price)}</strong></div>
    <div><span>蛋白质</span><strong>${grams(t.protein)}</strong></div>
  `;
  $('mealList').innerHTML = Object.entries(meals).map(([key, meta]) => mealCard(key, meta)).join('');
  $('planNote').textContent = hasPlan ? (plan.note || balanceNote(t)) : '添加一些常吃食物后，点击“随机组合”。你也可以先用内置示例试试。';
}

function balanceNote(t) {
  const budget = Number(settings.budget || 0);
  const target = targetCalories(dayType);
  const parts = [];
  if (t.price <= budget) parts.push('价格未超过预算'); else parts.push(`超出预算 ${money(t.price - budget)}`);
  if (Math.abs(t.calories - target) <= target * 0.12) parts.push('热量接近目标'); else parts.push(t.calories > target ? '热量偏高' : '热量偏低');
  if (t.protein >= proteinTarget() * 0.85) parts.push('蛋白质比较够'); else parts.push('蛋白质偏少，可加鸡蛋/豆腐/鸡胸肉');
  if (t.fiber >= 18) parts.push('蔬果/纤维较好'); else parts.push('蔬菜水果可以再多一点');
  return parts.join(' · ');
}

function mealCard(key, meta) {
  const arr = (plan.meals && plan.meals[key]) || [];
  const t = totals(arr);
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
      <div class="food-pills">${arr.length ? arr.map(x => `<span class="food-pill">${escapeHtml(x.name)}</span>`).join('') : '<span class="food-pill">还没生成</span>'}</div>
      <div class="meal-stats">
        <span>${kcal(t.calories)}</span><span>${money(t.price)}</span><span>蛋白 ${grams(t.protein)}</span><span>碳水 ${grams(t.carbs)}</span><span>脂肪 ${grams(t.fat)}</span>
      </div>
    </article>`;
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
  const mealText = (food.mealTags || []).map(k => meals[k]?.name || '加餐').join(' / ');
  return `
    <article class="food-card" data-edit-food="${food.id}">
      <div class="food-card-top">
        <div>
          <div class="food-name">${escapeHtml(food.name || '未命名食物')}</div>
          <div class="badge-row"><span class="badge">${typeLabel[food.type] || '其他'}</span><span class="badge">${mealText || '未分类餐次'}</span></div>
        </div>
        <strong>${money(food.price)}</strong>
      </div>
      <div class="food-macros">
        <span>${kcal(food.calories)}</span><span>蛋白 ${grams(food.protein)}</span><span>碳水 ${grams(food.carbs)}</span><span>脂肪 ${grams(food.fat)}</span><span>纤维 ${grams(food.fiber)}</span>
      </div>
      ${food.note ? `<p class="muted small">${escapeHtml(food.note)}</p>` : ''}
    </article>`;
}

function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
}

function openFoodDialog(food = null) {
  $('foodDialogTitle').textContent = food ? '编辑食物' : '添加食物';
  $('editingFoodId').value = food?.id || '';
  $('foodNameInput').value = food?.name || '';
  $('foodCaloriesInput').value = food?.calories ?? '';
  $('foodPriceInput').value = food?.price ?? '';
  $('foodProteinInput').value = food?.protein ?? '';
  $('foodCarbInput').value = food?.carbs ?? '';
  $('foodFatInput').value = food?.fat ?? '';
  $('foodFiberInput').value = food?.fiber ?? '';
  $('foodTypeInput').value = food?.type || 'protein';
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
    calories: readNumber('foodCaloriesInput', 0),
    price: readNumber('foodPriceInput', 0),
    protein: readNumber('foodProteinInput', 0),
    carbs: readNumber('foodCarbInput', 0),
    fat: readNumber('foodFatInput', 0),
    fiber: readNumber('foodFiberInput', 0),
    type: $('foodTypeInput').value,
    mealTags: mealTags.length ? mealTags : ['breakfast','lunch','dinner'],
    note: $('foodNoteInput').value.trim()
  };
  const index = foods.findIndex(x => x.id === data.id);
  if (index >= 0) foods[index] = data; else foods.unshift(data);
  saveFoods();
  $('foodDialog').close();
  render();
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
  settings = {
    sex: $(ids.sex).value,
    age: parseInt($(ids.age).value, 10) || 21,
    height: parseFloat($(ids.height).value) || 165,
    weight: parseFloat($(ids.weight).value) || 62,
    budget: parseFloat($(ids.budget).value) || 22,
    deficit: parseFloat($(ids.deficit).value) || 450
  };
  saveSettings();
  render();
}

function exportBackup() {
  const data = { version: 1, exportedAt: new Date().toISOString(), settings, foods, plan };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0,10);
  a.href = URL.createObjectURL(blob);
  a.download = `今天吃什么-备份-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || !Array.isArray(data.foods)) throw new Error('备份格式不对');
      if (!confirm('导入会覆盖当前设置、食物库和当前组合，确认导入吗？')) return;
      settings = { ...defaultSettings(), ...(data.settings || {}) };
      foods = data.foods;
      plan = data.plan || { dayType: 'training', locked: {}, meals: {} };
      dayType = plan.dayType || 'training';
      saveSettings(); saveFoods(); savePlan();
      $('backupDialog').close();
      render();
      alert('导入成功');
    } catch (e) { alert('导入失败：' + e.message); }
  };
  reader.readAsText(file);
}

function initEvents() {
  $('settingsBtn').addEventListener('click', openSettingsDialog);
  $('closeSettingsBtn').addEventListener('click', () => $('settingsDialog').close());
  $('settingsForm').addEventListener('submit', e => { e.preventDefault(); saveSettingsFromForm('settings'); $('settingsDialog').close(); });
  $('firstRunForm').addEventListener('submit', e => { e.preventDefault(); saveSettingsFromForm('init'); localStorage.setItem('todayeat.seenIntro.v1', '1'); $('firstRunDialog').close(); });
  $('trainingBtn').addEventListener('click', () => { dayType = 'training'; plan.dayType = dayType; savePlan(); render(); });
  $('restBtn').addEventListener('click', () => { dayType = 'rest'; plan.dayType = dayType; savePlan(); render(); });
  $('generateBtn').addEventListener('click', () => generateFullPlan(true));
  $('addFoodBtn').addEventListener('click', () => openFoodDialog());
  $('closeFoodBtn').addEventListener('click', () => $('foodDialog').close());
  $('foodForm').addEventListener('submit', e => { e.preventDefault(); saveFoodFromForm(); });
  $('deleteFoodBtn').addEventListener('click', () => {
    const id = $('editingFoodId').value;
    if (id && confirm('确定删除这个食物吗？')) {
      foods = foods.filter(x => x.id !== id);
      saveFoods(); $('foodDialog').close(); render();
    }
  });
  $('foodList').addEventListener('click', e => {
    const card = e.target.closest('[data-edit-food]');
    if (card) openFoodDialog(foods.find(x => x.id === card.dataset.editFood));
  });
  $('mealList').addEventListener('click', e => {
    const reroll = e.target.closest('[data-reroll]');
    const lock = e.target.closest('[data-lock]');
    if (reroll) rerollMeal(reroll.dataset.reroll);
    if (lock) {
      plan.locked = plan.locked || {};
      const key = lock.dataset.lock;
      plan.locked[key] = !plan.locked[key];
      savePlan(); render();
    }
  });
  $('foodFilterMeal').addEventListener('change', renderFoods);
  $('foodFilterType').addEventListener('change', renderFoods);
  $('backupBtn').addEventListener('click', () => $('backupDialog').showModal());
  $('closeBackupBtn').addEventListener('click', () => $('backupDialog').close());
  $('exportBtn').addEventListener('click', exportBackup);
  $('importInput').addEventListener('change', e => { if (e.target.files[0]) importBackup(e.target.files[0]); e.target.value = ''; });
  $('resetDemoBtn').addEventListener('click', () => {
    if (confirm('会把食物库重置为示例食物，当前自定义食物会被覆盖。继续吗？')) {
      foods = defaultFoods(); saveFoods(); render();
    }
  });
}

function fillInitialInputs() {
  $('initSex').value = settings.sex;
  $('initAge').value = settings.age;
  $('initHeight').value = settings.height;
  $('initWeight').value = settings.weight;
  $('initBudget').value = settings.budget;
  $('initDeficit').value = settings.deficit;
}

initEvents();
fillInitialInputs();
render();
if (!localStorage.getItem('todayeat.seenIntro.v1')) {
  setTimeout(() => $('firstRunDialog').showModal(), 300);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const feature = require('../life-features.js');
const scenarioPack = require('../life-scenarios.js');

function country(iso2, region, gdpPc) {
  return { iso2, region, gdpPc, fx: 1, currency: 'USD', fa: iso2, en: iso2 };
}

test('pixel portraits are deterministic for the same saved life and vary across new lives', () => {
  const pixelArtwork = svg => svg.slice(svg.indexOf('</metadata>') + '</metadata>'.length);
  const base = {
    name: { full: 'Sample Person', first: 'Sample', last: 'Person' },
    gender: 'female',
    country: { iso2: 'DE', fa: 'آلمان' },
    city: { nameFa: 'برلین' },
    year: 2000
  };
  const one = feature.makeAvatarSVG({ ...base, lifeId: 'life-1', avatarSeed: 'unique-1' });
  const repeat = feature.makeAvatarSVG({ ...base, lifeId: 'life-1', avatarSeed: 'unique-1' });
  const agedAndMoved = feature.makeAvatarSVG({
    ...base, lifeId: 'life-1', avatarSeed: 'unique-1', year: 2042,
    country: { iso2: 'JP', fa: 'ژاپن' }, city: { nameFa: 'توکیو' }
  });
  assert.equal(one, repeat, 'reloads of a saved life should keep its avatar');
  assert.equal(one, agedAndMoved, 'aging and moving country/city must not change the same life portrait');
  const secondBirth = feature.makeAvatarSVG({ ...base, lifeId: 'life-2', avatarSeed: 'unique-2' });
  assert.notEqual(pixelArtwork(one), pixelArtwork(secondBirth), 'a different birth seed should produce a different portrait even for the same name');
  assert.match(one, /shape-rendering="crispEdges"/);
  assert.match(one, /<metadata>/);
  assert.doesNotMatch(one, /<image\b[^>]*(?:href|xlink:href)=[\"']https?:/i, 'portrait must not embed an externally hosted image');

  const portraits = new Set();
  for (let i = 0; i < 300; i++) {
    portraits.add(pixelArtwork(feature.makeAvatarSVG({
      ...base,
      lifeId: 'life-' + i,
      avatarSeed: 'portrait-seed-' + i,
      name: { full: 'Person ' + i, first: 'Person', last: String(i) }
    })));
  }
  assert.equal(portraits.size, 300, '300 different simulated lives should generate 300 different portrait images');
});

test('2026 daily travel benchmark is used where published', () => {
  assert.deepEqual(feature.dailyCostUSD(country('DE', 'europe', 52000), { popM: 4 }), {
    dailyUSD: 113, source: 'published-2026', cityFactor: 1
  });
  assert.equal(feature.dailyCostUSD(country('JP', 'asia', 33000), { popM: 30 }).dailyUSD, 113);
  assert.equal(feature.dailyCostUSD(country('IR', 'asia', 4500), { popM: 9 }).dailyUSD, 49);
});

test('countries without a listed benchmark get a clearly marked bounded estimate', () => {
  const result = feature.dailyCostUSD(country('ZZ', 'europe', 16000), { popM: 2 });
  assert.equal(result.source, 'model-estimate');
  assert.ok(result.dailyUSD >= 35 && result.dailyUSD <= 260);
  assert.ok(Number.isInteger(result.dailyUSD));
});

test('trip estimate combines per-person daily costs, transit, and a 10% reserve', () => {
  const result = feature.estimateTripUSD({
    origin: country('IR', 'asia', 5000),
    destination: country('DE', 'europe', 52000),
    originCity: { fa: 'تهران', popM: 9 },
    destinationCity: { fa: 'برلین', popM: 4 },
    days: 7,
    people: 2
  });
  assert.equal(result.dailyUSD, 113);
  assert.equal(result.groundUSD, 1582);
  assert.equal(result.farePerPersonUSD, 750);
  assert.equal(result.fareUSD, 1500);
  assert.equal(result.contingencyUSD, 308);
  assert.equal(result.totalUSD, 3390);
  assert.equal(result.fareMethod, 'intercontinental-estimate');
});

test('same-country trips have a domestic estimate and same-city trips are identified', () => {
  const domestic = feature.estimateTripUSD({
    origin: country('IR', 'asia', 5000),
    destination: country('IR', 'asia', 5000),
    originCity: { fa: 'تهران' },
    destinationCity: { fa: 'شیراز', popM: 1.5 },
    days: 3,
    people: 1
  });
  assert.equal(domestic.farePerPersonUSD, 45);
  assert.equal(domestic.fareMethod, 'domestic-ground-estimate');
  assert.ok(domestic.totalUSD > domestic.groundUSD);

  const sameCity = feature.estimateTripUSD({
    origin: country('IR', 'asia', 5000),
    destination: country('IR', 'asia', 5000),
    originCity: { fa: 'تهران' },
    destinationCity: { fa: 'تهران', popM: 9 },
    days: 7,
    people: 1
  });
  assert.equal(sameCity.sameCity, true);
  assert.equal(sameCity.fareUSD, 0);
  assert.equal(sameCity.fareMethod, 'same-city');
});

test('a male protagonist passes his own surname to every newborn child', () => {
  const result = feature.childNameWithFatherSurname({
    gender: 'male',
    name: { first: 'Amir', last: 'Mohammadi', full: 'Amir Mohammadi' },
    family: { partner: { gender: 'female', name: 'Sara Karimi' } }
  }, 'Nika RandomSurname');
  assert.equal(result.full, 'Nika Mohammadi');
  assert.equal(result.surname, 'Mohammadi');
  assert.equal(result.fatherSource, 'player');
  assert.equal(result.fatherName, 'Amir Mohammadi');
});

test('a female protagonist uses her male spouse surname for newborn children', () => {
  const result = feature.childNameWithFatherSurname({
    gender: 'female',
    name: { first: 'Sara', last: 'Karimi', full: 'Sara Karimi' },
    family: { partner: { gender: 'male', name: 'Amir Mohammadi' } }
  }, 'Nika RandomSurname');
  assert.equal(result.full, 'Nika Mohammadi');
  assert.equal(result.surname, 'Mohammadi');
  assert.equal(result.fatherSource, 'partner');
  assert.equal(result.fatherName, 'Amir Mohammadi');
});

test('the newborn surname helper preserves multi-token given names and avoids duplicate surnames', () => {
  const state = {
    gender: 'female',
    name: { first: 'Sara', last: 'Karimi', full: 'Sara Karimi' },
    family: { partner: { gender: 'male', name: 'Jean de Vries' } }
  };
  const regular = feature.childNameWithFatherSurname(state, 'Mary Jane Generated');
  const alreadyCorrect = feature.childNameWithFatherSurname(state, 'Mary Jane Vries');
  assert.equal(regular.full, 'Mary Jane Vries');
  assert.equal(alreadyCorrect.full, 'Mary Jane Vries');
  assert.equal(regular.surname, 'Vries');
});

test('child birth code records the helper surname and uses the resulting full name in the birth log', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const lifeYear = html.indexOf('s.flags.tryingBaby && s.family.partner');
  const birthday = html.indexOf('s.family.children.push({', lifeYear);
  assert.ok(lifeYear >= 0 && birthday > lifeYear, 'the annual child-birth pipeline must remain present');
  const excerpt = html.slice(lifeYear, birthday + 650);
  assert.match(excerpt, /childNameWithFatherSurname\(s,n\.full\)/);
  assert.match(excerpt, /name:childName\.full,surname:childName\.surname/);
  assert.match(excerpt, /fatherName:childName\.fatherName/);
  assert.match(excerpt, /\+childName\.full\+/);
});

test('parent request changes from pocket money to adult support at age 15', () => {
  const state = {
    age: 14,
    econClass: 'middle',
    family: { parents: [{ alive: true }, { alive: true }] }
  };
  const teen = feature.supportTerms(state);
  assert.equal(teen.allowance, true);
  assert.equal(teen.mode, 'allowance');
  assert.equal(teen.eligible, true);
  assert.ok(teen.amountUSD > 0);
  assert.ok(teen.acceptChance > 0 && teen.acceptChance < 1);

  state.age = 15;
  const adult = feature.supportTerms(state);
  assert.equal(adult.allowance, false);
  assert.equal(adult.mode, 'support');
  assert.equal(adult.eligible, true);
  assert.ok(adult.amountUSD > 0);
  assert.ok(adult.acceptChance > 0 && adult.acceptChance < 1);
});

test('parent requests require age six and at least one living parent', () => {
  const beforeSix = feature.supportTerms({
    age: 5, econClass: 'middle', family: { parents: [{ alive: true }] }
  });
  assert.equal(beforeSix.eligible, false);

  const noParent = feature.supportTerms({
    age: 17, econClass: 'middle', family: { parents: [{ alive: false }, { alive: false }] }
  });
  assert.equal(noParent.eligible, false);
  assert.equal(noParent.livingParents, 0);
});

test('travel access starts at age 25 and is closed for ended lives', () => {
  assert.equal(feature.canTravel({ age: 24, alive: true }), false);
  assert.equal(feature.canTravel({ age: 25, alive: true }), true);
  assert.equal(feature.canTravel({ age: 99, alive: false }), false);
});

test('party-size calculations exclude deceased family members and avoid double-counting', () => {
  const state = {
    family: {
      relationshipStatus: 'married',
      partner: { id: 'partner-1', alive: true },
      children: [{ id: 'child-1', alive: true }, { id: 'child-2', alive: false }],
      parents: [{ id: 'mother', alive: true }, { id: 'father', alive: false }],
      siblings: [{ id: 'sibling', alive: true }]
    }
  };
  assert.equal(feature.travelerCount('alone', state), 1);
  assert.equal(feature.travelerCount('spouse', state), 2);
  assert.equal(feature.travelerCount('children', state), 2);
  assert.equal(feature.travelerCount('family', state), 5);
});


test('the new real-life scenario pack contains at least 150 unique one-time events across life domains', () => {
  const scenarios = scenarioPack.createScenarios();
  assert.ok(scenarios.length >= 150, 'expected a large scenario pool, not a small handful');
  const ids = scenarios.map(event => event.id);
  const titles = scenarios.map(event => event.title);
  assert.equal(new Set(ids).size, ids.length, 'scenario IDs must be unique');
  assert.equal(new Set(titles).size, titles.length, 'scenario titles must be unique');
  assert.ok(scenarios.every(event => event.once === true), 'each new scenario must only happen once per life');
  assert.ok(scenarios.every(event => event.weight > 0 && event.minAge >= 2 && event.maxAge >= event.minAge && event.maxAge <= 110), 'supplemental events should not be eligible during infancy');
  assert.ok(scenarios.every(event => ['auto', 'decision'].includes(event.kind)));
  assert.ok(scenarios.some(event => event.cat === 'health'));
  assert.ok(scenarios.some(event => event.cat === 'bad'));
  assert.ok(scenarios.some(event => event.cat === 'money'));
  assert.ok(scenarios.some(event => event.cat === 'career'));
  assert.ok(scenarios.some(event => event.cat === 'edu'));
  assert.ok(scenarios.some(event => event.cat === 'family'));
  assert.ok(scenarios.some(event => event.cat === 'social'));

  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const existingIds = new Set([...html.matchAll(/\bid\s*:\s*['"]([^'"]+)['"]/g)].map(match => match[1]));
  assert.ok(ids.every(id => !existingIds.has(id)), 'new scenario IDs must not collide with any existing inline identifier');
});

test('scenario costs require enough money, and decision scenarios retain a non-cost fallback', () => {
  const scenarios = scenarioPack.createScenarios({ LS: { U: { toLocal: (usd, fx) => Math.round(usd * (fx || 1)) } } });
  const state = {
    age: 30, country: { fx: 1 },
    econ: { moneyCents: 100 },
    stats: { health: 70 },
    family: { parents: [], children: [], partner: null, relationshipStatus: 'single' },
    relationships: { friends: [], pets: [] },
    career: { employed: false, retired: false },
    edu: { status: 'none' }
  };
  const bill = scenarios.find(event => event.id === 'life_bill_water_bill');
  assert.ok(bill);
  assert.equal(bill.cond(state), false, 'an automatic expense must not drive an unaffordable balance lower');
  state.econ.moneyCents = 100000;
  assert.equal(bill.cond(state), true);

  state.econ.moneyCents = 100;
  const healthDecision = scenarios.find(event => event.id === 'life_health_cold_01');
  assert.ok(healthDecision);
  assert.equal(healthDecision.choices[0].requires(state), false);
  assert.equal(healthDecision.choices[1].requires, undefined, 'a free rest/care option must remain available');
  const carRepair = scenarios.find(event => event.id === 'life_repair_car_battery');
  assert.ok(carRepair);
  assert.equal(carRepair.cond(state), false, 'vehicle repair events should require a vehicle');
  state.econ.assets = { vehicles: [{ cat: 'car' }] };
  assert.equal(carRepair.cond(state), true);

  state.econ.moneyCents = 100000;
  const petBill = scenarios.find(event => event.id === 'life_bill_pet_food');
  assert.ok(petBill);
  assert.equal(petBill.cond(state), false, 'pet-related bills must require a living pet');
  state.relationships.pets = [{ alive: true }];
  assert.equal(petBill.cond(state), true);
  const cardScenario = scenarios.find(event => event.id === 'life_daily_lost_wallet_card');
  assert.ok(cardScenario);
  assert.equal(cardScenario.minAge, 16, 'bank card mishaps must not be offered to young children');
});

test('the actual event engine generates varied sequences for different births and never repeats a new scenario within a life', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const marker = html.indexOf('/* سرگذشت — event-engine.js');
  assert.ok(marker >= 0, 'existing EventEngine source marker must exist');
  const scriptOpen = html.lastIndexOf('<script>', marker);
  const codeStart = html.indexOf('(function () {', marker);
  const codeEnd = html.indexOf('</script>', codeStart);
  assert.ok(scriptOpen >= 0 && codeStart > marker && codeEnd > codeStart, 'event engine script boundaries must be valid');
  const source = html.slice(codeStart, codeEnd);

  const LS = {
    U: {
      clamp(value, min, max) { return Math.max(min, Math.min(max, value)); },
      toLocal(usd, fx) { return Math.round(usd * (Number(fx) || 1)); }
    },
    Economy: {
      gainUSD(state, usd) { state.econ.moneyCents += Math.round(usd * state.country.fx * 100); },
      tryPayUSD(state, usd) {
        const cents = Math.round(usd * state.country.fx * 100);
        if (state.econ.moneyCents < cents) return null;
        state.econ.moneyCents -= cents;
        return cents;
      }
    },
    events: scenarioPack.createScenarios()
  };
  const sandbox = vm.createContext({ window: { LS }, console, Math, Number, String, Array, Object, isFinite });
  new vm.Script(source, { filename: 'index.html:event-engine' }).runInContext(sandbox);
  const engine = LS.EventEngine;
  assert.ok(engine && typeof engine.runYear === 'function');

  function makeRng(seed, age) {
    let h = 2166136261;
    const input = String(seed) + ':' + String(age);
    for (let i = 0; i < input.length; i++) h = Math.imul(h ^ input.charCodeAt(i), 16777619);
    let x = h >>> 0;
    function next() {
      x = (x + 0x6D2B79F5) | 0;
      let t = Math.imul(x ^ (x >>> 15), 1 | x);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    return {
      chance(probability) { return next() < probability; },
      weighted(items, weightFn) {
        let total = 0;
        const weights = items.map(item => {
          const weight = Math.max(0, Number(weightFn(item)) || 0);
          total += weight;
          return weight;
        });
        if (!(total > 0)) return null;
        let pick = next() * total;
        for (let i = 0; i < items.length; i++) {
          pick -= weights[i];
          if (pick < 0 && weights[i] > 0) return items[i];
        }
        return items[items.length - 1] || null;
      }
    };
  }

  function simulate(seed) {
    const state = {
      age: 0, year: 2026, alive: true, country: { iso2: 'IR', region: 'asia', fx: 1 },
      city: { popM: 1 },
      econ: { moneyCents: 100000000, debtCents: 0, housing: { mode: 'own' }, assets: { vehicles: [{ cat: 'car' }], properties: [] }, businesses: [] },
      stats: { health: 75, happiness: 55, smarts: 60, social: 55, energy: 70, stress: 20, fame: 0, jobSat: 55 },
      skills: { analytical: 35, technical: 35, social: 40, language: 30, physical: 40, creative: 40 },
      flags: {},
      career: { employed: true, retired: false, performance: 55 },
      edu: { status: 'high', level: 3, yearsDone: 0 },
      family: { parents: [{ alive: true, age: 65 }], siblings: [], children: [{ alive: true, age: 9 }], partner: { alive: true, gender: 'female' }, relationshipStatus: 'married' },
      relationships: { friends: [{ alive: true }], pets: [{ alive: true }] },
      events: { executed: {}, pending: [], recent: [] },
      log: []
    };
    for (let age = 1; age <= 100; age++) {
      state.age = age;
      state.year = 2026 + age;
      const rng = makeRng(seed, age);
      engine.runYear(state, rng);
      while (state.events.pending.length) {
        const pending = state.events.pending[0];
        let choiceIndex = pending.choices.findIndex(choice => choice.available);
        if (choiceIndex < 0) choiceIndex = 0;
        const result = engine.resolvePending(state, pending.eventId, choiceIndex, rng);
        assert.equal(result.ok, true, 'the first available choice should resolve safely');
      }
    }
    const engineEvents = state.log.filter(record => record.evId);
    const eventCountsByAge = new Map();
    engineEvents.forEach(record => eventCountsByAge.set(record.age, (eventCountsByAge.get(record.age) || 0) + 1));
    assert.ok([...eventCountsByAge.values()].every(count => count <= 1), 'the event engine must not emit multiple story scenarios in one year');
    const fullSequence = engineEvents.filter(record => record.evId && String(record.evId).startsWith('life_')).map(record => ({ id: record.evId, age: record.age }));
    return { state, sequence: fullSequence };
  }

  const first = simulate('birth-seed-alpha');
  const second = simulate('birth-seed-beta');
  assert.ok(first.sequence.length >= 10, 'a long simulated life should still produce a varied but paced story history');
  assert.ok(first.sequence.length <= 25, 'the four-year scenario cooldown must cap new-pack events over a century');
  assert.equal(new Set(first.sequence.map(record => record.id)).size, first.sequence.length, 'a one-time scenario ID must not repeat within a single life');
  assert.equal(new Set(second.sequence.map(record => record.id)).size, second.sequence.length, 'a second life must also avoid repeats');
  assert.notDeepEqual(first.sequence.slice(0, 20).map(record => record.id), second.sequence.slice(0, 20).map(record => record.id), 'different birth seeds should produce different event histories');
  for (const life of [first, second]) {
    for (let i = 1; i < life.sequence.length; i++) {
      assert.ok(life.sequence[i].age - life.sequence[i - 1].age >= 4, 'the supplemental 182-scenario pack must have at least a four-year gap');
    }
  }
  assert.ok(!first.sequence.some(record => record.age < 2), 'supplemental scenarios must not fire during infancy');
  assert.ok(first.state.econ.moneyCents > 0, 'scenario handling must leave the simulated economy in a valid numeric state');
});


test('story pacing is at most one event per year, with sparse years and age-appropriate macro events', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const runYearAt = html.indexOf('EV.runYear = function (s, rng) {');
  const runYearEnd = html.indexOf('EV.choicesAvailable = function', runYearAt);
  const runYear = html.slice(runYearAt, runYearEnd);
  assert.ok(runYear.includes("if (!rng.chance(0.62)) return 0;"), 'ordinary years should often have no featured event');
  assert.ok(runYear.includes('const milestones = pool.filter'), 'exact-age milestones should be preserved');
  assert.doesNotMatch(runYear, /maxAuto\s*=\s*2/, 'the former two-auto-plus-one-decision pattern must be removed');
  assert.ok(html.includes('s.age < lastScenarioAge + 4'), 'the supplemental scenario pack must have a four-year global cooldown');
  assert.ok(html.includes("id:'ev_recession', cat:'bad', kind:'auto', weight:2, minAge:16"), 'recession effects should begin in the working/older-teen years');
  assert.ok(html.includes("id:'ev_boom', cat:'money', kind:'auto', weight:2, minAge:16"), 'economic-boom effects should not apply to toddlers');
  assert.ok(html.includes("id:'ev_inflation_shock', cat:'bad', kind:'auto', weight:2, minAge:16"), 'inflation effects should not apply to toddlers');
  assert.ok(html.includes("id:'ev_weather_event', cat:'bad', kind:'auto', weight:2, minAge:4"), 'weather disruption should not be logged as a personal event for a newborn');
  assert.ok(html.includes("id:'ev_election_year', cat:'social', kind:'auto', weight:2, minAge:12"), 'election events should be age-gated');
  assert.ok(html.includes("id:'ev_cultural_festival', cat:'social', kind:'auto', weight:6, minAge:3"), 'cultural festival participation should be age-gated');
});

test('the scenario loader runs after built-in events are composed and before the feature module', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const scenarioLoader = '<script src="./life-scenarios.js?v=20261030-life-scenarios-4"></script>';
  const featureLoader = '<script src="./life-features.js?v=20261030-portrait-stable"></script>';
  const eventsComposed = html.indexOf('LS.events = (LS._eventsA || []).concat(LS._eventsB || []);');
  const scenarioAt = html.indexOf(scenarioLoader);
  const featureAt = html.indexOf(featureLoader);
  assert.ok(eventsComposed >= 0 && scenarioAt > eventsComposed && featureAt > scenarioAt, 'the scenario module must register after built-in events and before startup completes');
});

test('the original game keeps all inline JavaScript parseable and loads the feature module last', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const loader = '<script src="./life-features.js?v=20261030-portrait-stable"></script>';
  assert.ok(html.includes(loader), 'game must load the feature script');
  assert.ok(html.includes('id="char-avatar"'), 'existing character HUD must remain');
  assert.ok(html.includes('avatarApi.makeAvatarSVG'), 'the original HUD must render the pixel portrait directly');
  assert.ok(html.includes('id="panel-family"'), 'existing family panel must remain');
  const featureSource = fs.readFileSync(path.join(__dirname, '..', 'life-features.js'), 'utf8');
  assert.ok(featureSource.includes('var avatarSeedKeys = Object.create(null);'), 'portrait keys must be associated with life identity rather than object identity');
  assert.ok(featureSource.includes('if (firstEncounter) persist(state);'), 'a portrait seed must be persisted the first time a state object is rendered');
  assert.doesNotMatch(featureSource, /avatarSeedOwners\\[key\\] && avatarSeedOwners\\[key\\] !== state/, 'resuming a saved life must not force a new portrait just because it is a new JS object');
  const loaderAt = html.indexOf(loader);
  assert.ok(loaderAt > html.lastIndexOf('</script>', loaderAt), 'feature loader should come after inline modules');

  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  let parsed = 0;
  for (let i = 0; i < scripts.length; i++) {
    const attrs = scripts[i][1];
    const body = scripts[i][2].trim();
    if (!body || /\bsrc\s*=/i.test(attrs)) continue;
    const type = (attrs.match(/\btype=["']([^"']+)["']/i) || [])[1];
    if (type === 'application/ld+json') {
      assert.doesNotThrow(() => JSON.parse(body), 'JSON-LD must remain valid');
      continue;
    }
    assert.doesNotThrow(() => new vm.Script(body, { filename: 'index.html:inline-' + i }), 'inline JavaScript module ' + i);
    parsed++;
  }
  assert.ok(parsed >= 15, 'expected to validate the embedded game modules');
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'life-features.js'), 'utf8'), /data-panel="moneytravel"/);
});


test('every built-in country has at least one real city available for travel selection', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const countryStart = html.indexOf('LS._countriesA = [];');
  const countriesEnd = html.indexOf('LS.countries =', countryStart);
  const cityStart = html.indexOf('LS._citiesA = [];');
  const citiesEnd = html.indexOf('LS.cities =', cityStart);
  assert.ok(countryStart >= 0 && countriesEnd > countryStart, 'country dataset markers must exist');
  assert.ok(cityStart >= 0 && citiesEnd > cityStart, 'city dataset markers must exist');

  const countryCodes = new Set([...html.slice(countryStart, countriesEnd).matchAll(/\bC\(\s*['"]([A-Z]{2})['"]/g)].map(match => match[1]));
  const cityCodes = new Set([...html.slice(cityStart, citiesEnd).matchAll(/\bC\(\s*['"]([A-Z]{2})['"]/g)].map(match => match[1]));
  assert.ok(countryCodes.size >= 190, 'expected broad country coverage in the built-in dataset');
  const missing = [...countryCodes].filter(code => !cityCodes.has(code)).sort();
  assert.deepEqual(missing, [], 'every configured country must have a city option for travel');
  const missingBudget = [...countryCodes].filter(code => !(code in feature.DAILY_USD_2026) && !['PS', 'XK'].includes(code)).sort();
  assert.deepEqual(missingBudget, [], 'all available country budgets from the source should be mapped; only destinations absent from the source may use model fallback');
});


// ---------- Save manager regression tests ----------
function makeSaveManagerHarness() {
  const createStorage = () => {
    const values = new Map();
    return {
      getItem(key) { return values.has(key) ? values.get(key) : null; },
      setItem(key, value) { values.set(key, String(value)); },
      removeItem(key) { values.delete(key); },
      _values: values
    };
  };
  const localStorage = createStorage();
  const sessionStorage = createStorage();
  class FakeFileReader {
    readAsText(file) {
      this.result = file && file.content;
      queueMicrotask(() => {
        if (typeof this.onload === 'function') this.onload();
      });
    }
  }
  const window = { LS: {} };
  const context = vm.createContext({ window, localStorage, sessionStorage, FileReader: FakeFileReader });
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const marker = html.indexOf('/* سرگذشت — save-manager.js');
  const codeStart = html.indexOf('(function () {', marker);
  const codeEnd = html.indexOf('</script>', codeStart);
  assert.ok(marker >= 0 && codeStart > marker && codeEnd > codeStart, 'SaveManager module boundaries must exist');
  new vm.Script(html.slice(codeStart, codeEnd), { filename: 'index.html:save-manager' }).runInContext(context);
  return { SM: window.LS.SaveManager, localStorage, sessionStorage };
}

function makeValidSavedLife(lifeId, age = 12, year = 2038) {
  return {
    lifeId,
    alive: true,
    name: { full: 'Test Person ' + lifeId },
    gender: 'female',
    country: { fa: 'ایران', iso2: 'IR', fx: 1 },
    city: { nameFa: 'تهران' },
    age,
    year,
    history: [{ age: 0, year: year - age }],
    log: [],
    econ: { moneyCents: 123456, assets: { vehicles: [], properties: [] }, businesses: [] },
    stats: { health: 75, happiness: 60 },
    edu: { status: 'primary' },
    career: { employed: false, retired: false },
    family: { parents: [], siblings: [], children: [], partner: null },
    flags: {},
    seed: 'save-manager-test',
    settings: {}
  };
}

test('archive listing merges IndexedDB and local fallback records without hiding either source', async () => {
  const { SM } = makeSaveManagerHarness();
  const idb = [
    { lifeId: 'same', savedAt: '2026-10-28T10:00:00.000Z', source: 'idb-old' },
    { lifeId: 'idb-only', savedAt: '2026-10-27T10:00:00.000Z' }
  ];
  const local = [
    { lifeId: 'same', savedAt: '2026-10-29T10:00:00.000Z', source: 'local-newer' },
    { lifeId: 'local-only', savedAt: '2026-10-26T10:00:00.000Z' }
  ];
  const merged = SM._mergeArchiveLists(idb, local);
  assert.deepEqual(Array.from(merged, record => record.lifeId).sort(), ['idb-only', 'local-only', 'same']);
  assert.equal(merged.find(record => record.lifeId === 'same').source, 'local-newer',
    'the newest same-life archive record should win');
});

test('archive deletion removes the same life from IndexedDB and local fallback storage', async () => {
  const { SM, localStorage } = makeSaveManagerHarness();
  localStorage.setItem('sargozasht.archive', JSON.stringify([
    { lifeId: 'delete-me', savedAt: '2026-10-30T00:00:00.000Z' },
    { lifeId: 'keep-me', savedAt: '2026-10-29T00:00:00.000Z' }
  ]));
  const removed = [];
  SM.idbAvailable = true;
  SM.db = {
    objectStoreNames: { contains: name => name === 'lives' },
    transaction() {
      const tx = {
        objectStore() {
          return { delete(id) { removed.push(id); queueMicrotask(() => tx.oncomplete()); } };
        }
      };
      return tx;
    }
  };
  assert.equal(await SM.deleteArchived('delete-me'), true);
  assert.deepEqual(removed, ['delete-me']);
  assert.deepEqual(SM._lsArchiveList().map(record => record.lifeId), ['keep-me']);
});

test('clearing archive clears IndexedDB and the local fallback copy', async () => {
  const { SM, localStorage } = makeSaveManagerHarness();
  localStorage.setItem('sargozasht.archive', JSON.stringify([
    { lifeId: 'fallback-life', savedAt: '2026-10-30T00:00:00.000Z' }
  ]));
  let idbCleared = false;
  SM.idbAvailable = true;
  SM.db = {
    objectStoreNames: { contains: name => name === 'lives' },
    transaction() {
      const tx = {
        objectStore() {
          return { clear() { queueMicrotask(() => { idbCleared = true; tx.oncomplete(); }); } };
        }
      };
      return tx;
    }
  };
  assert.equal(await SM.clearArchive(), true);
  assert.equal(idbCleared, true);
  assert.equal(localStorage.getItem('sargozasht.archive'), null);
});

test('import archives the previously active life, not the life inside the imported file', async () => {
  const { SM } = makeSaveManagerHarness();
  const previous = makeValidSavedLife('previous-life');
  const incoming = makeValidSavedLife('incoming-life', 21, 2047);
  assert.equal(SM.saveCurrent(previous), true);
  const payload = {
    kind: 'sargozasht-save',
    v: 1,
    current: { v: 1, state: incoming }
  };
  const result = await SM.importFile({ content: JSON.stringify(payload) });
  assert.equal(result.ok, true);
  assert.equal(result.archived, true);
  assert.equal(result.state.lifeId, 'incoming-life');
  assert.equal(SM.loadCurrent().state.lifeId, 'incoming-life');
  const archive = await SM.listArchive();
  assert.deepEqual(Array.from(archive, record => record.lifeId), ['previous-life']);
});

test('invalid or unsupported imports never overwrite the existing active save', async () => {
  const { SM } = makeSaveManagerHarness();
  const previous = makeValidSavedLife('keep-current');
  assert.equal(SM.saveCurrent(previous), true);
  const invalidPayloads = [
    { kind: 'sargozasht-save', v: 1, current: { v: 1, state: { lifeId: 'broken' } } },
    { kind: 'sargozasht-save', v: 9, current: { v: 9, state: makeValidSavedLife('future-format') } },
    { kind: 'other-app', v: 1, current: { v: 1, state: makeValidSavedLife('wrong-kind') } },
    { kind: 'sargozasht-save', v: 1, current: { v: 1, state: Object.assign(makeValidSavedLife('ended-life'), { alive: false }) } }
  ];
  for (const payload of invalidPayloads) {
    const result = await SM.importFile({ content: JSON.stringify(payload) });
    assert.equal(result.ok, false);
    assert.equal(SM.loadCurrent().state.lifeId, 'keep-current');
  }
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const feature = require('../life-features.js');

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

test('the original game keeps all inline JavaScript parseable and loads the feature module last', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const loader = '<script src="./life-features.js"></script>';
  assert.ok(html.includes(loader), 'game must load the feature script');
  assert.ok(html.includes('id="char-avatar"'), 'existing character HUD must remain');
  assert.ok(html.includes('avatarApi.makeAvatarSVG'), 'the original HUD must render the pixel portrait directly');
  assert.ok(html.includes('id="panel-family"'), 'existing family panel must remain');
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

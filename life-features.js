(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.SargozashtLifeFeatures = api;
    if (root.document && root.LS && root.LS.App && root.LS.Panels) api.install(root);
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var DAILY_USD_2026 = {
    PT:219, IT:269, BO:60, KG:60, LA:60, GT:65, NP:65, KH:69, IN:69, UZ:69,
    AL:76, LK:76, VN:76, GE:81, ID:81, MY:81, PH:81, CU:85, EG:85, TR:85,
    CO:90, MA:90, EC:95, HU:95, PL:95, AR:100, BR:100, CV:100, CZ:100,
    ME:100, PA:100, TW:100, DO:110, MX:110, ZA:110, TH:114, KR:115, CL:119,
    JO:119, SI:119, UG:119, CR:131, HR:131, FJ:131, GR:131, JM:131, RW:131,
    OM:140, ES:140, DE:150, IE:150, NL:150, QA:150, SG:150, KE:150, FI:155,
    AT:160, NA:160, PE:161, SE:165, AU:169, CA:169, FR:169, AE:169, NZ:181,
    TZ:181, US:190, JP:218, NO:219, IS:240, BW:250, CH:250
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function round(value) {
    return Math.round(Number(value) || 0);
  }

  function hash32(value) {
    var h = 0x811c9dc5;
    var str = String(value == null ? '' : value);
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  function seededRandom(value) {
    var state = hash32(value) || 0x6d2b79f5;
    return function () {
      state = (state + 0x6D2B79F5) | 0;
      var t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function xmlEscape(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  function makeAvatarSVG(character) {
    character = character || {};
    var name = character.name || {};
    var country = character.country || {};
    var city = character.city || {};
    var identity = [
      character.lifeId || '', character.seed || '', name.full || '',
      name.first || '', name.last || '', character.gender || '',
      country.iso2 || '', city.nameFa || '', character.year == null ? '' : character.year
    ].join('|');
    var rng = seededRandom(identity);
    var pick = function (arr) { return arr[Math.floor(rng() * arr.length)]; };
    var integer = function (max) { return Math.floor(rng() * max); };
    var background = pick(['#22334f', '#294a54', '#463956', '#554344', '#203f3a', '#48412d', '#2b3d63', '#3f334e']);
    var backgroundAccent = ['#8bd3dd', '#f2cc8f', '#f28482', '#b8c0ff', '#95d5b2', '#f6bd60', '#cdb4db', '#84a59d'];
    var skin = pick(['#f5d0a9', '#deb08a', '#c6865b', '#f0c6a4', '#a96843', '#d9a278', '#8e5a3c', '#f2d6bd']);
    var hair = pick(['#171820', '#30241f', '#67412f', '#d2ad55', '#5d6870', '#c4c0b8', '#692f42', '#18332a', '#6a4c93']);
    var shirt = pick(['#20a4a6', '#e76f51', '#f4a261', '#457b9d', '#9b5de5', '#e9c46a', '#ef476f', '#4cc9f0', '#6a994e', '#c44536']);
    var pants = pick(['#202b46', '#3b4057', '#414a4c', '#6d597a', '#354f52', '#5c4b3c']);
    var eye = pick(['#17202b', '#26212c', '#321f18']);
    var mouth = pick(['#9b4e48', '#7c3f3f', '#7a5145']);
    var parts = [];
    var rect = function (x, y, w, h, color) {
      parts.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + color + '"/>');
    };

    rect(0, 0, 16, 16, background);
    for (var i = 0; i < 42; i++) {
      var bx = integer(16), by = integer(16);
      if (bx >= 4 && bx <= 11 && by >= 2 && by <= 14 && rng() < 0.78) continue;
      var accent = pick(backgroundAccent);
      rect(bx, by, 1 + (rng() < 0.11 ? 1 : 0), 1, accent);
    }
    rect(1, 2, 2, 2, pick(backgroundAccent));
    rect(13, 11, 2, 2, pick(backgroundAccent));

    var hairStyle = integer(7);
    rect(5, 2, 6, 1, hair);
    rect(4, 3, 8, 1, hair);
    if (hairStyle === 1 || hairStyle === 4) rect(4, 4, 2, 3, hair);
    if (hairStyle === 2 || hairStyle === 5) rect(10, 4, 2, 4, hair);
    if (hairStyle === 3) { rect(5, 1, 2, 2, hair); rect(9, 1, 2, 2, hair); }
    if (hairStyle === 6) { rect(4, 3, 2, 2, hair); rect(10, 3, 2, 2, hair); rect(5, 5, 1, 2, hair); rect(10, 5, 1, 2, hair); }

    rect(5, 3, 6, 5, skin);
    rect(4, 4, 1, 2, skin);
    rect(11, 4, 1, 2, skin);
    if (hairStyle !== 0 && hairStyle !== 3) rect(5, 3, 2, 1, hair);
    if (hairStyle === 2 || hairStyle === 4 || hairStyle === 6) rect(9, 3, 2, 1, hair);
    rect(6, 5, 1, 1, eye);
    rect(9, 5, 1, 1, eye);
    if (rng() > 0.35) rect(7, 7, 2, 1, mouth);
    else { rect(7, 7, 1, 1, mouth); rect(8, 8, 1, 1, mouth); }

    if (rng() < 0.27) {
      var glasses = pick(['#151c2c', '#f6bd60', '#e5e7eb']);
      rect(5, 5, 3, 1, glasses);
      rect(9, 5, 3, 1, glasses);
      rect(8, 5, 1, 1, glasses);
      rect(6, 5, 1, 1, eye);
      rect(10, 5, 1, 1, eye);
    }

    rect(7, 8, 2, 2, skin);
    rect(4, 10, 8, 4, shirt);
    rect(3, 10, 1, 3, shirt);
    rect(12, 10, 1, 3, shirt);
    rect(5, 14, 2, 1, pants);
    rect(9, 14, 2, 1, pants);
    rect(5, 15, 2, 1, '#171820');
    rect(9, 15, 2, 1, '#171820');
    rect(6, 10, 1, 2, pick(backgroundAccent));
    if (rng() > 0.5) rect(9, 11, 1, 2, pick(backgroundAccent));
    if (rng() > 0.72) {
      var badge = pick(['#f8fafc', '#f6bd60', '#ef476f']);
      rect(8, 10, 1, 1, badge);
    }
    if (rng() > 0.76) {
      rect(4, 9, 8, 1, pick(['#f2cc8f', '#d5bdaf', '#f6bd60']));
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-label="آواتار پیکسلی ' +
      xmlEscape(name.full || 'شخصیت سرگذشت') + '"><metadata>' + xmlEscape(identity) + '</metadata>' +
      parts.join('') + '</svg>';
  }

  function dailyCostUSD(country, city) {
    country = country || {};
    city = city || {};
    var code = String(country.iso2 || '').toUpperCase();
    var exact = DAILY_USD_2026[code];
    var daily;
    var source;
    if (Number.isFinite(exact)) {
      daily = exact;
      source = 'published-2026';
    } else {
      var gdp = Number(country.gdpPc);
      if (!(gdp > 0) || !Number.isFinite(gdp)) gdp = 8000;
      var regionExtra = ({ asia: 0, europe: 18, africa: 4, namerica: 25, samerica: 7, oceania: 20 })[country.region] || 0;
      daily = clamp(round(25 + Math.sqrt(Math.max(250, gdp)) * 0.88 + regionExtra), 35, 260);
      source = 'model-estimate';
    }
    var pop = Number(city.popM) || 0;
    var cityFactor = pop >= 20 ? 1.08 : pop >= 10 ? 1.05 : pop >= 5 ? 1.03 : (pop > 0 && pop < 0.1 ? 0.92 : 1);
    return { dailyUSD: Math.max(1, round(daily * cityFactor)), source: source, cityFactor: cityFactor };
  }

  function estimateTripUSD(options) {
    options = options || {};
    var origin = options.origin || {};
    var destination = options.destination || {};
    var originCity = options.originCity || {};
    var destinationCity = options.destinationCity || {};
    var days = clamp(round(options.days || 7), 1, 30);
    var people = clamp(round(options.people || 1), 1, 30);
    var perDay = dailyCostUSD(destination, destinationCity);
    var sameCountry = String(origin.iso2 || '') === String(destination.iso2 || '');
    var sameCity = sameCountry && originCity.fa && destinationCity.fa &&
      String(originCity.fa) === String(destinationCity.fa);
    var farePerPersonUSD = 0;
    var fareMethod = 'same-city';
    if (!sameCity) {
      if (sameCountry) {
        farePerPersonUSD = 45;
        fareMethod = 'domestic-ground-estimate';
      } else if (origin.region && destination.region && origin.region === destination.region) {
        farePerPersonUSD = 350;
        fareMethod = 'international-same-region-estimate';
      } else {
        farePerPersonUSD = 750;
        fareMethod = 'intercontinental-estimate';
      }
    }
    var groundUSD = round(perDay.dailyUSD * days * people);
    var fareUSD = round(farePerPersonUSD * people);
    var contingencyUSD = round((groundUSD + fareUSD) * 0.10);
    return {
      days: days,
      people: people,
      dailyUSD: perDay.dailyUSD,
      dailySource: perDay.source,
      cityFactor: perDay.cityFactor,
      groundUSD: groundUSD,
      farePerPersonUSD: farePerPersonUSD,
      fareUSD: fareUSD,
      fareMethod: fareMethod,
      contingencyUSD: contingencyUSD,
      totalUSD: groundUSD + fareUSD + contingencyUSD,
      sameCity: !!sameCity
    };
  }

  function classKey(value) {
    if (value === 'poor') return 'poor';
    if (value === 'low') return 'low';
    if (value === 'middle') return 'middle';
    return 'affluent';
  }

  function supportTerms(state) {
    state = state || {};
    var age = Math.max(0, round(state.age));
    var family = state.family || {};
    var parents = Array.isArray(family.parents) ? family.parents : [];
    var livingParents = parents.filter(function (parent) { return parent && parent.alive !== false; }).length;
    var band = classKey(state.econClass);
    var classMultiplier = ({ poor: 0.65, low: 0.85, middle: 1.15, affluent: 1.6 })[band];
    var allowance = age < 15;
    var baseUSD = allowance ? (2 + age * 1.5) : (20 + (age - 15) * 1.25);
    var childChance = ({ poor: 0.35, low: 0.50, middle: 0.65, affluent: 0.80 })[band];
    var adultChance = ({ poor: 0.22, low: 0.35, middle: 0.48, affluent: 0.65 })[band];
    var acceptChance = allowance ? childChance : adultChance;
    if (livingParents > 1) acceptChance += 0.05;
    acceptChance = clamp(acceptChance, 0.05, 0.9);
    return {
      age: age,
      allowance: allowance,
      mode: allowance ? 'allowance' : 'support',
      label: allowance ? 'پول توجیبی' : 'کمک‌هزینه',
      amountUSD: Math.max(1, round(baseUSD * classMultiplier)),
      acceptChance: acceptChance,
      livingParents: livingParents,
      eligible: age >= 6 && livingParents > 0
    };
  }

  function livingPerson(person) {
    return !!person && person.alive !== false;
  }

  function travelerCount(mode, state) {
    state = state || {};
    var family = state.family || {};
    var count = 1;
    var seen = {};
    function add(person) {
      if (!livingPerson(person)) return;
      var key = person.id || person.name || ('person-' + count);
      if (seen[key]) return;
      seen[key] = true;
      count++;
    }
    if (mode === 'spouse') {
      if (family.relationshipStatus === 'married') add(family.partner);
    } else if (mode === 'children') {
      (Array.isArray(family.children) ? family.children : []).forEach(add);
    } else if (mode === 'family') {
      if (family.relationshipStatus === 'married') add(family.partner);
      (Array.isArray(family.children) ? family.children : []).forEach(add);
      (Array.isArray(family.parents) ? family.parents : []).forEach(add);
      (Array.isArray(family.siblings) ? family.siblings : []).forEach(add);
    }
    return count;
  }

  function htmlEscape(value, fallback) {
    var str = value == null ? (fallback || '') : String(value);
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  var installed = false;

  function install(root) {
    if (installed) return;
    if (!root || !root.document || !root.LS || !root.LS.App || !root.LS.Panels) return;
    var doc = root.document;
    var LS = root.LS;
    var App = LS.App;
    var Panels = LS.Panels;
    var U = LS.U;
    var esc = U && U.esc ? U.esc : htmlEscape;
    installed = true;

    var nav = doc.querySelector('.quick-nav');
    var host = doc.querySelector('.panel-host');
    if (!nav || !host || !doc.getElementById('char-avatar')) return;

    if (!nav.querySelector('button[data-panel="moneytravel"]')) {
      var navButton = doc.createElement('button');
      navButton.setAttribute('data-panel', 'moneytravel');
      navButton.textContent = 'پول توجیبی و سفر';
      var familyButton = nav.querySelector('button[data-panel="family"]');
      if (familyButton && familyButton.insertAdjacentElement) familyButton.insertAdjacentElement('afterend', navButton);
      else nav.appendChild(navButton);
    }
    if (!doc.getElementById('panel-moneytravel')) {
      var panel = doc.createElement('div');
      panel.className = 'card panel';
      panel.id = 'panel-moneytravel';
      panel.hidden = true;
      host.appendChild(panel);
    }

    var originalUpdateHUD = App.updateHUD;
    if (typeof originalUpdateHUD === 'function') {
      App.updateHUD = function () {
        originalUpdateHUD.apply(this, arguments);
        var state = App.state;
        var holder = doc.getElementById('char-avatar');
        if (!state || !holder) return;
        var svg = makeAvatarSVG(state);
        holder.innerHTML = '<img alt="آواتار پیکسلی ' + esc((state.name && state.name.full) || 'شخصیت') +
          '" src="data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg) +
          '" width="52" height="52" draggable="false">';
        holder.title = 'شخصیت پیکسلی ویژهٔ این زندگی';
        holder.setAttribute('aria-label', 'تصویر پیکسلی ' + ((state.name && state.name.full) || 'شخصیت'));
      };
    }

    var originalRefreshAll = Panels.refreshAll;
    Panels.refreshAll = function () {
      if (Panels.open === 'moneytravel') {
        if (App.state) renderMoneyTravel(App.state);
        return;
      }
      if (typeof originalRefreshAll === 'function') originalRefreshAll.apply(this, arguments);
    };

    function ensureSupportState(state) {
      state.family = state.family || {};
      if (!state.family.moneySupport || typeof state.family.moneySupport !== 'object') {
        state.family.moneySupport = { lastRequestAge: -1, history: [] };
      }
      if (!Number.isFinite(Number(state.family.moneySupport.lastRequestAge))) state.family.moneySupport.lastRequestAge = -1;
      if (!Array.isArray(state.family.moneySupport.history)) state.family.moneySupport.history = [];
      if (!Array.isArray(state.travelHistory)) state.travelHistory = [];
    }

    function currencyFromUSD(state, usd) {
      var local = U.toLocal ? U.toLocal(usd, state.country.fx) : usd;
      return Math.max(1, round(local));
    }

    function moneyLabel(state, usd) {
      var local = currencyFromUSD(state, usd);
      return (U.moneyFmt ? U.moneyFmt(local * 100, state.country.currency) : (String(local) + ' ' + state.country.currency)) +
        ' (حدود $' + (U.numFmt ? U.numFmt(round(usd)) : round(usd)) + ')';
    }

    function persist(state) {
      try { if (LS.SaveManager && LS.SaveManager.saveCurrent) LS.SaveManager.saveCurrent(state); } catch (e) {}
    }

    function refreshEverything(state) {
      if (App.renderLog) App.renderLog();
      if (App.updateHUD) App.updateHUD();
      if (Panels.refreshAll) Panels.refreshAll();
      persist(state);
    }

    function requestMoneySupport() {
      var state = App.state;
      if (!state || !state.alive) return;
      ensureSupportState(state);
      var terms = supportTerms(state);
      if (!terms.eligible) {
        App.toast(terms.age < 6 ? 'درخواست پول توجیبی از ۶ سالگی فعال می‌شود.' : 'پدر یا مادر زنده‌ای برای درخواست وجود ندارد.', true);
        return;
      }
      var finance = state.family.moneySupport;
      if (Number(finance.lastRequestAge) === Number(state.age)) {
        App.toast('در این سن یک بار درخواست ثبت کرده‌ای؛ برای درخواست بعدی باید یک سال جلو بروی.', true);
        return;
      }
      var askNumber = finance.history.length;
      var rng = LS.RNG && LS.RNG.makeStream
        ? LS.RNG.makeStream(state.seed || state.lifeId, 'parent-money:' + state.age + ':' + askNumber)
        : seededRandom((state.seed || state.lifeId) + ':' + state.age + ':' + askNumber);
      var accepted = typeof rng.chance === 'function' ? rng.chance(terms.acceptChance) : (rng() < terms.acceptChance);
      var amountLocal = currencyFromUSD(state, terms.amountUSD);
      var amountText = moneyLabel(state, terms.amountUSD);
      finance.lastRequestAge = state.age;
      var record = {
        age: state.age, year: state.year, mode: terms.mode, amountUSD: terms.amountUSD,
        amountLocal: amountLocal, accepted: !!accepted, parentCount: terms.livingParents
      };
      finance.history.push(record);
      if (finance.history.length > 20) finance.history.shift();

      if (accepted) {
        if (LS.Economy && LS.Economy.gainLocal) LS.Economy.gainLocal(state, amountLocal, terms.label + ' از پدر و مادر');
        if (state.stats) state.stats.happiness = U.clamp((Number(state.stats.happiness) || 0) + 2, 0, 100);
        state.log.push({
          age: state.age, year: state.year,
          text: terms.label + ' درخواست کردی؛ پدر و مادرت قبول کردند و ' + amountText + ' به تو دادند.',
          kind: 'money'
        });
      } else {
        if (state.stats) state.stats.happiness = U.clamp((Number(state.stats.happiness) || 0) - 1, 0, 100);
        state.log.push({
          age: state.age, year: state.year,
          text: terms.label + ' درخواست کردی، اما پدر و مادرت این بار قبول نکردند. شرایط مالی و خانوادگی در پاسخ آن‌ها اثر دارد.',
          kind: 'family'
        });
      }

      refreshEverything(state);
      var message = accepted
        ? '<p>درخواستت پذیرفته شد.</p><p>مبلغ دریافتی: <b>' + esc(amountText) + '</b></p><p class="small muted">این مبلغ به موجودی زندگی اضافه و در سابقه ذخیره شد.</p>'
        : '<p>درخواستت رد شد.</p><p>پدر و مادرت گفتند فعلاً امکان پرداخت این مبلغ را ندارند یا زمان مناسبی نیست.</p><p class="small muted">نتیجهٔ درخواست برای این سن ثبت شد؛ درخواست بعدی از سال آینده امکان‌پذیر است.</p>';
      if (App.modal) App.modal('پاسخ پدر و مادر', message, [{ label: 'متوجه شدم', primary: true }]);
      App.toast(accepted ? 'پول به موجودی اضافه شد.' : 'درخواست رد شد؛ نتیجه ذخیره شد.', !accepted);
    }

    function cityListFor(iso2) {
      var cities = (LS.DataManager && LS.DataManager.citiesByCountry && LS.DataManager.citiesByCountry[iso2]) ||
        (LS.cities || []).filter(function (city) { return city.iso2 === iso2; });
      return (cities || []).slice().sort(function (a, b) { return (Number(b.popM) || 0) - (Number(a.popM) || 0); });
    }

    function cityKey(city) {
      return city ? String(city.fa || '') + '|' + String(city.native || '') + '|' + String(city.iso2 || '') : '';
    }

    function countryByCode(iso2) {
      return (LS.DataManager && LS.DataManager.countriesIndex && LS.DataManager.countriesIndex[iso2]) ||
        (LS.countries || []).find(function (country) { return country.iso2 === iso2; }) || null;
    }

    function ensureTravelPlan(state) {
      var countries = LS.countries || [];
      var iso2 = state.travelPlan && state.travelPlan.destinationIso;
      if (!countryByCode(iso2)) iso2 = state.country && state.country.iso2;
      if (!countryByCode(iso2) && countries.length) iso2 = countries[0].iso2;
      var cities = cityListFor(iso2);
      var plan = state.travelPlan;
      var chosen = plan && cities.find(function (city) { return cityKey(city) === plan.cityKey; });
      if (!chosen && cities.length) {
        chosen = cities.find(function (city) { return city.fa !== (state.city && state.city.nameFa); }) || cities[0];
      }
      var days = clamp(round(plan && plan.days || 7), 3, 30);
      var companion = plan && plan.companion || 'alone';
      if (travelerCount(companion, state) < 2 && companion !== 'alone') companion = 'alone';
      state.travelPlan = { destinationIso: iso2, cityKey: cityKey(chosen), days: days, companion: companion };
      return { plan: state.travelPlan, country: countryByCode(iso2), cities: cities, city: chosen };
    }

    function travelOptions(state) {
      var aliveChildren = ((state.family && state.family.children) || []).filter(livingPerson).length;
      var married = state.family && state.family.relationshipStatus === 'married' && livingPerson(state.family.partner);
      var options = [
        { value: 'alone', label: 'تکی', disabled: false },
        { value: 'family', label: 'با خانواده', disabled: travelerCount('family', state) < 2 },
        { value: 'spouse', label: 'با همسر', disabled: !married },
        { value: 'children', label: 'با فرزندها', disabled: aliveChildren === 0 }
      ];
      return options;
    }

    function estimateForPlan(state, selectedCountry, selectedCity, days, mode) {
      return estimateTripUSD({
        origin: state.country,
        destination: selectedCountry,
        originCity: { fa: state.city && state.city.nameFa, popM: state.city && state.city.popM },
        destinationCity: selectedCity,
        days: days,
        people: travelerCount(mode, state)
      });
    }

    function renderMoneyTravel(state) {
      ensureSupportState(state);
      var panel = doc.getElementById('panel-moneytravel');
      if (!panel) return;
      var support = supportTerms(state);
      var supportHistory = state.family.moneySupport.history.slice().reverse().slice(0, 5);
      var supportHtml = '<h3 class="panel-title">پول توجیبی و سفر</h3><h4 class="life-feature-subtitle">درخواست پول از خانواده</h4>';
      if (state.age < 6) {
        supportHtml += '<p class="hint">از ۶ تا ۱۴ سالگی می‌توانی پول توجیبی بخواهی؛ از ۱۵ سالگی درخواست کمک‌هزینه جای آن را می‌گیرد.</p>';
      } else if (!support.livingParents) {
        supportHtml += '<p class="hint">پدر یا مادر زنده‌ای برای درخواست باقی نمانده؛ سابقهٔ درخواست‌های قبلی همچنان ثبت است.</p>';
      } else if (state.family.moneySupport.lastRequestAge === state.age) {
        supportHtml += '<p class="hint">در سن ' + U.numFmt(state.age) + ' سالگی درخواستت را ثبت کرده‌ای؛ سال آینده دوباره امکان درخواست داری.</p>';
      } else {
        supportHtml += '<p class="muted small">' +
          (support.allowance ? 'تا پیش از ۱۵ سالگی، درخواست پول توجیبی کودکانه است.' : 'از ۱۵ سالگی به بعد می‌توانی برای هزینه‌هایت از پدر و مادر کمک مالی بخواهی.') +
          '</p><div class="panel-row"><span>مبلغ درخواستی پیشنهادی</span><b>' + esc(moneyLabel(state, support.amountUSD)) + '</b></div>' +
          '<div class="actions"><button class="btn-primary btn-mini" id="act-request-parent-money">' +
          (support.allowance ? 'درخواست پول توجیبی' : 'درخواست کمک‌هزینه') + '</button></div>';
      }
      if (supportHistory.length) {
        supportHtml += '<h4 class="life-feature-subtitle">سابقهٔ درخواست‌ها</h4><ul class="rep-list">' + supportHistory.map(function (record) {
          return '<li>سن ' + U.numFmt(record.age) + ' · ' + (record.accepted ? 'پذیرفته شد' : 'رد شد') +
            (record.accepted ? ' · ' + esc(moneyLabel(state, record.amountUSD)) : '') + '</li>';
        }).join('') + '</ul>';
      }

      var travelHtml = '<div class="life-feature-divider"></div><h4 class="life-feature-subtitle">مسافرت</h4>';
      if (state.age < 25) {
        travelHtml += '<p class="hint">از ۲۵ سالگی به بعد می‌توانی مقصد، مدت سفر و همراهانت را انتخاب کنی. سفر در سن فعلی قفل است.</p>';
      } else {
        var normalized = ensureTravelPlan(state);
        var country = normalized.country;
        var countries = (LS.countries || []).slice().sort(function (a, b) { return String(a.fa).localeCompare(String(b.fa), 'fa'); });
        var countryOptions = countries.map(function (item) {
          return '<option value="' + esc(item.iso2) + '"' + (item.iso2 === normalized.plan.destinationIso ? ' selected' : '') + '>' +
            esc(item.fa) + ' · ' + esc(item.en) + '</option>';
        }).join('');
        var cityOptions = normalized.cities.map(function (city, index) {
          return '<option value="' + index + '"' + (cityKey(city) === normalized.plan.cityKey ? ' selected' : '') + '>' +
            esc(city.fa) + ' · ' + esc(city.native) + '</option>';
        }).join('');
        if (!normalized.cities.length) cityOptions = '<option value="">برای این کشور شهری در داده‌های بازی ثبت نشده</option>';
        var travelChoiceOptions = travelOptions(state).map(function (item) {
          return '<option value="' + item.value + '"' + (item.value === normalized.plan.companion ? ' selected' : '') +
            (item.disabled ? ' disabled' : '') + '>' + item.label + (item.disabled ? ' (در دسترس نیست)' : '') + '</option>';
        }).join('');
        travelHtml += '<p class="muted small">مقصد از شهرهای واقعی ثبت‌شده در دادهٔ بازی انتخاب می‌شود؛ شهر خیالی ساخته نمی‌شود.</p>' +
          '<div class="field"><label for="trip-country">کشور مقصد</label><select id="trip-country">' + countryOptions + '</select></div>' +
          '<div class="field"><label for="trip-city">شهر مقصد</label><select id="trip-city"' + (normalized.cities.length ? '' : ' disabled') + '>' + cityOptions + '</select></div>' +
          '<div class="field"><label for="trip-days">مدت سفر</label><select id="trip-days">' +
          [3,5,7,10,14,21,30].map(function (d) { return '<option value="' + d + '"' + (d === normalized.plan.days ? ' selected' : '') + '>' + d + ' روز</option>'; }).join('') +
          '</select></div>' +
          '<div class="field"><label for="trip-companion">همراهان</label><select id="trip-companion">' + travelChoiceOptions + '</select></div>' +
          '<div class="trip-estimate" id="trip-estimate"></div>' +
          '<div class="actions"><button class="btn-primary btn-mini" id="act-take-trip"' + (normalized.cities.length ? '' : ' disabled') + '>رزرو و پرداخت هزینهٔ سفر</button></div>' +
          '<p class="hint">هزینه‌ها به دلار آمریکا محاسبه و سپس به ارز محل زندگی تبدیل می‌شوند. قیمت‌های روزانهٔ منتشرشده هزینهٔ اقامت، غذا، حمل‌ونقل محلی و یک فعالیت را پوشش می‌دهند و شامل پرواز بین‌المللی نیستند.</p>' +
          '<p class="small muted">منابع: <a href="https://guidese.com/trip-cost-index" target="_blank" rel="noopener noreferrer">شاخص هزینهٔ سفر ۲۰۲۶</a> · ' +
          '<a href="https://www.explworld.com/tools/budget" target="_blank" rel="noopener noreferrer">شاخص هزینه برای ۲۴۴ کشور</a> · ' +
          '<a href="https://www.budgetyourtrip.com/howitworks.php" target="_blank" rel="noopener noreferrer">روش محاسبهٔ هزینهٔ روزانه</a>. ' +
          'برای کشورهایی که عدد مستقیم منتشرشده ندارند، هزینهٔ روزانه یک برآورد تکمیلی بر اساس GDP سرانه و منطقه است؛ کرایهٔ رفت‌وآمد هم قیمت زندهٔ بلیت نیست.</p>';
      }

      var travelHistory = (state.travelHistory || []).slice().reverse().slice(0, 4);
      if (travelHistory.length) {
        travelHtml += '<h4 class="life-feature-subtitle">سابقهٔ سفرها</h4><ul class="rep-list">' + travelHistory.map(function (trip) {
          return '<li>' + esc(trip.city) + '، ' + esc(trip.country) + ' · ' + U.numFmt(trip.days) + ' روز · ' +
            U.numFmt(trip.people) + ' نفر · ' + esc(moneyLabel(state, trip.totalUSD)) + '</li>';
        }).join('') + '</ul>';
      }
      panel.innerHTML = supportHtml + travelHtml;

      var requestButton = doc.getElementById('act-request-parent-money');
      if (requestButton) requestButton.addEventListener('click', requestMoneySupport);

      if (state.age >= 25) {
        var countrySelect = doc.getElementById('trip-country');
        var citySelect = doc.getElementById('trip-city');
        var daysSelect = doc.getElementById('trip-days');
        var companionSelect = doc.getElementById('trip-companion');
        var estimateBox = doc.getElementById('trip-estimate');
        var takeButton = doc.getElementById('act-take-trip');

        function currentTrip() {
          var selectedCountry = countryByCode(countrySelect && countrySelect.value);
          var list = cityListFor(countrySelect && countrySelect.value);
          var selectedCity = list[Number(citySelect && citySelect.value)];
          var duration = clamp(round(daysSelect && daysSelect.value || 7), 3, 30);
          var mode = companionSelect && companionSelect.value || 'alone';
          if (!selectedCountry || !selectedCity) return null;
          return { country: selectedCountry, city: selectedCity, list: list, days: duration, mode: mode };
        }

        function savePlanFromControls() {
          var trip = currentTrip();
          if (!trip) return;
          state.travelPlan = {
            destinationIso: trip.country.iso2, cityKey: cityKey(trip.city),
            days: trip.days, companion: trip.mode
          };
          persist(state);
        }

        function updateEstimate() {
          var trip = currentTrip();
          if (!trip || !estimateBox) {
            if (estimateBox) estimateBox.innerHTML = '<p class="hint">برای این کشور شهر قابل انتخابی در دادهٔ بازی موجود نیست.</p>';
            if (takeButton) takeButton.disabled = true;
            return;
          }
          var costs = estimateForPlan(state, trip.country, trip.city, trip.days, trip.mode);
          var localCost = currencyFromUSD(state, costs.totalUSD);
          var displayLocal = U.moneyFmt ? U.moneyFmt(localCost * 100, state.country.currency) : (String(localCost) + ' ' + state.country.currency);
          var enough = !LS.Economy || !LS.Economy.hasMoney || LS.Economy.hasMoney(state, costs.totalUSD);
          estimateBox.innerHTML =
            '<div class="panel-row"><span>هزینهٔ روزانه برای هر نفر</span><b>$' + U.numFmt(costs.dailyUSD) + '</b></div>' +
            '<div class="panel-row"><span>اقامت، غذا، رفت‌وآمد محلی و فعالیت‌ها</span><b>$' + U.numFmt(costs.groundUSD) + '</b></div>' +
            '<div class="panel-row"><span>رفت‌وآمد رفت‌وبرگشت برای ' + U.numFmt(costs.people) + ' نفر</span><b>$' + U.numFmt(costs.fareUSD) + '</b></div>' +
            '<div class="panel-row"><span>ذخیرهٔ احتیاطی ۱۰٪</span><b>$' + U.numFmt(costs.contingencyUSD) + '</b></div>' +
            '<div class="panel-row trip-total"><span>هزینهٔ کل مدل</span><b>' + esc(displayLocal) + ' · حدود $' + U.numFmt(costs.totalUSD) + '</b></div>' +
            '<p class="small muted">مبنای رفت‌وآمد: ' + ({
              'same-city': 'بدون هزینهٔ رفت‌وآمد بین شهرها',
              'domestic-ground-estimate': 'برآورد رفت‌وآمد داخلی',
              'international-same-region-estimate': 'برآورد سفر بین‌المللی در همان منطقه',
              'intercontinental-estimate': 'برآورد سفر بین‌قاره‌ای'
            })[costs.fareMethod] + '.</p>' +
            (costs.dailySource === 'published-2026'
              ? '<p class="small muted">هزینهٔ روزانه از مقدار منتشرشده برای این کشور در شاخص ۲۰۲۶ استفاده می‌کند.</p>'
              : '<p class="small muted">برای این کشور قیمت روزانهٔ مستقیم در جدول محدود موجود نبود؛ مقدار روزانه از داده‌های اقتصادی کشور برآورد شد.</p>') +
            (!enough ? '<p class="hint" style="color:var(--danger)">موجودی فعلی برای این سفر کافی نیست.</p>' : '');
          if (takeButton) takeButton.disabled = !enough || costs.sameCity;
        }

        if (countrySelect) countrySelect.addEventListener('change', function () {
          var selectedIso = countrySelect.value;
          var newCities = cityListFor(selectedIso);
          state.travelPlan = {
            destinationIso: selectedIso,
            cityKey: cityKey(newCities.find(function (city) { return city.fa !== (state.city && state.city.nameFa); }) || newCities[0]),
            days: clamp(round(daysSelect.value || 7), 3, 30),
            companion: companionSelect.value || 'alone'
          };
          renderMoneyTravel(state);
          persist(state);
        });
        [citySelect, daysSelect, companionSelect].forEach(function (control) {
          if (!control) return;
          control.addEventListener('change', function () {
            savePlanFromControls();
            updateEstimate();
          });
        });
        if (takeButton) takeButton.addEventListener('click', function () {
          var trip = currentTrip();
          if (!trip || !App.state || App.state !== state || !state.alive) return;
          if (state.age < 25) { App.toast('سفر از ۲۵ سالگی فعال است.', true); return; }
          var count = travelerCount(trip.mode, state);
          var costs = estimateForPlan(state, trip.country, trip.city, trip.days, trip.mode);
          var enough = !LS.Economy || !LS.Economy.hasMoney || LS.Economy.hasMoney(state, costs.totalUSD);
          if (!enough) { App.toast('موجودی برای پرداخت هزینهٔ این سفر کافی نیست.', true); updateEstimate(); return; }
          var summary = '<p>مقصد: <b>' + esc(trip.city.fa) + '، ' + esc(trip.country.fa) + '</b></p>' +
            '<p>مدت: ' + U.numFmt(trip.days) + ' روز · همراهان: ' + U.numFmt(count) + ' نفر</p>' +
            '<p>هزینهٔ مدل: <b>' + esc(moneyLabel(state, costs.totalUSD)) + '</b></p>' +
            '<p class="small muted">هزینه برآورد است، نه نرخ زندهٔ بلیت یا هتل. با تأیید، مبلغ از موجودی کسر و سفر در سابقه ثبت می‌شود.</p>';
          App.modal('تأیید سفر', summary, [
            { label: 'پرداخت و ثبت سفر', primary: true, fn: function () {
              if (App.state !== state || !state.alive || state.age < 25) {
                App.toast('وضعیت زندگی تغییر کرده؛ سفر ثبت نشد.', true);
                return;
              }
              var payment = LS.Economy && LS.Economy.tryPayUSD
                ? LS.Economy.tryPayUSD(state, costs.totalUSD, 'سفر به ' + trip.city.fa + '، ' + trip.country.fa)
                : { ok: false };
              if (!payment.ok) {
                App.toast('پرداخت انجام نشد؛ موجودی را دوباره بررسی کن.', true);
                return;
              }
              state.travelHistory = state.travelHistory || [];
              state.travelHistory.push({
                age: state.age, year: state.year, country: trip.country.fa, countryIso2: trip.country.iso2,
                city: trip.city.fa, days: trip.days, people: count, companion: trip.mode, totalUSD: costs.totalUSD
              });
              if (state.travelHistory.length > 12) state.travelHistory.shift();
              state.stats.happiness = U.clamp((Number(state.stats.happiness) || 0) + 5, 0, 100);
              state.stats.stress = U.clamp((Number(state.stats.stress) || 0) - 4, 0, 100);
              state.log.push({
                age: state.age, year: state.year,
                text: 'به ' + trip.city.fa + ' در کشور ' + trip.country.fa + ' سفر کردی؛ مدت ' + U.numFmt(trip.days) +
                  ' روز، همراه ' + U.numFmt(count) + ' نفر و هزینهٔ برآوردی حدود $' + U.numFmt(costs.totalUSD) + ' بود.',
                kind: 'major'
              });
              refreshEverything(state);
              App.toast('سفر ثبت شد و هزینه از موجودی کسر شد.');
            }},
            { label: 'فعلاً نه' }
          ]);
        });
        updateEstimate();
      }
    }

    function renderMoneyTravel(state) {
      ensureSupportState(state);
      var panel = doc.getElementById('panel-moneytravel');
      if (!panel) return;
      var support = supportTerms(state);
      var supportHistory = state.family.moneySupport.history.slice().reverse().slice(0, 5);
      var supportHtml = '<h3 class="panel-title">پول توجیبی و سفر</h3><h4 class="life-feature-subtitle">درخواست پول از خانواده</h4>';
      if (state.age < 6) {
        supportHtml += '<p class="hint">از ۶ تا ۱۴ سالگی می‌توانی پول توجیبی بخواهی؛ از ۱۵ سالگی درخواست کمک‌هزینه جای آن را می‌گیرد.</p>';
      } else if (!support.livingParents) {
        supportHtml += '<p class="hint">پدر یا مادر زنده‌ای برای درخواست باقی نمانده؛ سابقهٔ درخواست‌های قبلی همچنان ثبت است.</p>';
      } else if (state.family.moneySupport.lastRequestAge === state.age) {
        supportHtml += '<p class="hint">در سن ' + U.numFmt(state.age) + ' سالگی درخواستت را ثبت کرده‌ای؛ سال آینده دوباره امکان درخواست داری.</p>';
      } else {
        supportHtml += '<p class="muted small">' +
          (support.allowance ? 'تا پیش از ۱۵ سالگی، درخواست پول توجیبی کودکانه است.' : 'از ۱۵ سالگی به بعد می‌توانی برای هزینه‌هایت از پدر و مادر کمک مالی بخواهی.') +
          '</p><div class="panel-row"><span>مبلغ درخواستی پیشنهادی</span><b>' + esc(moneyLabel(state, support.amountUSD)) + '</b></div>' +
          '<div class="actions"><button class="btn-primary btn-mini" id="act-request-parent-money">' +
          (support.allowance ? 'درخواست پول توجیبی' : 'درخواست کمک‌هزینه') + '</button></div>';
      }
      if (supportHistory.length) {
        supportHtml += '<h4 class="life-feature-subtitle">سابقهٔ درخواست‌ها</h4><ul class="rep-list">' + supportHistory.map(function (record) {
          return '<li>سن ' + U.numFmt(record.age) + ' · ' + (record.accepted ? 'پذیرفته شد' : 'رد شد') +
            (record.accepted ? ' · ' + esc(moneyLabel(state, record.amountUSD)) : '') + '</li>';
        }).join('') + '</ul>';
      }

      var travelHtml = '<div class="life-feature-divider"></div><h4 class="life-feature-subtitle">مسافرت</h4>';
      if (state.age < 25) {
        travelHtml += '<p class="hint">از ۲۵ سالگی به بعد می‌توانی مقصد، مدت سفر و همراهانت را انتخاب کنی. سفر در سن فعلی قفل است.</p>';
      } else {
        var normalized = ensureTravelPlan(state);
        var countries = (LS.countries || []).slice().sort(function (a, b) { return String(a.fa).localeCompare(String(b.fa), 'fa'); });
        var countryOptions = countries.map(function (item) {
          return '<option value="' + esc(item.iso2) + '"' + (item.iso2 === normalized.plan.destinationIso ? ' selected' : '') + '>' +
            esc(item.fa) + ' · ' + esc(item.en) + '</option>';
        }).join('');
        var cityOptions = normalized.cities.map(function (city, index) {
          return '<option value="' + index + '"' + (cityKey(city) === normalized.plan.cityKey ? ' selected' : '') + '>' +
            esc(city.fa) + ' · ' + esc(city.native) + '</option>';
        }).join('');
        if (!normalized.cities.length) cityOptions = '<option value="">برای این کشور شهری در داده‌های بازی ثبت نشده</option>';
        var travelChoiceOptions = travelOptions(state).map(function (item) {
          return '<option value="' + item.value + '"' + (item.value === normalized.plan.companion ? ' selected' : '') +
            (item.disabled ? ' disabled' : '') + '>' + item.label + (item.disabled ? ' (در دسترس نیست)' : '') + '</option>';
        }).join('');
        travelHtml += '<p class="muted small">مقصد از شهرهای واقعی ثبت‌شده در دادهٔ بازی انتخاب می‌شود؛ شهر خیالی ساخته نمی‌شود.</p>' +
          '<div class="field"><label for="trip-country">کشور مقصد</label><select id="trip-country">' + countryOptions + '</select></div>' +
          '<div class="field"><label for="trip-city">شهر مقصد</label><select id="trip-city"' + (normalized.cities.length ? '' : ' disabled') + '>' + cityOptions + '</select></div>' +
          '<div class="field"><label for="trip-days">مدت سفر</label><select id="trip-days">' +
          [3,5,7,10,14,21,30].map(function (d) { return '<option value="' + d + '"' + (d === normalized.plan.days ? ' selected' : '') + '>' + d + ' روز</option>'; }).join('') +
          '</select></div>' +
          '<div class="field"><label for="trip-companion">همراهان</label><select id="trip-companion">' + travelChoiceOptions + '</select></div>' +
          '<div class="trip-estimate" id="trip-estimate"></div>' +
          '<div class="actions"><button class="btn-primary btn-mini" id="act-take-trip"' + (normalized.cities.length ? '' : ' disabled') + '>رزرو و پرداخت هزینهٔ سفر</button></div>' +
          '<p class="hint">هزینه‌ها به دلار آمریکا محاسبه و سپس به ارز محل زندگی تبدیل می‌شوند. قیمت‌های روزانهٔ منتشرشده هزینهٔ اقامت، غذا، حمل‌ونقل محلی و یک فعالیت را پوشش می‌دهند و شامل پرواز بین‌المللی نیستند.</p>' +
          '<p class="small muted">منابع: <a href="https://guidese.com/trip-cost-index" target="_blank" rel="noopener noreferrer">شاخص هزینهٔ سفر ۲۰۲۶</a> · ' +
          '<a href="https://www.explworld.com/tools/budget" target="_blank" rel="noopener noreferrer">شاخص هزینه برای ۲۴۴ کشور</a> · ' +
          '<a href="https://www.budgetyourtrip.com/howitworks.php" target="_blank" rel="noopener noreferrer">روش محاسبهٔ هزینهٔ روزانه</a>. ' +
          'برای کشورهایی که عدد مستقیم منتشرشده ندارند، هزینهٔ روزانه یک برآورد تکمیلی بر اساس GDP سرانه و منطقه است؛ کرایهٔ رفت‌وآمد هم قیمت زندهٔ بلیت نیست.</p>';
      }

      var travelHistory = (state.travelHistory || []).slice().reverse().slice(0, 4);
      if (travelHistory.length) {
        travelHtml += '<h4 class="life-feature-subtitle">سابقهٔ سفرها</h4><ul class="rep-list">' + travelHistory.map(function (trip) {
          return '<li>' + esc(trip.city) + '، ' + esc(trip.country) + ' · ' + U.numFmt(trip.days) + ' روز · ' +
            U.numFmt(trip.people) + ' نفر · ' + esc(moneyLabel(state, trip.totalUSD)) + '</li>';
        }).join('') + '</ul>';
      }
      panel.innerHTML = supportHtml + travelHtml;

      var requestButton = doc.getElementById('act-request-parent-money');
      if (requestButton) requestButton.addEventListener('click', requestMoneySupport);

      if (state.age >= 25) {
        var countrySelect = doc.getElementById('trip-country');
        var citySelect = doc.getElementById('trip-city');
        var daysSelect = doc.getElementById('trip-days');
        var companionSelect = doc.getElementById('trip-companion');
        var estimateBox = doc.getElementById('trip-estimate');
        var takeButton = doc.getElementById('act-take-trip');

        function currentTrip() {
          var selectedCountry = countryByCode(countrySelect && countrySelect.value);
          var list = cityListFor(countrySelect && countrySelect.value);
          var selectedCity = list[Number(citySelect && citySelect.value)];
          var duration = clamp(round(daysSelect && daysSelect.value || 7), 3, 30);
          var mode = companionSelect && companionSelect.value || 'alone';
          if (!selectedCountry || !selectedCity) return null;
          return { country: selectedCountry, city: selectedCity, list: list, days: duration, mode: mode };
        }

        function savePlanFromControls() {
          var trip = currentTrip();
          if (!trip) return;
          state.travelPlan = {
            destinationIso: trip.country.iso2, cityKey: cityKey(trip.city),
            days: trip.days, companion: trip.mode
          };
          persist(state);
        }

        function updateEstimate() {
          var trip = currentTrip();
          if (!trip || !estimateBox) {
            if (estimateBox) estimateBox.innerHTML = '<p class="hint">برای این کشور شهر قابل انتخابی در دادهٔ بازی موجود نیست.</p>';
            if (takeButton) takeButton.disabled = true;
            return;
          }
          var costs = estimateForPlan(state, trip.country, trip.city, trip.days, trip.mode);
          var localCost = currencyFromUSD(state, costs.totalUSD);
          var displayLocal = U.moneyFmt ? U.moneyFmt(localCost * 100, state.country.currency) : (String(localCost) + ' ' + state.country.currency);
          var enough = !LS.Economy || !LS.Economy.hasMoney || LS.Economy.hasMoney(state, costs.totalUSD);
          estimateBox.innerHTML =
            '<div class="panel-row"><span>هزینهٔ روزانه برای هر نفر</span><b>$' + U.numFmt(costs.dailyUSD) + '</b></div>' +
            '<div class="panel-row"><span>اقامت، غذا، رفت‌وآمد محلی و فعالیت‌ها</span><b>$' + U.numFmt(costs.groundUSD) + '</b></div>' +
            '<div class="panel-row"><span>رفت‌وآمد رفت‌وبرگشت برای ' + U.numFmt(costs.people) + ' نفر</span><b>$' + U.numFmt(costs.fareUSD) + '</b></div>' +
            '<div class="panel-row"><span>ذخیرهٔ احتیاطی ۱۰٪</span><b>$' + U.numFmt(costs.contingencyUSD) + '</b></div>' +
            '<div class="panel-row trip-total"><span>هزینهٔ کل مدل</span><b>' + esc(displayLocal) + ' · حدود $' + U.numFmt(costs.totalUSD) + '</b></div>' +
            '<p class="small muted">مبنای رفت‌وآمد: ' + ({
              'same-city': 'بدون هزینهٔ رفت‌وآمد بین شهرها',
              'domestic-ground-estimate': 'برآورد رفت‌وآمد داخلی',
              'international-same-region-estimate': 'برآورد سفر بین‌المللی در همان منطقه',
              'intercontinental-estimate': 'برآورد سفر بین‌قاره‌ای'
            })[costs.fareMethod] + '.</p>' +
            (costs.dailySource === 'published-2026'
              ? '<p class="small muted">هزینهٔ روزانه از مقدار منتشرشده برای این کشور در شاخص ۲۰۲۶ استفاده می‌کند.</p>'
              : '<p class="small muted">برای این کشور قیمت روزانهٔ مستقیم در جدول محدود موجود نبود؛ مقدار روزانه از داده‌های اقتصادی کشور برآورد شد.</p>') +
            (!enough ? '<p class="hint" style="color:var(--danger)">موجودی فعلی برای این سفر کافی نیست.</p>' : '');
          if (takeButton) takeButton.disabled = !enough || costs.sameCity;
        }

        if (countrySelect) countrySelect.addEventListener('change', function () {
          var selectedIso = countrySelect.value;
          var newCities = cityListFor(selectedIso);
          state.travelPlan = {
            destinationIso: selectedIso,
            cityKey: cityKey(newCities.find(function (city) { return city.fa !== (state.city && state.city.nameFa); }) || newCities[0]),
            days: clamp(round(daysSelect.value || 7), 3, 30),
            companion: companionSelect.value || 'alone'
          };
          renderMoneyTravel(state);
          persist(state);
        });
        [citySelect, daysSelect, companionSelect].forEach(function (control) {
          if (!control) return;
          control.addEventListener('change', function () {
            savePlanFromControls();
            updateEstimate();
          });
        });
        if (takeButton) takeButton.addEventListener('click', function () {
          var trip = currentTrip();
          if (!trip || !App.state || App.state !== state || !state.alive) return;
          if (state.age < 25) { App.toast('سفر از ۲۵ سالگی فعال است.', true); return; }
          var count = travelerCount(trip.mode, state);
          var costs = estimateForPlan(state, trip.country, trip.city, trip.days, trip.mode);
          var enough = !LS.Economy || !LS.Economy.hasMoney || LS.Economy.hasMoney(state, costs.totalUSD);
          if (!enough) { App.toast('موجودی برای پرداخت هزینهٔ این سفر کافی نیست.', true); updateEstimate(); return; }
          var summary = '<p>مقصد: <b>' + esc(trip.city.fa) + '، ' + esc(trip.country.fa) + '</b></p>' +
            '<p>مدت: ' + U.numFmt(trip.days) + ' روز · همراهان: ' + U.numFmt(count) + ' نفر</p>' +
            '<p>هزینهٔ مدل: <b>' + esc(moneyLabel(state, costs.totalUSD)) + '</b></p>' +
            '<p class="small muted">هزینه برآورد است، نه نرخ زندهٔ بلیت یا هتل. با تأیید، مبلغ از موجودی کسر و سفر در سابقه ثبت می‌شود.</p>';
          App.modal('تأیید سفر', summary, [
            { label: 'پرداخت و ثبت سفر', primary: true, fn: function () {
              if (App.state !== state || !state.alive || state.age < 25) {
                App.toast('وضعیت زندگی تغییر کرده؛ سفر ثبت نشد.', true);
                return;
              }
              var payment = LS.Economy && LS.Economy.tryPayUSD
                ? LS.Economy.tryPayUSD(state, costs.totalUSD, 'سفر به ' + trip.city.fa + '، ' + trip.country.fa)
                : { ok: false };
              if (!payment.ok) {
                App.toast('پرداخت انجام نشد؛ موجودی را دوباره بررسی کن.', true);
                return;
              }
              state.travelHistory = state.travelHistory || [];
              state.travelHistory.push({
                age: state.age, year: state.year, country: trip.country.fa, countryIso2: trip.country.iso2,
                city: trip.city.fa, days: trip.days, people: count, companion: trip.mode, totalUSD: costs.totalUSD
              });
              if (state.travelHistory.length > 12) state.travelHistory.shift();
              state.stats.happiness = U.clamp((Number(state.stats.happiness) || 0) + 5, 0, 100);
              state.stats.stress = U.clamp((Number(state.stats.stress) || 0) - 4, 0, 100);
              state.log.push({
                age: state.age, year: state.year,
                text: 'به ' + trip.city.fa + ' در کشور ' + trip.country.fa + ' سفر کردی؛ مدت ' + U.numFmt(trip.days) +
                  ' روز، همراه ' + U.numFmt(count) + ' نفر و هزینهٔ برآوردی حدود $' + U.numFmt(costs.totalUSD) + ' بود.',
                kind: 'major'
              });
              refreshEverything(state);
              App.toast('سفر ثبت شد و هزینه از موجودی کسر شد.');
            }},
            { label: 'فعلاً نه' }
          ]);
        });
        updateEstimate();
      }
    }

    Panels.moneytravel = renderMoneyTravel;
  }

  return {
    DAILY_USD_2026: DAILY_USD_2026,
    hash32: hash32,
    makeAvatarSVG: makeAvatarSVG,
    dailyCostUSD: dailyCostUSD,
    estimateTripUSD: estimateTripUSD,
    supportTerms: supportTerms,
    travelerCount: travelerCount,
    install: install
  };
});

(function () {
  "use strict";
  var root = document.getElementById("visitor-map");
  if (!root) return;

  var NS = "daryl-gsj.github.io";
  var API = "https://abacus.jasoncameron.dev";
  var HOME = [121.47, 31.23]; // Shanghai
  var CENTROIDS = {
    CN: [104, 35], US: [-98, 39], SG: [103.8, 1.35], HK: [114.2, 22.3], TW: [121, 23.7],
    JP: [138, 36], KR: [127.8, 36.4], GB: [-2, 54], DE: [10.4, 51], FR: [2.4, 46.6],
    CA: [-100, 57], AU: [134, -25], IN: [79, 22], RU: [90, 60], BR: [-52, -10],
    NL: [5.3, 52.2], CH: [8.2, 46.8], AE: [54, 24], MY: [102, 4], TH: [101, 15]
  };
  var CODES = Object.keys(CENTROIDS);
  var SVGNS = "http://www.w3.org/2000/svg";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var els = {
    total: document.getElementById("vm-total"),
    regions: document.getElementById("vm-regions"),
    list: document.getElementById("vm-list"),
    you: document.getElementById("vm-you"),
    markers: document.getElementById("vm-markers"),
    arcs: document.getElementById("vm-arcs"),
    status: document.getElementById("vm-status")
  };

  var names;
  try { names = new Intl.DisplayNames(["en"], { type: "region" }); } catch (e) { names = null; }
  function regionName(code) {
    if (code === "OT") return "Elsewhere";
    try { return (names && names.of(code)) || code; } catch (e) { return code; }
  }

  function xy(p) { return [(p[0] + 180) * 2, (84 - p[1]) * 2]; }
  function svg(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function ls(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  function getCount(key) {
    return fetch(API + "/get/" + NS + "/" + key)
      .then(function (r) { return r.json(); })
      .then(function (j) { return typeof j.value === "number" ? j.value : 0; })
      .catch(function () { return 0; });
  }
  function hitCount(key) {
    return fetch(API + "/hit/" + NS + "/" + key)
      .then(function (r) { return r.json(); })
      .then(function (j) { return typeof j.value === "number" ? j.value : null; })
      .catch(function () { return null; });
  }

  function locate() {
    return fetch("https://ipwho.is/?fields=success,country_code,latitude,longitude,city")
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.success || !j.country_code) throw new Error("ipwho");
        return { code: j.country_code, lon: j.longitude, lat: j.latitude, city: j.city };
      })
      .catch(function () {
        return fetch("https://get.geojs.io/v1/ip/country.json")
          .then(function (r) { return r.json(); })
          .then(function (j) { return j && j.country ? { code: j.country } : null; })
          .catch(function () { return null; });
      });
  }

  /* ---------- rendering ---------- */
  function animateNumber(el, to) {
    var from = parseInt(el.getAttribute("data-value") || "0", 10) || 0;
    el.setAttribute("data-value", String(to));
    if (reduce || from === to) { el.textContent = to.toLocaleString("en-US"); return; }
    var start = null, dur = 1100;
    function tick(t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e).toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var markerNodes = {};
  function renderMarkers(counts) {
    CODES.forEach(function (code) {
      var c = counts[code] || 0;
      var node = markerNodes[code];
      if (!c) return;
      var p = xy(CENTROIDS[code]);
      var r = Math.min(11, 3.2 + 1.9 * Math.sqrt(c));
      if (!node) {
        var g = svg("g", { "class": "vm-marker", transform: "translate(" + p[0] + " " + p[1] + ")" });
        var t = svg("title", {}); g.appendChild(t);
        g.appendChild(svg("circle", { "class": "vm-pulse", r: r }));
        g.appendChild(svg("circle", { "class": "vm-dot", r: r }));
        els.markers.appendChild(g);
        node = markerNodes[code] = g;
      }
      node.querySelector("title").textContent = regionName(code) + ": " + c;
      node.querySelector(".vm-dot").setAttribute("r", r);
      node.querySelector(".vm-pulse").setAttribute("r", r);
    });
  }

  function renderList(counts) {
    var rows = Object.keys(counts).filter(function (k) { return counts[k] > 0; })
      .sort(function (a, b) { return counts[b] - counts[a]; });
    var sum = rows.reduce(function (s, k) { return s + counts[k]; }, 0) || 1;
    var max = counts[rows[0]] || 1;
    els.list.innerHTML = "";
    rows.slice(0, 6).forEach(function (k) {
      var li = document.createElement("li");
      var pct = Math.round(counts[k] / sum * 100);
      li.innerHTML = '<span class="vm-name"></span><span class="vm-bar"><i></i></span><span class="vm-num"></span>';
      li.querySelector(".vm-name").textContent = regionName(k);
      li.querySelector(".vm-num").textContent = counts[k].toLocaleString("en-US") + " · " + pct + "%";
      li.querySelector("i").style.width = Math.max(6, counts[k] / max * 100) + "%";
      els.list.appendChild(li);
    });
    var known = rows.filter(function (k) { return k !== "OT"; }).length;
    animateNumber(els.regions, known + (counts.OT ? 1 : 0));
  }

  function render(data) {
    animateNumber(els.total, data.total);
    renderMarkers(data.counts);
    renderList(data.counts);
    root.classList.add("is-ready");
  }

  function drawArc(from) {
    els.arcs.innerHTML = "";
    var a = xy(from), b = xy(HOME);
    var dx = b[0] - a[0], dy = b[1] - a[1], d = Math.sqrt(dx * dx + dy * dy);
    if (d < 6) return;
    var cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2 - Math.min(70, d * 0.32);
    els.arcs.appendChild(svg("path", { "class": "vm-arc", d: "M" + a[0] + " " + a[1] + "Q" + cx + " " + cy + " " + b[0] + " " + b[1] }));
  }

  function drawYou(loc) {
    var p = loc.lon != null ? [loc.lon, loc.lat] : CENTROIDS[loc.code];
    if (!p) return;
    var q = xy(p);
    var g = svg("g", { "class": "vm-you", transform: "translate(" + q[0] + " " + q[1] + ")" });
    g.appendChild(svg("circle", { "class": "vm-you-ring", r: 4 }));
    g.appendChild(svg("circle", { "class": "vm-you-dot", r: 3.4 }));
    var tt = svg("title", {}); tt.textContent = "You are here"; g.appendChild(tt);
    els.markers.appendChild(g);
    drawArc(p);
    var h = xy(HOME);
    var home = svg("g", { "class": "vm-home", transform: "translate(" + h[0] + " " + h[1] + ")" });
    home.appendChild(svg("rect", { x: -3, y: -3, width: 6, height: 6, transform: "rotate(45)" }));
    var ht = svg("title", {}); ht.textContent = "Shanghai"; home.appendChild(ht);
    els.markers.appendChild(home);
  }

  function ripple() {
    var keys = Object.keys(markerNodes);
    if (!keys.length || document.hidden) return;
    var g = markerNodes[keys[Math.floor(Math.random() * keys.length)]];
    var base = g.querySelector(".vm-dot");
    var ring = svg("circle", { "class": "vm-ripple", r: base.getAttribute("r") });
    g.appendChild(ring);
    setTimeout(function () { if (ring.parentNode) ring.parentNode.removeChild(ring); }, 2600);
  }

  /* ---------- data ---------- */
  function loadAll() {
    var keys = CODES.concat(["OT"]);
    return Promise.all([getCount("total")].concat(keys.map(function (k) {
      return getCount("c-" + k);
    }))).then(function (arr) {
      var counts = {};
      keys.forEach(function (k, i) { counts[k] = arr[i + 1]; });
      return { total: arr[0], counts: counts };
    });
  }

  function refresh() {
    return loadAll().then(function (data) {
      if (data.total === 0) {
        data.total = Object.keys(data.counts).reduce(function (s, k) { return s + data.counts[k]; }, 0);
      }
      render(data);
      els.status.textContent = "Live";
      return data;
    });
  }

  function start() {
    // Count immediately on page load (deduped per browser for 12h); do not wait for location.
    var last = parseInt(ls("vm-counted") || "0", 10);
    var fresh = !last || Date.now() - last > 12 * 3600 * 1000;
    var located = locate();
    var counted = located.then(function (loc) {
      if (!fresh) return null;
      var code = loc && CENTROIDS[loc.code] ? loc.code : "OT";
      return Promise.all([hitCount("total"), hitCount("c-" + code)]).then(function (r) {
        if (r[0] !== null) ls("vm-counted", String(Date.now()));
      });
    });
    located.then(function (loc) {
      if (loc) {
        els.you.textContent = (loc.city ? loc.city + ", " : "") + regionName(loc.code);
        drawYou(loc);
      } else {
        els.you.textContent = "Hidden";
      }
    });
    counted.catch(function () {}).then(refresh).then(function () {
      if (!reduce) setInterval(ripple, 2400);
      setInterval(function () { if (!document.hidden) refresh(); }, 60000);
    }).catch(function () {
      els.status.textContent = "Offline";
    });
  }

  start();
})();

// ─── STATE ─────────────────────────────────────────────────────────────
let tempDelta = 0, rainDelta = 0, windDelta = 0;
let sourceRegion = '', targetRegion = 'UP';
let currentScenario = 'heat';
let timelineDay = 0;
let simRunning = false, tlPlaying = false, tlInterval = null;
let layerState = { temp: true, rain: true, eof: false, wind: true };
let animFrame = null;
let heatShimmerOffset = 0;
let heatwaveParticles = [];
let rainParticles = [];
let cycloneParticles = [];
let fogParticles = [];
let simHasRun = false;

// ─── ALL INDIA STATE DATA ───────────────────────────────────────────────
const stateData = {
    AP: { center: [15.9, 80.0], label: 'Andhra Pradesh', baseTemp: 31, baseRain: 85 },
    AR: { center: [27.1, 93.6], label: 'Arunachal Pradesh', baseTemp: 18, baseRain: 280 },
    AS: { center: [26.2, 92.9], label: 'Assam', baseTemp: 26, baseRain: 220 },
    BR: { center: [25.6, 85.1], label: 'Bihar', baseTemp: 28, baseRain: 110 },
    CG: { center: [21.3, 81.6], label: 'Chhattisgarh', baseTemp: 29, baseRain: 130 },
    GA: { center: [15.3, 74.0], label: 'Goa', baseTemp: 28, baseRain: 250 },
    GJ: { center: [22.3, 71.2], label: 'Gujarat', baseTemp: 33, baseRain: 75 },
    HR: { center: [29.1, 76.1], label: 'Haryana', baseTemp: 29, baseRain: 60 },
    HP: { center: [31.9, 77.1], label: 'Himachal Pradesh', baseTemp: 16, baseRain: 120 },
    JK: { center: [34.0, 74.8], label: 'Jammu & Kashmir', baseTemp: 12, baseRain: 90 },
    JH: { center: [23.6, 85.3], label: 'Jharkhand', baseTemp: 27, baseRain: 130 },
    KA: { center: [15.3, 75.7], label: 'Karnataka', baseTemp: 27, baseRain: 140 },
    KL: { center: [10.2, 76.3], label: 'Kerala', baseTemp: 27, baseRain: 310 },
    LA: { center: [34.2, 77.6], label: 'Ladakh', baseTemp: 4, baseRain: 15 },
    MP: { center: [23.5, 77.7], label: 'Madhya Pradesh', baseTemp: 30, baseRain: 100 },
    MH: { center: [19.7, 75.7], label: 'Maharashtra', baseTemp: 30, baseRain: 120 },
    MN: { center: [24.8, 93.9], label: 'Manipur', baseTemp: 21, baseRain: 190 },
    ML: { center: [25.5, 91.4], label: 'Meghalaya', baseTemp: 20, baseRain: 400 },
    MZ: { center: [23.2, 92.9], label: 'Mizoram', baseTemp: 21, baseRain: 200 },
    NL: { center: [26.2, 94.6], label: 'Nagaland', baseTemp: 20, baseRain: 185 },
    OD: { center: [20.9, 84.2], label: 'Odisha', baseTemp: 29, baseRain: 145 },
    PB: { center: [31.1, 75.3], label: 'Punjab', baseTemp: 27, baseRain: 65 },
    RJ: { center: [27.0, 74.2], label: 'Rajasthan', baseTemp: 34, baseRain: 35 },
    SK: { center: [27.5, 88.5], label: 'Sikkim', baseTemp: 15, baseRain: 210 },
    TN: { center: [11.1, 78.7], label: 'Tamil Nadu', baseTemp: 30, baseRain: 100 },
    TS: { center: [17.4, 79.0], label: 'Telangana', baseTemp: 32, baseRain: 90 },
    TR: { center: [23.8, 91.3], label: 'Tripura', baseTemp: 25, baseRain: 220 },
    UP: { center: [26.8, 80.9], label: 'Uttar Pradesh', baseTemp: 28, baseRain: 90 },
    UK: { center: [30.1, 79.3], label: 'Uttarakhand', baseTemp: 18, baseRain: 140 },
    WB: { center: [23.0, 87.7], label: 'West Bengal', baseTemp: 27, baseRain: 175 },
    AN: { center: [11.7, 92.7], label: 'Andaman & Nicobar', baseTemp: 28, baseRain: 300 },
    CH: { center: [30.7, 76.8], label: 'Chandigarh', baseTemp: 27, baseRain: 65 },
    DN: { center: [20.2, 73.0], label: 'Dadra & Nagar Haveli', baseTemp: 29, baseRain: 140 },
    DD: { center: [20.4, 72.8], label: 'Daman & Diu', baseTemp: 30, baseRain: 80 },
    DL: { center: [28.6, 77.2], label: 'Delhi (NCT)', baseTemp: 30, baseRain: 65 },
    LD: { center: [10.6, 72.6], label: 'Lakshadweep', baseTemp: 28, baseRain: 160 },
    PY: { center: [11.9, 79.8], label: 'Puducherry', baseTemp: 30, baseRain: 115 },
};

// Adjacency for ripple propagation
const adjacency = {
    AP: ['TS', 'OD', 'CG', 'KA', 'TN'], RJ: ['HR', 'PB', 'UP', 'MP', 'GJ'],
    MP: ['RJ', 'UP', 'CG', 'MH', 'GJ'], UP: ['UK', 'HP', 'HR', 'RJ', 'MP', 'BR', 'JH', 'WB'],
    MH: ['MP', 'CG', 'TS', 'KA', 'GJ', 'AP'], GJ: ['RJ', 'MP', 'MH'],
    KA: ['MH', 'AP', 'TS', 'TN', 'KL'], TN: ['AP', 'KA', 'KL', 'PY'],
    WB: ['OD', 'JH', 'BR', 'AS', 'SK'], OD: ['AP', 'TS', 'CG', 'JH', 'WB'],
    AS: ['WB', 'SK', 'AR', 'NL', 'MN', 'MZ', 'TR', 'ML'],
    HR: ['PB', 'UK', 'UP', 'RJ', 'DL'], PB: ['JK', 'HP', 'HR', 'CH'],
    BR: ['UP', 'JH', 'WB'], JH: ['OD', 'WB', 'BR', 'UP', 'MP', 'CG'],
    CG: ['MP', 'OD', 'JH', 'MH', 'TS', 'AP'], KL: ['TN', 'KA'],
    HP: ['JK', 'LA', 'UK', 'PB'], UK: ['HP', 'UP', 'HR'], JK: ['HP', 'LA'],
    TS: ['AP', 'MH', 'CG', 'KA', 'MP'], TR: ['AS', 'MZ'], MN: ['AS', 'NL', 'MZ'],
    ML: ['AS'], NL: ['AS', 'AR', 'MN'], MZ: ['AS', 'TR', 'MN'],
    AR: ['AS', 'NL'], SK: ['WB', 'AS'], DL: ['HR', 'UP'], CH: ['PB', 'HR'],
    GA: ['MH', 'KA'], PY: ['TN', 'KA'], DD: ['GJ', 'DN'], DN: ['GJ', 'MH'],
    AN: [], LD: [], LA: ['JK', 'HP'],
};

// Neighbor rings for spread
function getNeighbors(code, depth = 1) {
    let ring = new Set([code]);
    for (let d = 0; d < depth; d++) {
        let next = new Set(ring);
        ring.forEach(c => { (adjacency[c] || []).forEach(n => next.add(n)); });
        ring = next;
    }
    return [...ring];
}

// ─── MAP INIT ─────────────────────────────────────────────────────────
const map = L.map('map', { zoomControl: true, attributionControl: false }).setView([22, 82], 5);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 10, minZoom: 4
}).addTo(map);

// State circles on map
const stateMarkers = {};
const stateColors = {};

function tempToColor(t, alpha = 0.55) {
    const stops = [
        [15, '#4FC3F7'], [22, '#81C784'], [27, '#FFF176'], [32, '#FFB74D'], [37, '#FF7043'], [43, '#B71C1C']
    ];
    let lo = stops[0], hi = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
        if (t >= stops[i][0] && t <= stops[i + 1][0]) { lo = stops[i]; hi = stops[i + 1]; break; }
    }
    const frac = (t - lo[0]) / (hi[0] - lo[0]);
    const c1 = hexToRgb(lo[1]), c2 = hexToRgb(hi[1]);
    const r = Math.round(c1.r + (c2.r - c1.r) * frac);
    const g = Math.round(c1.g + (c2.g - c1.g) * frac);
    const b = Math.round(c1.b + (c2.b - c1.b) * frac);
    return `rgba(${r},${g},${b},${alpha})`;
}
function hexToRgb(h) { const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); return { r, g, b }; }

function getStateTemp(code) {
    const s = stateData[code];
    if (!s) return 28;
    let t = s.baseTemp;
    if (sourceRegion === code) t += parseFloat(tempDelta) || 0;
    else if ((adjacency[sourceRegion] || []).includes(code)) t += (parseFloat(tempDelta) || 0) * 0.55;
    else if (getNeighbors(sourceRegion, 2).includes(code)) t += (parseFloat(tempDelta) || 0) * 0.25;
    return t;
}

function initMarkers() {
    Object.entries(stateData).forEach(([code, s]) => {
        const t = getStateTemp(code);
        const col = tempToColor(t, 0.6);
        stateColors[code] = col;
        const circle = L.circle(s.center, {
            radius: 60000,
            fillColor: col,
            fillOpacity: 0.55,
            color: 'rgba(100,130,180,0.4)',
            weight: 1,
            className: 'state-circle'
        }).addTo(map);
        circle.on('mouseover', (e) => showTooltip(e, code));
        circle.on('mouseout', () => { document.getElementById('stateTooltip').style.display = 'none'; });
        stateMarkers[code] = circle;
    });
}
initMarkers();

// Arrow layers
const arrowLayers = [];
function clearArrows() { arrowLayers.forEach(l => map.removeLayer(l)); arrowLayers.length = 0; }

function drawArrows(src, tgt) {
    clearArrows();
    if (!src || !tgt || !stateData[src] || !stateData[tgt]) return;
    const a = stateData[src].center, b = stateData[tgt].center;
    const mx = (a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.18, my = (a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.18;
    const line = L.polyline([[a[0], a[1]], [mx, my], [b[0], b[1]]], {
        color: '#E65100', weight: 2.5, opacity: .8, dashArray: '8 5', lineCap: 'round'
    }).addTo(map);
    arrowLayers.push(line);
    // Secondary arrows to neighbors of target
    (adjacency[tgt] || []).slice(0, 3).forEach(n => {
        if (n === src) return;
        const c = stateData[n]?.center;
        if (!c) return;
        const sl = L.polyline([b, c], {
            color: '#1565C0', weight: 1.5, opacity: .5, dashArray: '5 6'
        }).addTo(map);
        arrowLayers.push(sl);
    });
}

// Tooltip
function showTooltip(e, code) {
    const s = stateData[code];
    if (!s) return;
    const t = getStateTemp(code);
    const r = s.baseRain + (sourceRegion === code ? rainDelta * 2 : 0);
    const delta = t - s.baseTemp;
    document.getElementById('ttName').textContent = s.label;
    document.getElementById('ttTemp').textContent = t.toFixed(1) + '°C';
    document.getElementById('ttRain').textContent = r + ' mm/day';
    document.getElementById('ttAnom').textContent = (delta >= 0 ? '+' : '') + delta.toFixed(1) + '°C';
    const tt = document.getElementById('stateTooltip');
    const cont = document.querySelector('.map-wrap');
    const rect = cont.getBoundingClientRect();
    tt.style.display = 'block';
    tt.style.left = (e.originalEvent.clientX - rect.left + 12) + 'px';
    tt.style.top = (e.originalEvent.clientY - rect.top - 60) + 'px';
}

// ─── CANVAS PHENOMENA ──────────────────────────────────────────────────
const canvas = document.getElementById('phenomenaCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const wrap = document.querySelector('.map-wrap');
    canvas.width = wrap.offsetWidth;
    canvas.height = wrap.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', () => { resizeCanvas(); });

// roundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        this.beginPath();
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y); this.arcTo(x + w, y, x + w, y + r, r);
        this.lineTo(x + w, y + h - r); this.arcTo(x + w, y + h, x + w - r, y + h, r);
        this.lineTo(x + r, y + h); this.arcTo(x, y + h, x, y + h - r, r);
        this.lineTo(x, y + r); this.arcTo(x, y, x + r, y, r);
        this.closePath();
    };
}

// Convert lat/lng to canvas pixel
function latLngToXY(lat, lng) {
    const pt = map.latLngToContainerPoint([lat, lng]);
    return { x: pt.x, y: pt.y };
}

// ── HEATWAVE: subtle heat-shimmer tint only — map stays fully readable ──
function initHeatwaveParticles() {
    heatwaveParticles = [];
    const src = sourceRegion || 'RJ';
    const affected = getNeighbors(src, 1); // only source + direct neighbors
    affected.forEach(code => {
        const s = stateData[code];
        if (!s) return;
        const intensity = code === src ? 1.0 : 0.45;
        for (let i = 0; i < 6; i++) {
            heatwaveParticles.push({
                code,
                ox: (Math.random() - 0.5) * 1.8,
                oy: (Math.random() - 0.5) * 1.8,
                intensity,
                phase: Math.random() * Math.PI * 2,
                born: Date.now() - Math.random() * 3000,
                lifespan: 2500 + Math.random() * 2000,
            });
        }
    });
}

function drawHeatwave(t) {
    if (!layerState.temp) return;
    const src = sourceRegion || 'RJ';
    const affected = getNeighbors(src, 1);

    // 1. Very light warm tint over affected states — low alpha so map shows through
    affected.forEach(code => {
        const sd = stateData[code];
        if (!sd) return;
        const isSrc = code === src;
        const intensity = isSrc ? 1.0 : 0.4;
        const pt = latLngToXY(sd.center[0], sd.center[1]);
        const pulse = Math.sin(t * 0.0018 + sd.center[1] * 0.5) * 0.04;
        const baseAlpha = isSrc ? 0.18 + pulse : 0.09 + pulse * 0.5;

        // Soft elliptical tint — stays transparent enough to read map
        const rx = isSrc ? 130 : 95;
        const ry = isSrc ? 110 : 80;
        ctx.save();
        ctx.scale(1, ry / rx);
        const grad = ctx.createRadialGradient(pt.x, pt.y * rx / ry, 0, pt.x, pt.y * rx / ry, rx);
        if (isSrc) {
            grad.addColorStop(0, `rgba(255,80,0,${baseAlpha})`);
            grad.addColorStop(0.45, `rgba(255,140,0,${baseAlpha * 0.55})`);
            grad.addColorStop(0.75, `rgba(255,200,80,${baseAlpha * 0.2})`);
            grad.addColorStop(1, `rgba(255,200,80,0)`);
        } else {
            grad.addColorStop(0, `rgba(255,150,50,${baseAlpha})`);
            grad.addColorStop(0.5, `rgba(255,190,80,${baseAlpha * 0.4})`);
            grad.addColorStop(1, `rgba(255,190,80,0)`);
        }
        ctx.beginPath();
        ctx.arc(pt.x, pt.y * rx / ry, rx, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
    });

    // 2. Heat shimmer — thin wavy horizontal lines only over source, very subtle
    const srcData = stateData[src];
    if (srcData) {
        const pt = latLngToXY(srcData.center[0], srcData.center[1]);
        ctx.save();
        ctx.globalAlpha = 0.10;
        ctx.strokeStyle = '#FF7700';
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 10; i++) {
            const yy = pt.y - 70 + i * 14;
            ctx.beginPath();
            ctx.moveTo(pt.x - 80, yy);
            for (let x = 0; x <= 160; x += 6) {
                const wave = Math.sin((x * 0.12) + t * 0.04 + i * 1.3) * 4;
                ctx.lineTo(pt.x - 80 + x, yy + wave);
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    // 3. Small rising heat distortion dots — sparse, only over source
    heatwaveParticles.forEach(p => {
        const now = Date.now();
        if (now - p.born > p.lifespan) { p.born = now; p.lifespan = 2500 + Math.random() * 2000; }
        if (p.code !== src) return; // only source state gets particles
        const age = (now - p.born) / p.lifespan;
        const sd = stateData[p.code];
        if (!sd) return;
        const pt2 = latLngToXY(sd.center[0] + p.oy, sd.center[1] + p.ox);
        const rise = age * 35;
        const alpha = Math.sin(age * Math.PI) * 0.35 * p.intensity;
        ctx.beginPath();
        ctx.arc(pt2.x, pt2.y - rise, 4 + age * 6, 0, Math.PI * 2);
        const hg = ctx.createRadialGradient(pt2.x, pt2.y - rise, 0, pt2.x, pt2.y - rise, 4 + age * 6);
        hg.addColorStop(0, `rgba(255,100,0,${alpha})`);
        hg.addColorStop(1, `rgba(255,160,0,0)`);
        ctx.fillStyle = hg;
        ctx.fill();
    });
}

// ── RAIN: realistic storm cloud + rain only over source region ──
function initRainParticles() {
    rainParticles = [];
    for (let i = 0; i < 220; i++) {
        rainParticles.push({
            x: 0, y: 0, init: false,
            speed: 5 + Math.random() * 5,
            len: 9 + Math.random() * 10,
            alpha: 0.35 + Math.random() * 0.45,
            wx: (Math.random() - 0.5) * 1.5,
        });
    }
}

function drawRain(t) {
    if (!layerState.rain) return;
    const src = sourceRegion || 'MH';
    const sd = stateData[src];
    if (!sd) return;

    const pt = latLngToXY(sd.center[0], sd.center[1]);
    const CW = 200, CH = 180; // cloud + rain bounding box
    const cx0 = pt.x - CW / 2, cy0 = pt.y - CH * 0.55;

    ctx.save();
    // Clip to source-region ellipse only
    ctx.beginPath();
    ctx.ellipse(pt.x, pt.y, CW / 2 + 10, CH / 2 + 10, 0, 0, Math.PI * 2);
    ctx.clip();

    // ── Draw storm cloud shape (3 overlapping circles + dark base) ──
    const cloudY = cy0 + 20;
    // Cloud dark underbelly
    const bellyGrad = ctx.createLinearGradient(cx0, cloudY + 30, cx0, cloudY + 80);
    bellyGrad.addColorStop(0, 'rgba(60,80,110,0.72)');
    bellyGrad.addColorStop(1, 'rgba(40,60,90,0.10)');
    ctx.beginPath();
    ctx.ellipse(pt.x, cloudY + 55, CW * 0.48, 38, 0, 0, Math.PI * 2);
    ctx.fillStyle = bellyGrad;
    ctx.fill();

    // Main cloud puffs
    const puffs = [
        { ox: 0, oy: 0, r: 52 },
        { ox: -55, oy: 22, r: 38 },
        { ox: 55, oy: 22, r: 38 },
        { ox: -25, oy: 16, r: 44 },
        { ox: 28, oy: 14, r: 44 },
        { ox: 0, oy: 28, r: 42 },
    ];
    puffs.forEach(p => {
        const pg = ctx.createRadialGradient(pt.x + p.ox, cloudY + p.oy, 0, pt.x + p.ox, cloudY + p.oy, p.r);
        pg.addColorStop(0, 'rgba(90,110,145,0.82)');
        pg.addColorStop(0.6, 'rgba(70,90,125,0.65)');
        pg.addColorStop(1, 'rgba(60,80,115,0)');
        ctx.beginPath();
        ctx.arc(pt.x + p.ox, cloudY + p.oy, p.r, 0, Math.PI * 2);
        ctx.fillStyle = pg;
        ctx.fill();
    });

    // Lightning flash effect (random)
    if (Math.random() < 0.012) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = '#E8F4FF';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#B3D9FF';
        ctx.shadowBlur = 8;
        const lx = pt.x + (Math.random() - 0.5) * 80;
        const ly = cloudY + 55;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx - 8, ly + 22);
        ctx.lineTo(lx + 4, ly + 22);
        ctx.lineTo(lx - 10, ly + 48);
        ctx.stroke();
        ctx.restore();
    }

    // Rain streaks — confined inside clip
    const rainTop = cloudY + 70;
    const rainBot = pt.y + CH * 0.45;
    rainParticles.forEach(p => {
        if (!p.init || p.y > rainBot) {
            p.x = cx0 + Math.random() * CW;
            p.y = rainTop + Math.random() * 30;
            p.init = true;
        }
        p.y += p.speed;
        p.x += p.wx;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.wx * 1.5, p.y + p.len);
        ctx.strokeStyle = `rgba(140,200,255,${p.alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    });

    // Ground mist / splash at bottom
    const mistGrad = ctx.createLinearGradient(cx0, rainBot - 10, cx0, rainBot + 20);
    mistGrad.addColorStop(0, 'rgba(120,180,230,0.12)');
    mistGrad.addColorStop(1, 'rgba(120,180,230,0)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(cx0, rainBot - 10, CW, 30);

    ctx.restore();

    // Region label badge under cloud
    ctx.save();
    ctx.fillStyle = 'rgba(20,60,120,0.75)';
    ctx.beginPath();
    ctx.roundRect(pt.x - 42, pt.y + CH * 0.45 + 4, 84, 18, 9);
    ctx.fill();
    ctx.fillStyle = '#C8E6FF';
    ctx.font = 'bold 10px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ Heavy Rainfall', pt.x, pt.y + CH * 0.45 + 15);
    ctx.restore();
}

// ── CYCLONE: satellite-style spiral on ocean, coastal impact on land ──
function initCycloneParticles() {
    cycloneParticles = [];
    // Spiral arm particles
    for (let arm = 0; arm < 4; arm++) {
        for (let i = 0; i < 80; i++) {
            const frac = i / 80;
            cycloneParticles.push({
                arm,
                frac,
                baseAngle: arm * (Math.PI / 2) + frac * Math.PI * 3.5,
                baseRadius: 18 + frac * 155,
                alpha: (1 - frac) * 0.8,
                width: 4 + frac * 14,
                colorFrac: frac,
            });
        }
    }
}

// Coast states that feel cyclone effect (Bay of Bengal side)
const COAST_STATES = ['OD', 'WB', 'AP', 'TN', 'KL', 'MH', 'GA', 'GJ'];

function drawCyclone(t) {
    const src = sourceRegion || 'OD';
    const sd = stateData[src];
    if (!sd) return;

    // Place cyclone CENTER in the ocean near the coast of source state
    // Offset toward sea (east for east-coast states, west for west-coast)
    const isWestCoast = ['KL', 'KA', 'GA', 'MH', 'GJ', 'DD', 'DN'].includes(src);
    const oceanLat = sd.center[0] - 1.5;
    const oceanLng = isWestCoast ? sd.center[1] - 5.5 : sd.center[1] + 5.5;
    const op = latLngToXY(oceanLat, oceanLng);
    const cx = op.x, cy = op.y;

    const rot = t * 0.0012; // slow rotation

    // ── 1. Outer rain-band glow (like satellite IR false-color) ──
    const outerSize = 180;
    const outerGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, outerSize);
    outerGrad.addColorStop(0, 'rgba(220,90,20,0.0)');
    outerGrad.addColorStop(0.35, 'rgba(220,120,20,0.22)');
    outerGrad.addColorStop(0.6, 'rgba(160,200,60,0.18)');
    outerGrad.addColorStop(0.82, 'rgba(60,160,200,0.12)');
    outerGrad.addColorStop(1, 'rgba(20,100,180,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, outerSize, 0, Math.PI * 2);
    ctx.fillStyle = outerGrad;
    ctx.fill();

    // ── 2. Spiral arms (convective bands — red/orange like INSAT IR) ──
    ctx.save();
    cycloneParticles.forEach(p => {
        const angle = p.baseAngle + rot + p.arm * 0.02;
        const r = p.baseRadius;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r * 0.72; // slight ellipse

        // Color mimics INSAT thermal: cold tops = white/yellow, warm = orange/red
        const cf = p.colorFrac;
        let rc, gc, bc;
        if (cf < 0.25) { rc = 255; gc = 80 + cf * 400; bc = 0; }       // deep orange-red core
        else if (cf < 0.5) { rc = 255; gc = 180 + cf * 200; bc = 50; }  // yellow-orange
        else if (cf < 0.75) { rc = 180 - cf * 100; gc = 220; bc = 80; } // yellow-green
        else { rc = 80; gc = 160; bc = 220; }                         // blue-grey outer

        ctx.beginPath();
        ctx.arc(x, y, p.width * (0.6 + 0.4 * Math.sin(rot * 3 + p.frac * 8)), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.round(rc)},${Math.round(gc)},${Math.round(bc)},${p.alpha * 0.7})`;
        ctx.fill();
    });
    ctx.restore();

    // ── 3. Dense eye-wall ring ──
    const ewGrad = ctx.createRadialGradient(cx, cy, 14, cx, cy, 38);
    ewGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
    ewGrad.addColorStop(0.45, 'rgba(255,240,200,0.85)');
    ewGrad.addColorStop(0.7, 'rgba(255,160,60,0.5)');
    ewGrad.addColorStop(1, 'rgba(200,80,0,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.fillStyle = ewGrad;
    ctx.fill();

    // Eye — calm clear center
    const eyeGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 15);
    eyeGrad.addColorStop(0, 'rgba(255,255,255,1)');
    eyeGrad.addColorStop(0.6, 'rgba(220,235,255,0.9)');
    eyeGrad.addColorStop(1, 'rgba(160,200,255,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fillStyle = eyeGrad;
    ctx.fill();

    // ── 4. Cyclone label on ocean ──
    ctx.save();
    ctx.fillStyle = 'rgba(10,20,50,0.75)';
    ctx.beginPath();
    ctx.roundRect(cx - 55, cy + 195, 110, 22, 11);
    ctx.fill();
    ctx.fillStyle = '#FFE082';
    ctx.font = 'bold 10px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('🌀 Cyclone — Bay of Bengal', cx, cy + 209);
    ctx.restore();

    // ── 5. Coastal impact — wavy surge lines on coast states ──
    const coastAffected = COAST_STATES.filter(c =>
        !sourceRegion || c === src || (adjacency[src] || []).includes(c)
    ).slice(0, 5);

    coastAffected.forEach((code, idx) => {
        const csd = stateData[code];
        if (!csd) return;
        const cpt = latLngToXY(csd.center[0], csd.center[1]);
        const waveAlpha = code === src ? 0.30 : 0.14;
        const waveR = code === src ? 90 : 55;

        // Surge glow
        const surgeGrad = ctx.createRadialGradient(cpt.x, cpt.y, 0, cpt.x, cpt.y, waveR);
        surgeGrad.addColorStop(0, `rgba(100,150,255,${waveAlpha})`);
        surgeGrad.addColorStop(0.5, `rgba(80,120,220,${waveAlpha * 0.5})`);
        surgeGrad.addColorStop(1, 'rgba(60,100,200,0)');
        ctx.beginPath();
        ctx.arc(cpt.x, cpt.y, waveR, 0, Math.PI * 2);
        ctx.fillStyle = surgeGrad;
        ctx.fill();

        // Wave ring
        const ringR = waveR * 0.65 + Math.sin(t * 0.003 + idx) * 8;
        ctx.beginPath();
        ctx.arc(cpt.x, cpt.y, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(100,180,255,${waveAlpha * 1.2})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    });
}

// ── FOG ──
function initFogParticles() {
    fogParticles = [];
    for (let i = 0; i < 50; i++) {
        fogParticles.push({ x: Math.random(), y: Math.random(), r: 80 + Math.random() * 120, dx: .1 + Math.random() * .2, alpha: .06 + Math.random() * .10 });
    }
}

function drawFog(t) {
    const src = sourceRegion || 'HR';
    const sd = stateData[src];
    if (!sd) return;
    const pt = latLngToXY(sd.center[0], sd.center[1]);
    const W = canvas.width, H = canvas.height;
    fogParticles.forEach(p => {
        const x = pt.x - 150 + p.x * 300, y = pt.y - 100 + p.y * 200;
        const fg = ctx.createRadialGradient(x, y, 0, x, y, p.r + Math.sin(t * 0.001 + p.x * 10) * 10);
        fg.addColorStop(0, `rgba(210,230,240,${p.alpha})`);
        fg.addColorStop(1, 'rgba(210,230,240,0)');
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = fg;
        ctx.fill();
        p.x = (p.x + p.dx * 0.001) % 1;
    });
}

// Wind vectors
function drawWindVectors() {
    if (!layerState.wind || windDelta < 20) return;
    const arrows = Object.entries(stateData).slice(0, 14);
    arrows.forEach(([code, s]) => {
        const pt = latLngToXY(s.center[0], s.center[1]);
        const len = 20 + windDelta * 0.15;
        const ang = currentScenario === 'cyclone' ? Math.atan2(pt.y - canvas.height / 2, pt.x - canvas.width / 2) + 1.5 : -0.5;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x + Math.cos(ang) * len, pt.y + Math.sin(ang) * len);
        ctx.strokeStyle = 'rgba(100,150,200,0.5)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        // arrowhead
        const ex = pt.x + Math.cos(ang) * len, ey = pt.y + Math.sin(ang) * len;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + Math.cos(ang + 2.4) * 5, ey + Math.sin(ang + 2.4) * 5);
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + Math.cos(ang - 2.4) * 5, ey + Math.sin(ang - 2.4) * 5);
        ctx.stroke();
    });
}

// ── MAIN ANIMATION LOOP ──
function animate(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (currentScenario === 'heat') drawHeatwave(t);
    else if (currentScenario === 'rain') drawRain(t);
    else if (currentScenario === 'cyclone') drawCyclone(t);
    else if (currentScenario === 'fog') drawFog(t);
    drawWindVectors();
    animFrame = requestAnimationFrame(animate);
}

function startAnimation() {
    if (animFrame) cancelAnimationFrame(animFrame);
    if (currentScenario === 'heat') initHeatwaveParticles();
    else if (currentScenario === 'rain') initRainParticles();
    else if (currentScenario === 'cyclone') initCycloneParticles();
    else if (currentScenario === 'fog') initFogParticles();
    animFrame = requestAnimationFrame(animate);
}
startAnimation();

// ─── SCENARIO CONTROLS ─────────────────────────────────────────────────
function setScenario(s) {
    currentScenario = s;
    ['heat', 'rain', 'cyclone', 'fog'].forEach(x => {
        const btn = document.getElementById('btn-' + x);
        btn.className = 'scenario-btn' + (x === s ? ' active-' + x : '');
    });
    updateLegend();
    updateInfoBar();
    startAnimation();
}

function updateLegend() {
    const m = {
        heat: { title: 'Surface Temperature (°C)', bar: 'linear-gradient(90deg,#4FC3F7,#AED581,#FFF176,#FF7043,#B71C1C)', min: '15°C', mid: '30°C', max: '45°C' },
        rain: { title: 'Rainfall Intensity (mm/day)', bar: 'linear-gradient(90deg,#E3F2FD,#42A5F5,#1565C0,#0D47A1,#01002A)', min: '0', mid: '20', max: '50+' },
        cyclone: { title: 'Wind Speed (km/h)', bar: 'linear-gradient(90deg,#F3E5F5,#CE93D8,#9C27B0,#6A1B9A,#2D0045)', min: '0', mid: '100', max: '220+' },
        fog: { title: 'Visibility (km)', bar: 'linear-gradient(90deg,#263238,#607D8B,#90A4AE,#CFD8DC,#ECEFF1)', min: '0', mid: '2', max: '10+' },
    };
    const d = m[currentScenario];
    document.getElementById('legTitle').textContent = d.title;
    document.getElementById('legBar').style.background = d.bar;
    document.getElementById('legMin').textContent = d.min;
    document.getElementById('legMid').textContent = d.mid;
    document.getElementById('legMax').textContent = d.max;
}

// ─── INFO BAR ──────────────────────────────────────────────────────────
function updateInfoBar() {
    const src = stateData[sourceRegion];
    const tgt = stateData[targetRegion];
    document.getElementById('iSrc').textContent = src ? src.label : '—';
    document.getElementById('iTgt').textContent = tgt ? tgt.label : '—';
    const td = parseFloat(tempDelta) || 0;
    const el = document.getElementById('iAnomaly');
    el.textContent = (td >= 0 ? '+' : '') + td.toFixed(1) + '°C';
    el.className = 'info-val' + (td > 0 ? ' hot' : td < 0 ? ' rain' : '');
}

// ─── SOURCE DROPDOWN ──────────────────────────────────────────────────
document.getElementById('sourceRegion').addEventListener('change', function () {
    sourceRegion = this.value;
    updateMarkers();
    drawArrows(sourceRegion, targetRegion);
    updateInfoBar();
    startAnimation();
});
document.getElementById('targetRegion').addEventListener('change', function () {
    targetRegion = this.value;
    document.getElementById('rpTargetBadge').textContent = 'Target: ' + (stateData[targetRegion]?.label || targetRegion);
    drawArrows(sourceRegion, targetRegion);
    updateInfoBar();
    drawRightPanel();
});

function updateMarkers() {
    Object.entries(stateData).forEach(([code, s]) => {
        const t = getStateTemp(code);
        const col = tempToColor(t, code === sourceRegion ? 0.75 : code === targetRegion ? 0.65 : 0.5);
        stateMarkers[code].setStyle({ fillColor: col, fillOpacity: code === sourceRegion ? 0.75 : 0.5, color: code === sourceRegion ? '#E65100' : code === targetRegion ? '#1565C0' : 'rgba(100,130,180,0.4)', weight: code === sourceRegion || code === targetRegion ? 2 : 1 });
    });
}

// ─── LAYER TOGGLES ─────────────────────────────────────────────────────
function toggleLayer(name) {
    layerState[name] = !layerState[name];
    const el = document.getElementById('tog-' + name);
    el.classList.toggle('on', layerState[name]);
    if (name === 'temp') { Object.values(stateMarkers).forEach(m => m.setStyle({ fillOpacity: layerState.temp ? 0.55 : 0 })); }
}

// ─── MINI MAPS ─────────────────────────────────────────────────────────
function drawMiniMap(canvasId, simulated) {
    const c = document.getElementById(canvasId);
    if (!c) return;
    const cx = c.getContext('2d');
    c.width = 110; c.height = 80;
    cx.fillStyle = '#f0f4f8'; cx.fillRect(0, 0, 110, 80);
    // Draw India outline approximation
    cx.fillStyle = '#e0e8f0'; cx.fillRect(10, 5, 90, 70);
    Object.entries(stateData).slice(0, 30).forEach(([code, s]) => {
        const nx = (s.center[1] - 68) * 1.8 + 5;
        const ny = (38 - s.center[0]) * 1.5 + 5;
        if (nx < 5 || nx > 105 || ny < 5 || ny > 75) return;
        const t = simulated ? getStateTemp(code) : s.baseTemp;
        cx.beginPath();
        cx.arc(nx, ny, 4, 0, Math.PI * 2);
        cx.fillStyle = tempToColor(t, 0.8);
        cx.fill();
        if (code === targetRegion) {
            cx.beginPath(); cx.arc(nx, ny, 6, 0, Math.PI * 2);
            cx.strokeStyle = '#1565C0'; cx.lineWidth = 1.5; cx.stroke();
        }
    });
}

// ─── FORECAST CHART ────────────────────────────────────────────────────
function drawForecastChart() {
    const c = document.getElementById('forecastChart');
    const cx = c.getContext('2d');
    const W = c.width = 256, H = c.height = 110;
    cx.clearRect(0, 0, W, H);
    const tgt = stateData[targetRegion];
    if (!tgt) return;
    const base = tgt.baseTemp;
    const baseArr = [base - 0.3, base + 0.2, base - 0.1, base + 0.4, base - 0.2];
    const simArr = baseArr.map((v, i) => v + (parseFloat(tempDelta) || 0) * (0.5 + i * 0.1));
    const pad = 28, bw = W - pad * 2, bh = H - pad * 1.5;
    const minV = Math.min(...baseArr, ...simArr) - 1, maxV = Math.max(...baseArr, ...simArr) + 1;
    const toX = i => pad + i * (bw / 4);
    const toY = v => H - pad * 0.5 - (v - minV) / (maxV - minV) * bh;
    // Grid
    cx.strokeStyle = 'rgba(0,0,0,0.08)'; cx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = H - pad * 0.5 - i * (bh / 4);
        cx.beginPath(); cx.moveTo(pad, y); cx.lineTo(W - pad, y); cx.stroke();
    }
    // Labels
    cx.fillStyle = '#7a90a8'; cx.font = '9px Segoe UI'; cx.textAlign = 'center';
    ['t+1', 't+2', 't+3', 't+4', 't+5'].forEach((l, i) => cx.fillText(l, toX(i), H - 4));
    cx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) cx.fillText((minV + i * (maxV - minV) / 4).toFixed(1), pad - 2, H - pad * 0.5 - i * (bh / 4) + 3);
    // Baseline
    cx.beginPath(); cx.strokeStyle = '#1565C0'; cx.lineWidth = 2;
    baseArr.forEach((v, i) => i ? cx.lineTo(toX(i), toY(v)) : cx.moveTo(toX(i), toY(v)));
    cx.stroke();
    baseArr.forEach((v, i) => {
        cx.beginPath(); cx.arc(toX(i), toY(v), 3, 0, Math.PI * 2);
        cx.fillStyle = '#1565C0'; cx.fill();
        cx.fillStyle = '#1565C0'; cx.font = '8px Segoe UI'; cx.textAlign = 'center';
        cx.fillText(v.toFixed(1), toX(i), toY(v) - 6);
    });
    // Simulated
    cx.beginPath(); cx.strokeStyle = '#E65100'; cx.lineWidth = 2;
    simArr.forEach((v, i) => i ? cx.lineTo(toX(i), toY(v)) : cx.moveTo(toX(i), toY(v)));
    cx.stroke();
    simArr.forEach((v, i) => {
        cx.beginPath(); cx.arc(toX(i), toY(v), 3, 0, Math.PI * 2);
        cx.fillStyle = '#E65100'; cx.fill();
        cx.fillStyle = '#E65100'; cx.font = '8px Segoe UI'; cx.textAlign = 'center';
        cx.fillText(v.toFixed(1), toX(i), toY(v) - 6);
    });
}

// ─── RIGHT PANEL UPDATE ────────────────────────────────────────────────
function drawRightPanel() {
    drawMiniMap('miniBaseline', false);
    drawMiniMap('miniSimulated', true);
    drawForecastChart();
}
drawRightPanel();

// ─── RISK / IMPACT UPDATE (DYNAMICALLY UPDATED VIA BACKEND) ────────────
function updateRiskBars(apiData = null) {
    let r;
    if (apiData) {
        // Use live data from FastAPI!
        r = {
            heat: apiData.analytics.riskProbabilities.heatwave,
            flood: apiData.analytics.riskProbabilities.flood,
            cyclone: apiData.analytics.riskProbabilities.cyclone,
            cold: apiData.analytics.riskProbabilities.coldwave
        };
    } else {
        // Fallback placeholder data if API hasn't run yet
        const risks = {
            heat: { heat: 72, flood: 15, cyclone: 5, cold: 3 },
            rain: { heat: 8, flood: 78, cyclone: 12, cold: 10 },
            cyclone: { heat: 12, flood: 55, cyclone: 85, cold: 5 },
            fog: { heat: 5, flood: 8, cyclone: 2, cold: 70 },
        };
        r = risks[currentScenario];
    }
    
    function setRisk(id, barId, val, col) {
        document.getElementById(id).textContent = val + '%';
        document.getElementById(barId).style.width = val + '%';
        document.getElementById(barId).style.background = col;
    }
    setRisk('riskHeat', 'rfHeat', r.heat, '#FF3D00');
    setRisk('riskFlood', 'rfFlood', r.flood, '#0288D1');
    setRisk('riskCyclone', 'rfCyclone', r.cyclone, '#6A1B9A');
    setRisk('riskCold', 'rfCold', r.cold, '#546E7A');
}

function updateImpacts(apiData = null) {
    let im;
    
    function getCssClass(val) {
        if (val > 0) return 'pos';
        if (val < -10) return 'neg';
        return 'warn';
    }

    if (apiData) {
        // Use live data from FastAPI!
        const imp = apiData.analytics.sectorImpacts;
        im = {
            agri: (imp.agriculture > 0 ? '+' : '') + imp.agriculture + '%', ac: getCssClass(imp.agriculture),
            water: (imp.waterResources > 0 ? '+' : '') + imp.waterResources + '%', wc: getCssClass(imp.waterResources),
            energy: (imp.energy > 0 ? '+' : '') + imp.energy + '%', ec: getCssClass(imp.energy),
            health: (imp.health > 0 ? '+' : '') + imp.health + '%', hc: getCssClass(imp.health)
        };
    } else {
        const impacts = {
            heat: { agri: '-9%', water: '-15%', energy: '+22%', health: '-18%', ac: 'neg', wc: 'neg', ec: 'pos', hc: 'neg' },
            rain: { agri: '+12%', water: '+18%', energy: '-8%', health: '-10%', ac: 'pos', wc: 'pos', ec: 'warn', hc: 'warn' },
            cyclone: { agri: '-25%', water: '-20%', energy: '-30%', health: '-35%', ac: 'neg', wc: 'neg', ec: 'neg', hc: 'neg' },
            fog: { agri: '-5%', water: '+2%', energy: '+8%', health: '-6%', ac: 'warn', wc: 'pos', ec: 'warn', hc: 'warn' },
        };
        im = impacts[currentScenario];
    }
    
    document.getElementById('impAgri').textContent = im.agri; document.getElementById('impAgri').className = 'impact-val ' + im.ac;
    document.getElementById('impWater').textContent = im.water; document.getElementById('impWater').className = 'impact-val ' + im.wc;
    document.getElementById('impEnergy').textContent = im.energy; document.getElementById('impEnergy').className = 'impact-val ' + im.ec;
    document.getElementById('impHealth').textContent = im.health; document.getElementById('impHealth').className = 'impact-val ' + im.hc;
}

// ─── SIMULATION RUN ────────────────────────────────────────────────────
function runSimulation() {
    if (simRunning) return;
    if (!sourceRegion) { addNewsCard('⚠️ Please select a source region first.', 'info'); return; }
    
    simRunning = true;
    const btn = document.getElementById('runBtn');
    btn.classList.add('running');
    btn.innerHTML = '<span>⟳</span> Running ConvLSTM...';
    const badge = document.getElementById('simBadge');
    badge.style.display = 'block';

    // 1. FIRE THE FETCH REQUEST TO THE FASTAPI BACKEND (PORT 8000)
    fetch('http://127.0.0.1:8000/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sourceRegion: sourceRegion,
            targetRegion: targetRegion,
            currentScenario: currentScenario,
            tempDelta: parseFloat(tempDelta),
            rainDelta: parseInt(rainDelta),
            windDelta: parseInt(windDelta)
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log("Data received from FastAPI backend:", data);

        // 2. Play the visual animation timer
        let day = 0;
        const interval = setInterval(() => {
            day++;
            badge.textContent = `🔄 ConvLSTM Forecasting — Day ${day} of 5`;
            
            if (day >= 5) {
                clearInterval(interval);
                simRunning = false;
                simHasRun = true;
                btn.classList.remove('running');
                btn.innerHTML = '<span>▶</span> Run Digital Twin Simulation';
                badge.style.display = 'none';
                document.getElementById('diffPill').style.display = 'block';
                
                // --- UI UPDATES WITH LIVE FASTAPI DATA ---
                updateMarkers();
                drawArrows(sourceRegion, targetRegion);
                updateInfoBar();
                
                // Pass the real data from Python to the UI functions!
                updateRiskBars(data); 
                updateImpacts(data);  
                
                drawRightPanel(); 
                startAnimation();
                
                // News Cards
                const srcLabel = stateData[sourceRegion]?.label || sourceRegion;
                const tgtLabel = stateData[targetRegion]?.label || targetRegion;
                const td = parseFloat(tempDelta) || 0;
                
                addNewsCard(`✅ Simulation complete. ${srcLabel} anomaly of ${(td >= 0 ? '+' : '') + td.toFixed(1)}°C propagated to ${tgtLabel} (${(td * 0.55).toFixed(1)}°C delta).`, currentScenario === 'heat' ? 'heat' : currentScenario === 'rain' ? 'rain' : currentScenario === 'cyclone' ? 'cyclone' : 'info');
                if (currentScenario === 'heat' && td > 0.8) addNewsCard(`🔥 IMD Alert: Severe heatwave conditions likely in ${tgtLabel} within 48hrs.`, 'heat');
                if (currentScenario === 'rain') addNewsCard(`🌧 IMD: Heavy rainfall advisory issued for ${tgtLabel} and adjoining districts.`, 'rain');
            }
        }, 600); // Faster visual delay for 5 days
    })
    .catch(err => {
        console.error("Backend Error:", err);
        addNewsCard('⚠️ Error: Could not connect to FastAPI backend. Is it running?', 'heat');
        simRunning = false;
        btn.classList.remove('running');
        btn.innerHTML = '<span>▶</span> Run Digital Twin Simulation';
        badge.style.display = 'none';
    });
}

function addNewsCard(msg, type) {
    const feed = document.getElementById('newsFeed');
    const card = document.createElement('div');
    card.className = 'news-card ' + type;
    const sources = { heat: 'IMD-NHAC', rain: 'IMD-MCS', cyclone: 'IMD-CWC', info: 'SYSTEM' };
    card.innerHTML = `<span class="news-source">${sources[type] || 'SYSTEM'} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>${msg}`;
    feed.insertBefore(card, feed.firstChild);
}

// ─── TIMELINE ──────────────────────────────────────────────────────────
function setDay(d) {
    timelineDay = d;
    const pct = d / 4 * 100;
    document.getElementById('tlFill').style.width = pct + '%';
    document.getElementById('tlThumb').style.left = pct + '%';
    document.getElementById('tlDayCounter').textContent = `Day ${d + 1} / 5`;
    document.querySelectorAll('.tl-day').forEach((el, i) => el.classList.toggle('active', i === d));
}
document.querySelectorAll('.tl-day').forEach((el, i) => el.addEventListener('click', () => setDay(i)));

function togglePlay() {
    tlPlaying = !tlPlaying;
    document.getElementById('tlPlay').textContent = tlPlaying ? '⏸' : '▶';
    if (tlPlaying) {
        tlInterval = setInterval(() => { setDay((timelineDay + 1) % 5); }, 800);
    } else {
        clearInterval(tlInterval);
    }
}

// ─── CLOCK ─────────────────────────────────────────────────────────────
function updateClock() {
    const now = new Date();
    const ist = new Date(now.getTime() + ((5.5 * 60 - now.getTimezoneOffset()) * 60000));
    document.getElementById('clock').textContent = ist.toUTCString().slice(-12, -4) + ' IST';
}
updateClock(); setInterval(updateClock, 1000);

// ─── INIT ──────────────────────────────────────────────────────────────
updateLegend();
updateRiskBars();
updateImpacts();
setDay(0);

// map re-render on move
map.on('move zoom', () => {
    updateMarkers();
});
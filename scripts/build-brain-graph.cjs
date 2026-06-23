#!/usr/bin/env node
/**
 * build-brain-graph.js
 * Legge graphify-out/graph.json, campiona i nodi più connessi,
 * li raggruppa per comunità e genera public/brain-graph.html
 */

const fs = require('fs');
const path = require('path');

const MAX_NODES = 600;       // nodi da mostrare
const MAX_EDGES = 1200;      // archi max

console.log('📊 Lettura graph.json...');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '../graphify-out/graph.json'), 'utf8'));

const allNodes = raw.nodes || [];
const allEdges = raw.links || [];

// --- calcola degree per ogni nodo ---
const degree = {};
allNodes.forEach(n => { degree[n.id] = 0; });
allEdges.forEach(e => {
  if (degree[e.source] !== undefined) degree[e.source]++;
  if (degree[e.target] !== undefined) degree[e.target]++;
});

// --- prendi top N nodi per degree ---
const sorted = [...allNodes].sort((a, b) => (degree[b.id] || 0) - (degree[a.id] || 0));
const topNodes = sorted.slice(0, MAX_NODES);
const topIds = new Set(topNodes.map(n => n.id));

// --- filtra archi tra nodi selezionati ---
const topEdges = allEdges
  .filter(e => topIds.has(e.source) && topIds.has(e.target))
  .slice(0, MAX_EDGES);

// --- comunità: assegna un colore indice numerico ---
const communitySet = [...new Set(topNodes.map(n => n.community))];
const communityIndex = {};
communitySet.forEach((c, i) => { communityIndex[c] = i; });

// --- palette comunità (top 20, resto grigio) ---
const palette = [
  '#818cf8','#f472b6','#34d399','#fbbf24','#60a5fa',
  '#f87171','#a78bfa','#2dd4bf','#fb923c','#e879f9',
  '#4ade80','#38bdf8','#facc15','#c084fc','#86efac',
  '#67e8f9','#fda4af','#a5b4fc','#6ee7b7','#fcd34d'
];

// --- prepara dati per D3 ---
const nodes = topNodes.map(n => ({
  id: n.id,
  label: n.label || n.id,
  type: n.file_type || 'concept',
  community: n.community,
  communityIdx: communityIndex[n.community] % palette.length,
  degree: degree[n.id] || 0,
  source_file: n.source_file || ''
}));

const links = topEdges.map(e => ({
  source: e.source,
  target: e.target,
  relation: e.relation || 'relates'
}));

const graphData = { nodes, links, palette };
const graphDataJson = JSON.stringify(graphData);

console.log(`✅ Nodi: ${nodes.length} | Archi: ${links.length} | Comunità: ${communitySet.length}`);

// -----------------------------------------------
// HTML template con D3 v7 inline (CDN) + dark theme
// -----------------------------------------------
const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>🧠 Fleet-Flow Knowledge Graph</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0a0a14;color:#e2e8f0;font-family:'Inter',system-ui,sans-serif;overflow:hidden;height:100vh;width:100vw}
  #canvas{width:100%;height:100%}
  #ui{position:fixed;top:0;left:0;right:0;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:linear-gradient(180deg,rgba(10,10,20,.95) 0%,transparent 100%)}
  h1{font-size:1rem;font-weight:700;background:linear-gradient(135deg,#818cf8,#f472b6);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  #stats{font-size:.75rem;color:#64748b;display:flex;gap:16px}
  .stat{display:flex;flex-direction:column;align-items:center}
  .stat span:first-child{font-size:1rem;font-weight:700;color:#94a3b8}
  #controls{display:flex;gap:8px;align-items:center}
  button{background:rgba(129,140,248,.15);border:1px solid rgba(129,140,248,.3);color:#818cf8;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:.75rem;transition:all .2s}
  button:hover{background:rgba(129,140,248,.3)}
  #tooltip{position:fixed;pointer-events:none;background:rgba(15,15,30,.95);border:1px solid rgba(129,140,248,.4);border-radius:10px;padding:10px 14px;font-size:.8rem;max-width:260px;backdrop-filter:blur(12px);display:none;z-index:100}
  #tooltip strong{color:#818cf8;display:block;margin-bottom:4px}
  #tooltip .t-type{display:inline-block;font-size:.7rem;padding:2px 7px;border-radius:20px;margin-bottom:6px;background:rgba(129,140,248,.2);color:#a5b4fc}
  #legend{position:fixed;bottom:16px;left:16px;z-index:10;display:flex;flex-direction:column;gap:4px;background:rgba(10,10,20,.8);border:1px solid rgba(129,140,248,.15);border-radius:10px;padding:10px 14px;backdrop-filter:blur(8px)}
  #legend h3{font-size:.7rem;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
  .legend-item{display:flex;align-items:center;gap:6px;font-size:.72rem;color:#94a3b8}
  .legend-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
  #search{background:rgba(255,255,255,.05);border:1px solid rgba(129,140,248,.3);color:#e2e8f0;padding:5px 10px;border-radius:6px;font-size:.75rem;width:160px;outline:none}
  #search::placeholder{color:#475569}
  #search:focus{border-color:#818cf8;background:rgba(129,140,248,.1)}
  #info-panel{position:fixed;right:16px;top:60px;width:240px;background:rgba(10,10,20,.9);border:1px solid rgba(129,140,248,.2);border-radius:12px;padding:14px;backdrop-filter:blur(12px);display:none;z-index:10}
  #info-panel h4{color:#818cf8;font-size:.85rem;margin-bottom:8px;border-bottom:1px solid rgba(129,140,248,.15);padding-bottom:6px}
  #info-panel p{font-size:.75rem;color:#94a3b8;line-height:1.6}
  #info-panel .close-btn{position:absolute;top:8px;right:10px;cursor:pointer;color:#64748b;font-size:1rem}
  .highlight{stroke:#fbbf24!important;stroke-width:3!important}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>

<div id="ui">
  <h1>🧠 Fleet-Flow Knowledge Graph</h1>
  <div id="stats">
    <div class="stat"><span id="s-nodes">—</span><span>nodi</span></div>
    <div class="stat"><span id="s-edges">—</span><span>archi</span></div>
    <div class="stat"><span id="s-comm">—</span><span>cluster</span></div>
  </div>
  <div id="controls">
    <input id="search" type="text" placeholder="🔍 Cerca nodo…"/>
    <button id="btn-reset">↺ Reset</button>
    <button id="btn-labels">Etichette</button>
  </div>
</div>

<svg id="canvas"></svg>

<div id="tooltip"></div>

<div id="legend">
  <h3>Tipo nodo</h3>
  <div class="legend-item"><div class="legend-dot" style="background:#818cf8"></div>Code</div>
  <div class="legend-item"><div class="legend-dot" style="background:#34d399"></div>Document</div>
  <div class="legend-item"><div class="legend-dot" style="background:#fbbf24"></div>Concept</div>
  <div class="legend-item"><div class="legend-dot" style="background:#f472b6"></div>Image</div>
</div>

<div id="info-panel">
  <span class="close-btn" id="close-panel">✕</span>
  <h4 id="panel-title">—</h4>
  <p id="panel-body">—</p>
</div>

<script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
<script>
const GRAPH = ${graphDataJson};

const typeColor = {
  code:     '#818cf8',
  document: '#34d399',
  concept:  '#fbbf24',
  rationale:'#fb923c',
  image:    '#f472b6'
};

const w = window.innerWidth, h = window.innerHeight;
let showLabels = false;

const svg = d3.select('#canvas')
  .attr('width', w).attr('height', h);

// gradient background glow
const defs = svg.append('defs');
const radial = defs.append('radialGradient').attr('id','bg-glow')
  .attr('cx','50%').attr('cy','50%').attr('r','60%');
radial.append('stop').attr('offset','0%').attr('stop-color','#1e1b4b').attr('stop-opacity',.6);
radial.append('stop').attr('offset','100%').attr('stop-color','#0a0a14').attr('stop-opacity',1);
svg.append('rect').attr('width',w).attr('height',h).attr('fill','url(#bg-glow)');

// arrow marker
defs.append('marker').attr('id','arrow').attr('viewBox','0 -5 10 10')
  .attr('refX',18).attr('refY',0).attr('markerWidth',4).attr('markerHeight',4)
  .attr('orient','auto')
  .append('path').attr('d','M0,-5L10,0L0,5').attr('fill','rgba(129,140,248,.3)');

const g = svg.append('g');

// zoom
const zoom = d3.zoom().scaleExtent([.05, 8])
  .on('zoom', e => g.attr('transform', e.transform));
svg.call(zoom);

// simulation
const sim = d3.forceSimulation(GRAPH.nodes)
  .force('link', d3.forceLink(GRAPH.links).id(d=>d.id).distance(d=>60).strength(.4))
  .force('charge', d3.forceManyBody().strength(-120).distanceMax(300))
  .force('center', d3.forceCenter(w/2, h/2).strength(.05))
  .force('collision', d3.forceCollide().radius(d => nodeRadius(d)+4))
  .alphaDecay(.015);

function nodeRadius(d){ return Math.max(4, Math.min(18, 4 + Math.sqrt(d.degree)*1.4)); }

// edges
const link = g.append('g').attr('class','links')
  .selectAll('line').data(GRAPH.links).join('line')
  .attr('stroke','rgba(129,140,248,.18)')
  .attr('stroke-width',.8)
  .attr('marker-end','url(#arrow)');

// nodes
const node = g.append('g').attr('class','nodes')
  .selectAll('circle').data(GRAPH.nodes).join('circle')
  .attr('r', d => nodeRadius(d))
  .attr('fill', d => typeColor[d.type] || '#818cf8')
  .attr('fill-opacity',.85)
  .attr('stroke', d => typeColor[d.type] || '#818cf8')
  .attr('stroke-width',.5)
  .attr('stroke-opacity',.4)
  .style('cursor','pointer')
  .call(d3.drag()
    .on('start', (e,d)=>{ if(!e.active) sim.alphaTarget(.2).restart(); d.fx=d.x; d.fy=d.y; })
    .on('drag',  (e,d)=>{ d.fx=e.x; d.fy=e.y; })
    .on('end',   (e,d)=>{ if(!e.active) sim.alphaTarget(0); d.fx=null; d.fy=null; })
  )
  .on('mouseover', showTooltip)
  .on('mousemove', moveTooltip)
  .on('mouseout',  hideTooltip)
  .on('click', onNodeClick);

// labels
const label = g.append('g').attr('class','labels')
  .selectAll('text').data(GRAPH.nodes).join('text')
  .text(d => d.label.length > 22 ? d.label.slice(0,20)+'…' : d.label)
  .attr('font-size', d => Math.max(8, nodeRadius(d)*.9)+'px')
  .attr('fill','#cbd5e1')
  .attr('fill-opacity', showLabels ? .9 : 0)
  .attr('text-anchor','middle')
  .attr('dy','-.5em')
  .attr('pointer-events','none');

sim.on('tick', () => {
  link
    .attr('x1', d=>d.source.x).attr('y1', d=>d.source.y)
    .attr('x2', d=>d.target.x).attr('y2', d=>d.target.y);
  node.attr('cx', d=>d.x).attr('cy', d=>d.y);
  label.attr('x', d=>d.x).attr('y', d=>d.y);
});

// stats
document.getElementById('s-nodes').textContent = GRAPH.nodes.length;
document.getElementById('s-edges').textContent = GRAPH.links.length;
const comms = new Set(GRAPH.nodes.map(n=>n.community)).size;
document.getElementById('s-comm').textContent = comms;

// tooltip
const tooltip = document.getElementById('tooltip');
function showTooltip(e, d){
  tooltip.style.display='block';
  tooltip.innerHTML = \`<strong>\${d.label}</strong>
    <span class="t-type">\${d.type}</span>
    <div>Degree: <b>\${d.degree}</b></div>
    <div style="color:#64748b;margin-top:4px;font-size:.7rem">\${d.source_file||''}</div>\`;
}
function moveTooltip(e){ tooltip.style.left=(e.clientX+14)+'px'; tooltip.style.top=(e.clientY-10)+'px'; }
function hideTooltip(){ tooltip.style.display='none'; }

// info panel on click
function onNodeClick(e, d){
  const panel = document.getElementById('info-panel');
  document.getElementById('panel-title').textContent = d.label;
  const neighbors = GRAPH.links
    .filter(l => l.source.id===d.id||l.target.id===d.id)
    .map(l => l.source.id===d.id ? l.target.label : l.source.label)
    .slice(0,8).join(', ');
  document.getElementById('panel-body').innerHTML =
    \`<b>Tipo:</b> \${d.type}<br>
     <b>Degree:</b> \${d.degree}<br>
     <b>Comunità:</b> \${d.community}<br>
     <b>File:</b> \${d.source_file||'—'}<br>
     <b>Connesso a:</b> \${neighbors||'—'}\`;
  panel.style.display='block';
  // highlight neighbors
  const nIds = new Set(GRAPH.links
    .filter(l=>l.source.id===d.id||l.target.id===d.id)
    .flatMap(l=>[l.source.id,l.target.id]));
  node.attr('fill-opacity', n => nIds.has(n.id)||n.id===d.id ? 1 : .15);
  link.attr('stroke-opacity', l => l.source.id===d.id||l.target.id===d.id ? .8 : .05)
    .attr('stroke-width', l => l.source.id===d.id||l.target.id===d.id ? 1.5 : .8);
  e.stopPropagation();
}

svg.on('click', () => {
  node.attr('fill-opacity',.85);
  link.attr('stroke-opacity',1).attr('stroke-width',.8);
  document.getElementById('info-panel').style.display='none';
});
document.getElementById('close-panel').onclick = () => {
  document.getElementById('info-panel').style.display='none';
  node.attr('fill-opacity',.85);
  link.attr('stroke-opacity',1).attr('stroke-width',.8);
};

// reset zoom
document.getElementById('btn-reset').onclick = () => {
  svg.transition().duration(700).call(zoom.transform, d3.zoomIdentity.translate(w/2,h/2).scale(1));
  sim.alpha(.4).restart();
};

// toggle labels
document.getElementById('btn-labels').onclick = () => {
  showLabels = !showLabels;
  label.attr('fill-opacity', showLabels ? .9 : 0);
};

// search
document.getElementById('search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase().trim();
  if(!q){ node.attr('fill-opacity',.85); link.attr('stroke-opacity',1); return; }
  const matched = new Set(GRAPH.nodes.filter(n=>n.label.toLowerCase().includes(q)).map(n=>n.id));
  node.attr('fill-opacity', d => matched.has(d.id) ? 1 : .08);
  link.attr('stroke-opacity', l => matched.has(l.source.id)||matched.has(l.target.id) ? .5 : .03);
  if(matched.size===1){
    const found = GRAPH.nodes.find(n=>matched.has(n.id));
    if(found && found.x){
      svg.transition().duration(600).call(zoom.transform,
        d3.zoomIdentity.translate(w/2-found.x*2, h/2-found.y*2).scale(2));
    }
  }
});

// particle background effect (slow drift of faint dots)
const pCanvas = document.createElement('canvas');
pCanvas.style.cssText='position:fixed;top:0;left:0;pointer-events:none;opacity:.3;z-index:0';
pCanvas.width=w; pCanvas.height=h;
document.body.prepend(pCanvas);
const ctx = pCanvas.getContext('2d');
const particles = Array.from({length:80},()=>({
  x:Math.random()*w, y:Math.random()*h,
  r:Math.random()*1.5+.5, vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3,
  a:Math.random()*.5+.2
}));
(function animateParticles(){
  ctx.clearRect(0,0,w,h);
  particles.forEach(p=>{
    p.x+=p.vx; p.y+=p.vy;
    if(p.x<0)p.x=w; if(p.x>w)p.x=0;
    if(p.y<0)p.y=h; if(p.y>h)p.y=0;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle=\`rgba(129,140,248,\${p.a})\`; ctx.fill();
  });
  requestAnimationFrame(animateParticles);
})();
</script>
</body>
</html>`;

const outPath = path.join(__dirname, '../public/brain-graph.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log(`\n🚀 Generato: public/brain-graph.html`);
console.log(`   Aprilo su: http://localhost:5173/brain-graph.html`);

// ...existing code...
// Utilities & state
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const LS_NEWS = 'snn_news_cards_v1';
const LS_EVENTS = 'snn_event_cards_v1';
const LS_CHANGE = 'snn_changelog_v1';

// Demo data (same as before)
const DEMO_NEWS = [
  {title:'Record-breaking stream peaks', excerpt:'Neuro hits a new high during her latest variety stream.', media:'https://placehold.co/640x360/png?text=Neuro+Stream', badge:'New', tag:'Stream', link:'#'},
  {title:'Collab announced', excerpt:'A multiverse collab with surprise guests teased on Twitter.', media:'https://placehold.co/640x360/png?text=Collab+Tease', badge:'Update', tag:'Collab', link:'#'},
  {title:'Original song preview', excerpt:'A short snippet dropped — fans speculate on full release date.', media:'https://placehold.co/640x360/png?text=Song+Preview', badge:'Teaser', tag:'Music', link:'#'}
];
const DEMO_EVENTS = [
  {title:'Limited Shop Drop', excerpt:'Exclusive merch available this weekend only.', media:'https://placehold.co/640x360/png?text=Shop+Drop', badge:'Shop', tag:'Merch', link:'#'},
  {title:'Community Art Contest', excerpt:'Submit fan art and get featured!', media:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', badge:'Contest', tag:'Art', link:'#'}
];

function loadLS(key, fallback){
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function saveLS(key, val){ try { localStorage.setItem(key, JSON.stringify(val)); } catch(e){ console.warn('LS save failed', e); } }

let newsCards = loadLS(LS_NEWS, DEMO_NEWS);
let eventCards = loadLS(LS_EVENTS, DEMO_EVENTS);

// Routing
function setActiveRoute(hash){
  const route = (hash || '#news').replace('#','');
  $$('.nav-links a').forEach(a=>a.classList.toggle('active', a.getAttribute('href') === '#'+route));
  $$('.page').forEach(p=>p.classList.remove('active'));
  const page = document.getElementById(route);
  if(page) page.classList.add('active');
}
window.addEventListener('hashchange', ()=> setActiveRoute(location.hash));

// Render helpers
function isYouTube(url){ return /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/i.test(url); }
function ytToEmbed(url){
  try{
    const u = new URL(url);
    if(u.hostname.includes('youtu.be')){ return `https://www.youtube.com/embed/${u.pathname.slice(1)}`; }
    const id = u.searchParams.get('v');
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }catch{ return url; }
}

let loggedIn = false;

function cardTemplate(item, type, index){
  const media = isYouTube(item.media)
    ? `<div class="thumb"><iframe src="${ytToEmbed(item.media)}" title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe></div>`
    : `<div class="thumb"><img src="${item.media}" alt="Thumbnail" onerror="this.src='https://placehold.co/640x360/png?text=SNN'" loading="lazy"/></div>`;
  const badge = item.badge ? `<span class="badge">${item.badge}</span>` : '';
  const tag = item.tag ? `<span class="tag">${item.tag}</span>` : '';
  const link = item.link ? `<a class="btn btn-primary" href="${item.link}" target="_blank" rel="noopener">Open</a>` : '';
  const adminBtns = loggedIn ? `<button class="btn btn-ghost" onclick="editCard('${type}', ${index})" aria-label="Edit card">Edit</button>
                               <button class="btn btn-ghost" onclick="deleteCard('${type}', ${index})" aria-label="Delete card">Delete</button>` : '';
  return `
    <article class="card" tabindex="0" data-type="${type}" data-index="${index}">
      <div class="thumb">${media}${badge}</div>
      <div class="card-body">
        <div class="card-title">${item.title}</div>
        <div class="card-text">${item.excerpt || ''}</div>
        <div class="card-actions">${tag}${link}${adminBtns}</div>
      </div>
    </article>
  `;
}

function renderNews(list = newsCards){
  const grid = document.getElementById('newsGrid');
  grid.innerHTML = list.map(item => {
    const idx = newsCards.indexOf(item);
    return cardTemplate(item, 'news', idx);
  }).join('');
}
function renderEvents(list = eventCards){
  const grid = document.getElementById('eventsGrid');
  grid.innerHTML = list.map(item => {
    const idx = eventCards.indexOf(item);
    return cardTemplate(item, 'events', idx);
  }).join('');
}

// Search
document.addEventListener('DOMContentLoaded', ()=>{
  const newsSearch = document.getElementById('newsSearch');
  if(newsSearch){
    newsSearch.addEventListener('input', (e)=>{
      const q = e.target.value.toLowerCase();
      const filtered = newsCards.filter(c =>
        (c.title||'').toLowerCase().includes(q) ||
        (c.excerpt||'').toLowerCase().includes(q) ||
        (c.tag||'').toLowerCase().includes(q)
      );
      renderNews(filtered);
    });
  }
});

// Admin UI & modals
const loginModal = () => document.getElementById('loginModal');
const addModal = () => document.getElementById('addModal');
function openModal(m){ if(m) m.classList.add('open'); }
function closeModal(m){
  if(!m) return;
  m.classList.remove('open');
  if(m === addModal()){
    delete addModal().dataset.editType;
    delete addModal().dataset.editIndex;
    document.getElementById('addForm').reset();
  }
}

document.addEventListener('click', (e)=>{
  if(e.target && e.target.id === 'loginBtn') openModal(loginModal());
  if(e.target && e.target.id === 'closeLogin') closeModal(loginModal());
  if(e.target && e.target.id === 'cancelLogin') closeModal(loginModal());
  if(e.target && e.target.id === 'addBtn'){ delete addModal().dataset.editType; delete addModal().dataset.editIndex; document.getElementById('addTitle').textContent='Add New Card'; document.getElementById('addForm').reset(); openModal(addModal()); }
  if(e.target && e.target.id === 'closeAdd') closeModal(addModal());
  if(e.target && e.target.id === 'cancelAdd') closeModal(addModal());
});

// Login flow (demo)
document.addEventListener('submit', (ev)=>{
  if(ev.target && ev.target.id === 'loginForm'){
    ev.preventDefault();
    const u = document.getElementById('user').value.trim();
    const p = document.getElementById('pass').value.trim();
    if(u==='admin' && p==='swarm'){
      loggedIn = true;
      document.getElementById('loginError').classList.add('hidden');
      closeModal(loginModal());
      document.getElementById('addBtn').classList.remove('hidden');
      document.getElementById('logoutBtn').classList.remove('hidden');
      document.getElementById('loginBtn').classList.add('hidden');
      renderNews(); renderEvents();
    } else {
      document.getElementById('loginError').classList.remove('hidden');
    }
  }

  // Add/Edit submit
  if(ev.target && ev.target.id === 'addForm'){
    ev.preventDefault();
    const item = {
      title: document.getElementById('title').value.trim(),
      excerpt: document.getElementById('excerpt').value.trim(),
      media: document.getElementById('media').value.trim(),
      badge: document.getElementById('badge').value.trim(),
      tag: document.getElementById('tag').value.trim(),
      link: document.getElementById('link').value.trim()
    };
    const type = document.getElementById('type').value;
    if(addModal().dataset.editType){
      const editType = addModal().dataset.editType;
      const idx = Number(addModal().dataset.editIndex);
      if(editType === 'news'){ newsCards[idx] = item; saveLS(LS_NEWS, newsCards); renderNews(); }
      else { eventCards[idx] = item; saveLS(LS_EVENTS, eventCards); renderEvents(); }
    } else {
      if(type==='news'){ newsCards.unshift(item); saveLS(LS_NEWS, newsCards); renderNews(); }
      else { eventCards.unshift(item); saveLS(LS_EVENTS, eventCards); renderEvents(); }
    }
    ev.target.reset();
    closeModal(addModal());
  }
});

// Edit/Delete functions available globally (card buttons call them)
window.editCard = function(type, index){
  const list = type === 'news' ? newsCards : eventCards;
  const item = list[index];
  if(!item) return alert('Item not found');
  document.getElementById('type').value = type === 'news' ? 'news' : 'event';
  document.getElementById('badge').value = item.badge || '';
  document.getElementById('title').value = item.title || '';
  document.getElementById('tag').value = item.tag || '';
  document.getElementById('excerpt').value = item.excerpt || '';
  document.getElementById('media').value = item.media || '';
  document.getElementById('link').value = item.link || '';
  addModal().dataset.editType = type;
  addModal().dataset.editIndex = index;
  document.getElementById('addTitle').textContent = 'Edit Card';
  openModal(addModal());
};

window.deleteCard = function(type, index){
  const list = type === 'news' ? newsCards : eventCards;
  if(!list[index]) return;
  if(!confirm('Delete this card?')) return;
  list.splice(index, 1);
  if(type === 'news'){ saveLS(LS_NEWS, newsCards); renderNews(); }
  else { saveLS(LS_EVENTS, eventCards); renderEvents(); }
};

// Changelog: try to fetch changelog.json for initial entries, fallback to localStorage
async function initChangelog(){
  let initial = [];
  try {
    const res = await fetch('changelog.json');
    if(res.ok) initial = await res.json();
  } catch(e){
    // fetch may fail on file:// — ignore and use empty initial
  }
  let changelog = loadLS(LS_CHANGE, initial || []);
  const esc = s => String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  function saveChangeList(){ try{ localStorage.setItem(LS_CHANGE, JSON.stringify(changelog)); }catch(e){console.warn(e)} }
  function renderChangelog(){
    const container = document.getElementById('changelogList');
    if(!container) return;
    if(!changelog.length){ container.innerHTML = '<div class="notice">No entries yet.</div>'; return; }
    container.innerHTML = changelog.map((e,i)=>`
      <div class="entry" data-index="${i}">
        <div style="flex:1">
          <div>${esc(e.text).replace(/\n/g,'<br>')}</div>
          <div class="meta">${new Date(e.t).toLocaleString()}</div>
        </div>
        <div style="min-width:36px;display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          <button class="btn btn-ghost" data-action="delete" data-index="${i}" aria-label="Delete">✕</button>
        </div>
      </div>
    `).join('');
    container.querySelectorAll('button[data-action="delete"]').forEach(b=>{
      b.onclick = ()=> {
        const idx = Number(b.dataset.index);
        if(!confirm('Delete entry?')) return;
        changelog.splice(idx,1);
        saveChangeList();
        renderChangelog();
      };
    });
  }

  const toggle = document.getElementById('changelogToggle');
  const panel = document.getElementById('changelogPanel');
  const form = document.getElementById('changelogForm');
  const input = document.getElementById('changelogInput');
  const closeBtn = document.getElementById('changelogClose');

  if(toggle && panel){
    toggle.addEventListener('click', ()=>{
      const open = panel.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      panel.setAttribute('aria-hidden', String(!open));
      if(open) renderChangelog();
    });
  }

  if(form){
    form.addEventListener('submit', (ev)=>{
      ev.preventDefault();
      const val = input.value.trim();
      if(!val) return;
      changelog.unshift({ text: val, t: Date.now() });
      saveChangeList();
      input.value = '';
      renderChangelog();
    });
  }
  if(closeBtn){
    closeBtn.addEventListener('click', ()=>{ panel.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); panel.setAttribute('aria-hidden','true'); });
  }

  renderChangelog();
}

// Init
setActiveRoute(location.hash);
renderNews();
renderEvents();
document.getElementById('year').textContent = new Date().getFullYear();
initChangelog();
// ...existing code...
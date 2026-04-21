// ─── RICWER CLIENT — app.js ──────────────────────────────────────────
// Estado global de la app
let APP = {
  user: null,
  profile: null,
  categorias: [],
  currentSection: 'home',
  prevSection: null,
};

// ─── INIT ────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  // Verificar sesión
  const auth = await requireAuth('cliente');
  if (!auth) return;

  APP.user = auth.session.user;
  APP.profile = auth.profile;

  // UI usuario
  updateUserUI();

  // Cargar datos base
  await Promise.all([
    loadCategorias(),
    loadCarrito(),
    loadNotificaciones(),
  ]);

  // Render inicial
  renderHomeDestacados();
  renderHomeCategorias();

  // Scroll topbar
  window.addEventListener('scroll', () => {
    document.getElementById('topbar').classList.toggle('scrolled', window.scrollY > 40);
  });

  // Cerrar panels al click afuera
  document.addEventListener('click', handleOutsideClick);

  // Hash navigation
  if (location.hash) handleHashNav(location.hash);

  // Ocultar loader
  setTimeout(() => {
    const loader = document.getElementById('app-loader');
    loader.classList.add('hide');
    setTimeout(() => loader.remove(), 400);
  }, 600);
});

// ─── AUTH ────────────────────────────────────────────────────────────
function updateUserUI() {
  const { profile, user } = APP;
  const initials = ((profile?.nombre || '?').charAt(0) + (profile?.apellido || '').charAt(0)).toUpperCase() || '?';
  document.getElementById('tb-avatar').textContent = initials;
  document.getElementById('um-name').textContent = `${profile?.nombre || ''} ${profile?.apellido || ''}`.trim() || 'Usuario';
  document.getElementById('um-email').textContent = user?.email || '';
}

async function doSignOut() {
  await signOut();
}

// ─── NAVIGACIÓN ──────────────────────────────────────────────────────
const SECTION_INIT = {
  catalogo:  () => renderCatalogo(),
  perfil:    () => renderPerfil(),
  ordenes:   () => renderOrdenes(),
  mensajes:  () => renderMensajes(),
  checkout:  () => renderCheckout(),
};

function showSection(id) {
  APP.prevSection = APP.currentSection;
  APP.currentSection = id;

  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('s-' + id)?.classList.add('active');

  document.querySelectorAll('[data-sec]').forEach(b => {
    b.classList.toggle('active', b.dataset.sec === id);
  });

  closeMenus();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (SECTION_INIT[id]) SECTION_INIT[id]();
}

function historyBack() {
  if (APP.prevSection) showSection(APP.prevSection);
  else showSection('catalogo');
}

function handleHashNav(hash) {
  const map = { '#catalogo': 'catalogo', '#perfil': 'perfil', '#ordenes': 'ordenes', '#mensajes': 'mensajes' };
  const sec = map[hash];
  if (sec) showSection(sec);
}

// ─── CATEGORÍAS ──────────────────────────────────────────────────────
async function loadCategorias() {
  const { data } = await sb.from('categorias').select('*').eq('activa', true).order('orden');
  APP.categorias = data || [];
}

function renderHomeCategorias() {
  const el = document.getElementById('home-categorias');
  if (!el || !APP.categorias.length) return;
  el.innerHTML = APP.categorias.map(c => `
    <button onclick="filterCategoria('${c.slug}');showSection('catalogo')"
      style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
             padding:20px 12px;cursor:pointer;text-align:center;transition:all var(--transition)"
      onmouseover="this.style.borderColor='var(--gold)';this.style.background='var(--gold-bg)'"
      onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--surface)'">
      <div style="font-size:32px;margin-bottom:8px">${c.icono || '👟'}</div>
      <div style="font-family:var(--font-display);font-size:16px;letter-spacing:2px;color:var(--text)">${c.nombre.toUpperCase()}</div>
    </button>
  `).join('');
}

async function renderHomeDestacados() {
  const el = document.getElementById('home-destacados');
  if (!el) return;
  try {
    const { data: prods, error } = await sb
      .from('productos')
      .select('*, producto_variantes(*), producto_imagenes(*)')
      .eq('activo', true)
      .eq('destacado', true)
      .limit(8);
    if (error) { console.warn('[destacados]', error.message); el.style.display = 'none'; return; }
    if (!prods?.length) { el.style.display = 'none'; return; }
    el.innerHTML = prods.map(p => productCardHTML(p)).join('');
  } catch(e) {
    el.style.display = 'none';
  }
}

// ─── SEARCH ──────────────────────────────────────────────────────────
let searchTimeout;
function onSearchInput() {
  clearTimeout(searchTimeout);
  const q = document.getElementById('tb-search').value.trim();
  searchTimeout = setTimeout(() => {
    if (q.length >= 2) {
      showSection('catalogo');
      renderCatalogo(q);
    } else if (!q) {
      renderCatalogo();
    }
  }, 350);
}

// ─── NOTIFICACIONES ──────────────────────────────────────────────────
async function loadNotificaciones() {
  try {
    const { data, error } = await sb
      .from('notificaciones')
      .select('*')
      .eq('user_id', APP.user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) {
      console.warn('[notificaciones]', error.message);
      renderNotifPanel([]);
      return;
    }
    renderNotifPanel(data || []);
  } catch (e) {
    renderNotifPanel([]);
  }
}

function renderNotifPanel(notifs) {
  const unread = notifs.filter(n => !n.leida);
  const dot = document.getElementById('notif-dot');
  if (dot) dot.style.display = unread.length ? '' : 'none';

  const list = document.getElementById('notif-list');
  if (!list) return;
  if (!notifs.length) { list.innerHTML = '<div class="np-empty">Sin notificaciones</div>'; return; }
  list.innerHTML = notifs.map(n => `
    <div class="np-item ${n.leida ? '' : 'unread'}" onclick="clickNotif('${n.id}','${n.url || ''}')">
      <div class="np-item-title">${n.titulo}</div>
      ${n.cuerpo ? `<div class="np-item-body">${n.cuerpo}</div>` : ''}
      <div class="np-item-date">${fmtDatetime(n.created_at)}</div>
    </div>
  `).join('');
}

async function clickNotif(id, url) {
  await sb.from('notificaciones').update({ leida: true }).eq('id', id);
  closeMenus();
  if (url && url !== 'null') {
    const hash = url.split('#')[1];
    if (hash) handleHashNav('#' + hash);
  }
  await loadNotificaciones();
}

async function markAllNotifRead() {
  await sb.from('notificaciones').update({ leida: true }).eq('user_id', APP.user.id);
  await loadNotificaciones();
}

function toggleNotifPanel() {
  const p = document.getElementById('notif-panel');
  const um = document.getElementById('user-menu');
  um?.classList.remove('open');
  p.classList.toggle('open');
}

// ─── USER MENU ───────────────────────────────────────────────────────
function toggleUserMenu() {
  const p = document.getElementById('notif-panel');
  const um = document.getElementById('user-menu');
  p?.classList.remove('open');
  um.classList.toggle('open');
}

function closeMenus() {
  document.getElementById('user-menu')?.classList.remove('open');
  document.getElementById('notif-panel')?.classList.remove('open');
}

function handleOutsideClick(e) {
  const notifBtn  = document.getElementById('notif-btn');
  const notifPanel = document.getElementById('notif-panel');
  const avatar    = document.getElementById('tb-avatar');
  const userMenu  = document.getElementById('user-menu');

  if (notifPanel?.classList.contains('open') && !notifPanel.contains(e.target) && e.target !== notifBtn) {
    notifPanel.classList.remove('open');
  }
  if (userMenu?.classList.contains('open') && !userMenu.contains(e.target) && e.target !== avatar) {
    userMenu.classList.remove('open');
  }
}

// ─── MOBILE NAV ──────────────────────────────────────────────────────
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('mobile-nav').classList.toggle('open');
  const ov = document.getElementById('mobile-overlay');
  if (document.getElementById('mobile-nav').classList.contains('open')) {
    ov.style.display = 'block';
  } else {
    ov.style.display = 'none';
  }
});

function closeMobileNav() {
  document.getElementById('mobile-nav').classList.remove('open');
  document.getElementById('mobile-overlay').style.display = 'none';
}

// ─── MODALES ─────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  const form = document.getElementById(id)?.querySelector('form');
  if (form) form.reset();
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
});

// ─── TOAST ───────────────────────────────────────────────────────────
function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; el.style.transition = '0.3s'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ─── UTILS ───────────────────────────────────────────────────────────
function fmtMoney(n) {
  const num = Number(n || 0);
  if (num >= 1000000) return '$' + (num / 1000000).toFixed(1) + 'M';
  return '$' + num.toLocaleString('es-CO');
}
function fmtMoneyFull(n) { return '$' + Number(n || 0).toLocaleString('es-CO'); }
function fmtDate(d) { if (!d) return '—'; const [y, m, dd] = d.slice(0, 10).split('-'); return `${dd}/${m}/${y}`; }
function fmtDatetime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('es-CO', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function today() { return new Date().toISOString().slice(0, 10); }

const ORDEN_ESTADOS = {
  pendiente:   { label: 'Pendiente',       cls: 'b-yellow' },
  confirmado:  { label: 'Confirmado',      cls: 'b-blue'   },
  preparando:  { label: 'Preparando',      cls: 'b-purple' },
  listo:       { label: 'Listo',           cls: 'b-green'  },
  enviado:     { label: 'Enviado',         cls: 'b-blue'   },
  entregado:   { label: 'Entregado',       cls: 'b-gray'   },
  cancelado:   { label: 'Cancelado',       cls: 'b-red'    },
};
function estadoBadge(estado) {
  const e = ORDEN_ESTADOS[estado] || { label: estado, cls: 'b-gray' };
  return `<span class="badge ${e.cls}">${e.label}</span>`;
}

const MSG_TIPOS = {
  soporte:      { label: 'Soporte',      cls: 'b-blue'   },
  sugerencia:   { label: 'Sugerencia',   cls: 'b-gold'   },
  calificacion: { label: 'Calificación', cls: 'b-yellow' },
  reclamo:      { label: 'Reclamo',      cls: 'b-red'    },
  otro:         { label: 'Otro',         cls: 'b-gray'   },
};
function tipoBadge(tipo) {
  const t = MSG_TIPOS[tipo] || { label: tipo, cls: 'b-gray' };
  return `<span class="badge ${t.cls}">${t.label}</span>`;
}

// Rating stars
function starsHTML(rating, max = 5) {
  return Array.from({ length: max }, (_, i) =>
    `<span class="${i < rating ? 'star-filled' : 'star-empty'}">${i < rating ? '★' : '☆'}</span>`
  ).join('');
}

// Image o emoji fallback
function productImgHTML(imagenes, size = 'emoji') {
  const principal = imagenes?.find(i => i.es_principal) || imagenes?.[0];
  if (principal?.url) return `<img src="${principal.url}" alt="" loading="lazy" />`;
  return `<span style="font-size:${size === 'emoji' ? '80px' : '40px'}">👟</span>`;
}
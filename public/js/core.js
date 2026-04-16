// ─── DATABASE ───────────────────────────────────────────────────────
const STORE_KEY = 'ricwer_v2';
let DB = { productos: [], ventas: [], pedidos: [], arreglos: [] };

function saveDB() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); } catch(e) { console.error('Error guardando:', e); }
}
function loadDB() {
  try {
    const d = localStorage.getItem(STORE_KEY);
    if (d) DB = Object.assign({ productos: [], ventas: [], pedidos: [], arreglos: [] }, JSON.parse(d));
  } catch(e) { console.error('Error cargando:', e); }
}

// ─── UTILS ──────────────────────────────────────────────────────────
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function today() { return new Date().toISOString().slice(0, 10); }
function fmtDate(d) {
  if (!d) return '—';
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y}`;
}
function fmtMoney(n) {
  const num = Number(n || 0);
  if (num >= 1000000) return '$' + (num / 1000000).toFixed(1) + 'M';
  return '$' + num.toLocaleString('es-CO');
}
function fmtMoneyFull(n) {
  return '$' + Number(n || 0).toLocaleString('es-CO');
}

// ─── MEDIOS DE PAGO ─────────────────────────────────────────────────
const MEDIOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta débito', 'Tarjeta crédito', 'Nequi', 'Daviplata', 'Bancolombia', 'Otro'];
const PAGO_ICONS = {
  'Efectivo': '💵', 'Transferencia': '🏦', 'Tarjeta débito': '💳',
  'Tarjeta crédito': '💳', 'Nequi': '📱', 'Daviplata': '📱',
  'Bancolombia': '🏦', 'Otro': '💰'
};

function pagoIcon(pago) {
  return `<span class="pago-icon">${PAGO_ICONS[pago] || '💰'} ${pago || '—'}</span>`;
}

function mediosPagoOptions(selectedVal = '') {
  return MEDIOS_PAGO.map(m => `<option value="${m}" ${m === selectedVal ? 'selected' : ''}>${m}</option>`).join('');
}

// ─── BADGE HELPERS ───────────────────────────────────────────────────
const ESTADO_PEDIDO_CLASS = {
  'Pendiente': 'b-amber', 'En proceso': 'b-blue',
  'Listo para entregar': 'b-green', 'Entregado': 'b-gray', 'Cancelado': 'b-red'
};
const ESTADO_ARREGLO_CLASS = {
  'Recibido': 'b-amber', 'En proceso': 'b-blue', 'Listo': 'b-green', 'Entregado': 'b-gray'
};

function badge(text, cls) { return `<span class="badge ${cls}">${text}</span>`; }

// ─── ABONO HELPERS ───────────────────────────────────────────────────
function getAbonados(item) {
  return (item.abonos || []).reduce((s, a) => s + Number(a.monto || 0), 0);
}
function getSaldo(item) {
  return Math.max(0, Number(item.total || 0) - Number(item.anticipo || 0) - getAbonados(item));
}
function progressBar(item) {
  const total = Number(item.total || 1);
  const pagado = Number(item.anticipo || 0) + getAbonados(item);
  const pct = Math.min(100, Math.round((pagado / total) * 100));
  const color = pct >= 100 ? '#10b981' : pct >= 50 ? '#3b82f6' : '#f59e0b';
  return `<div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%;background:${color}"></div></div>
          <span style="font-size:10px;color:var(--text-muted)">${pct}% pagado</span>`;
}

// ─── NAV BADGES ─────────────────────────────────────────────────────
function updateNavBadges() {
  const pedPend = DB.pedidos.filter(p => p.estado !== 'Entregado' && p.estado !== 'Cancelado').length;
  const arrAct = DB.arreglos.filter(a => a.estado !== 'Entregado').length;
  const pedBadge = document.getElementById('badge-pedidos');
  const arrBadge = document.getElementById('badge-arreglos');
  if (pedBadge) pedBadge.textContent = pedPend || '';
  if (arrBadge) arrBadge.textContent = arrAct || '';
  if (pedBadge) pedBadge.style.display = pedPend ? '' : 'none';
  if (arrBadge) arrBadge.style.display = arrAct ? '' : 'none';
}

// ─── MODAL ──────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  const form = document.getElementById(id).querySelector('form');
  if (form) form.reset();
  const hiddens = document.getElementById(id).querySelectorAll('input[type=hidden]');
  hiddens.forEach(h => h.value = '');
}

// Click outside to close modals
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
});

// ─── SIDEBAR MOBILE ─────────────────────────────────────────────────
document.getElementById('menu-toggle').addEventListener('click', () => {
  const sb = document.getElementById('sidebar');
  sb.classList.toggle('open');
  if (sb.classList.contains('open')) {
    const ov = document.createElement('div');
    ov.className = 'sidebar-overlay';
    ov.id = 'sb-overlay';
    ov.onclick = () => { sb.classList.remove('open'); ov.remove(); };
    document.body.appendChild(ov);
  } else {
    const ov = document.getElementById('sb-overlay');
    if (ov) ov.remove();
  }
});

// ─── SECTION NAV ────────────────────────────────────────────────────
const SECTION_TITLES = {
  dashboard: 'Dashboard', productos: 'Inventario', ventas: 'Ventas',
  pedidos: 'Pedidos & Encargos', arreglos: 'Arreglos & Reparaciones'
};

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('s-' + id).classList.add('active');
  document.querySelectorAll(`nav button[data-section="${id}"]`).forEach(b => b.classList.add('active'));
  document.getElementById('topbar-title').textContent = SECTION_TITLES[id] || 'Ricwer';
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sb-overlay');
  if (sb.classList.contains('open')) { sb.classList.remove('open'); if (ov) ov.remove(); }

  if (id === 'dashboard') renderDashboard();
  if (id === 'productos') renderProductos();
  if (id === 'ventas') { fillProductoSelectVenta(); renderVentas(); }
  if (id === 'pedidos') renderPedidos();
  if (id === 'arreglos') renderArreglos();
}

// ─── TOPBAR DATE ─────────────────────────────────────────────────────
function setTopbarDate() {
  const el = document.getElementById('topbar-date');
  if (!el) return;
  const d = new Date();
  const opts = { weekday: 'short', day: 'numeric', month: 'short' };
  el.textContent = d.toLocaleDateString('es-CO', opts);
}

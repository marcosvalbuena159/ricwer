// ─── SUPABASE CONFIG ────────────────────────────────────────────────
// Reemplaza estos valores con los de tu proyecto en Supabase:
// Settings > API > Project URL  y  Settings > API > anon public key
const SUPABASE_URL = 'https://rrvaklhrwirevdroofaq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_y4CDF1S_OP_hD3XwJaP7CA_EiMsk_v3';

const _h = { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY, 'Prefer': 'return=representation' };

// ─── DB en memoria (caché local) ────────────────────────────────────
let DB = { productos: [], ventas: [], pedidos: [], arreglos: [] };

// ─── SUPABASE REST HELPERS ──────────────────────────────────────────
async function sbGet(table) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, { headers: _h });
  if (!r.ok) { console.error('Error GET', table, await r.text()); return []; }
  return r.json();
}

async function sbUpsert(table, obj) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ..._h, 'Prefer': 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(obj)
  });
  if (!r.ok) console.error('Error UPSERT', table, await r.text());
}

async function sbDelete(table, id) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE', headers: _h
  });
  if (!r.ok) console.error('Error DELETE', table, await r.text());
}

// ─── CARGAR TODO AL INICIO ──────────────────────────────────────────
async function loadDB() {
  showLoader(true);
  try {
    const [productos, ventas, pedidos, arreglos, abonos] = await Promise.all([
      sbGet('productos'), sbGet('ventas'), sbGet('pedidos'), sbGet('arreglos'), sbGet('abonos')
    ]);

    // Mapear snake_case de Supabase a camelCase del código
    DB.productos = productos.map(mapProducto);
    DB.ventas = ventas.map(mapVenta);
    // Adjuntar abonos a pedidos y arreglos
    DB.pedidos = pedidos.map(p => mapPedido(p, abonos));
    DB.arreglos = arreglos.map(a => mapArreglo(a, abonos));
  } catch(e) {
    console.error('Error cargando BD:', e);
    alert('⚠️ Error conectando con la base de datos. Verifica tu conexión.');
  }
  showLoader(false);
}

// ─── MAPPERS (Supabase → App) ────────────────────────────────────────
function mapProducto(p) {
  return { id: p.id, nombre: p.nombre, ref: p.ref, marca: p.marca, categoria: p.categoria,
    talla: p.talla, color: p.color, costo: p.costo, precio: p.precio, stock: p.stock,
    stockmin: p.stockmin, notas: p.notas, fechaCreado: p.fecha_creado };
}
function mapVenta(v) {
  return { id: v.id, cliente: v.cliente, productoId: v.producto_id, productoNombre: v.producto_nombre,
    cantidad: v.cantidad, precio: v.precio, total: v.total, pago: v.pago, fecha: v.fecha, notas: v.notas };
}
function mapPedido(p, abonos) {
  return { id: p.id, cliente: p.cliente, tel: p.tel, desc: p.desc, anticipo: p.anticipo,
    pagoAnticipo: p.pago_anticipo, total: p.total, entrega: p.entrega, estado: p.estado,
    notas: p.notas, fecha: p.fecha,
    abonos: abonos.filter(a => a.tabla === 'pedidos' && a.ref_id === p.id).map(mapAbono) };
}
function mapArreglo(a, abonos) {
  return { id: a.id, cliente: a.cliente, tel: a.tel, tipo: a.tipo, desc: a.desc, costo: a.costo,
    anticipo: a.anticipo, pagoAnticipo: a.pago_anticipo, entrega: a.entrega, estado: a.estado,
    fecha: a.fecha, total: a.total,
    abonos: abonos.filter(ab => ab.tabla === 'arreglos' && ab.ref_id === a.id).map(mapAbono) };
}
function mapAbono(a) {
  return { id: a.id, monto: a.monto, pago: a.pago, nota: a.nota, fecha: a.fecha };
}

// ─── SAVE HELPERS (App → Supabase) ──────────────────────────────────
async function saveProducto(obj) {
  await sbUpsert('productos', {
    id: obj.id, nombre: obj.nombre, ref: obj.ref || null, marca: obj.marca || null,
    categoria: obj.categoria, talla: obj.talla || null, color: obj.color || null,
    costo: obj.costo || 0, precio: obj.precio || 0, stock: obj.stock || 0,
    stockmin: obj.stockmin || 2, notas: obj.notas || null, fecha_creado: obj.fechaCreado
  });
}

async function saveVenta(obj) {
  await sbUpsert('ventas', {
    id: obj.id, cliente: obj.cliente || null, producto_id: obj.productoId || null,
    producto_nombre: obj.productoNombre, cantidad: obj.cantidad || 1,
    precio: obj.precio || 0, total: obj.total || 0, pago: obj.pago,
    fecha: obj.fecha, notas: obj.notas || null
  });
}

async function savePedido(obj) {
  await sbUpsert('pedidos', {
    id: obj.id, cliente: obj.cliente, tel: obj.tel || null, desc: obj.desc || null,
    anticipo: obj.anticipo || 0, pago_anticipo: obj.pagoAnticipo || null,
    total: obj.total || 0, entrega: obj.entrega || null, estado: obj.estado,
    notas: obj.notas || null, fecha: obj.fecha
  });
}

async function saveArreglo(obj) {
  await sbUpsert('arreglos', {
    id: obj.id, cliente: obj.cliente, tel: obj.tel || null, tipo: obj.tipo,
    desc: obj.desc || null, costo: obj.costo || 0, anticipo: obj.anticipo || 0,
    pago_anticipo: obj.pagoAnticipo || null, entrega: obj.entrega || null,
    estado: obj.estado, fecha: obj.fecha, total: obj.total || 0
  });
}

async function saveAbono(tabla, refId, abono) {
  await sbUpsert('abonos', {
    id: abono.id, tabla, ref_id: refId,
    monto: abono.monto, pago: abono.pago, nota: abono.nota || null, fecha: abono.fecha
  });
}

async function deleteAbonoDB(abonoId) {
  await sbDelete('abonos', abonoId);
}

async function updateStock(prodId, newStock) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/productos?id=eq.${prodId}`, {
    method: 'PATCH',
    headers: { ..._h, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ stock: newStock })
  });
  if (!r.ok) console.error('Error actualizando stock', await r.text());
}

async function deleteItemDB(table, id) {
  await sbDelete(table, id);
}

// ─── LOADER ─────────────────────────────────────────────────────────
function showLoader(show) {
  let el = document.getElementById('global-loader');
  if (!el) {
    el = document.createElement('div');
    el.id = 'global-loader';
    el.innerHTML = '<div class="loader-spinner"></div>';
    el.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.7);display:flex;align-items:center;justify-content:center;z-index:9999';
    document.body.appendChild(el);
  }
  el.style.display = show ? 'flex' : 'none';
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
function pagoIcon(pago) { return `<span class="pago-icon">${PAGO_ICONS[pago] || '💰'} ${pago || '—'}</span>`; }
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
  if (pedBadge) { pedBadge.textContent = pedPend || ''; pedBadge.style.display = pedPend ? '' : 'none'; }
  if (arrBadge) { arrBadge.textContent = arrAct || ''; arrBadge.style.display = arrAct ? '' : 'none'; }
}

// ─── MODAL ──────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  const form = document.getElementById(id).querySelector('form');
  if (form) form.reset();
  document.getElementById(id).querySelectorAll('input[type=hidden]').forEach(h => h.value = '');
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
});

// ─── SIDEBAR MOBILE ─────────────────────────────────────────────────
document.getElementById('menu-toggle').addEventListener('click', () => {
  const sb = document.getElementById('sidebar');
  sb.classList.toggle('open');
  if (sb.classList.contains('open')) {
    const ov = document.createElement('div');
    ov.className = 'sidebar-overlay'; ov.id = 'sb-overlay';
    ov.onclick = () => { sb.classList.remove('open'); ov.remove(); };
    document.body.appendChild(ov);
  } else {
    const ov = document.getElementById('sb-overlay'); if (ov) ov.remove();
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

function setTopbarDate() {
  const el = document.getElementById('topbar-date'); if (!el) return;
  el.textContent = new Date().toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
}
// ─── RICWER ADMIN — core.js ──────────────────────────────────────────
// Todo lo que necesitan los scripts externos debe estar AQUÍ,
// ya que core.js carga ANTES que productos.js, ventas.js, etc.

// ─── 1. SUPABASE INIT ────────────────────────────────────────────────
const SUPABASE_URL      = 'https://rrvaklhrwirevdroofaq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJydmFrbGhyd2lyZXZkcm9vZmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjI3NjMsImV4cCI6MjA5MTkzODc2M30.NkRiTZwn6AvBOH5g5drzSdFdgGj_Ih4ghBlqE_ZULIw';
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── 2. PROTECCIÓN DE RUTA ───────────────────────────────────────────
(async () => {
  document.body.style.visibility = 'hidden';
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { window.location.replace('/index.html'); return; }

    const { data: profile, error } = await sb
      .from('profiles').select('rol, nombre, apellido')
      .eq('id', session.user.id).maybeSingle();

    if (error || !profile) {
      await sb.auth.signOut();
      window.location.replace('/index.html');
      return;
    }
    if (profile.rol !== 'admin') {
      window.location.replace('/cliente.html');
      return;
    }
    window.ADMIN_PROFILE = profile;
    window.ADMIN_SESSION = session;
    document.body.style.visibility = 'visible';
  } catch (err) {
    console.error('[RICWER auth]', err);
    window.location.replace('/index.html');
  }
})();

sb.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') window.location.replace('/index.html');
});

async function adminSignOut() {
  await sb.auth.signOut();
  window.location.replace('/index.html');
}

// ─── 3. HELPERS DE FORMATO ───────────────────────────────────────────
function fmtMoney(n) {
  const num = Number(n || 0);
  if (num >= 1000000) return '$' + (num / 1000000).toFixed(1) + 'M';
  return '$' + num.toLocaleString('es-CO');
}
function fmtMoneyFull(n) { return '$' + Number(n || 0).toLocaleString('es-CO'); }
function fmtDate(d) {
  if (!d) return '—';
  const [y, m, dd] = d.slice(0, 10).split('-');
  return `${dd}/${m}/${y}`;
}
function fmtDatetime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CO', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}
function today() { return new Date().toISOString().slice(0, 10); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// ─── 4. TOAST ────────────────────────────────────────────────────────
function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id = 'toast-container'; document.body.appendChild(c); }
  c.appendChild(el);
  setTimeout(() => { el.style.opacity='0'; el.style.transform='translateX(20px)'; el.style.transition='.3s'; setTimeout(()=>el.remove(),300); }, 3000);
}

// ─── 5. MODALES ──────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
  document.getElementById(id)?.querySelector('form')?.reset();
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
});

// ─── 6. NAVEGACIÓN ───────────────────────────────────────────────────
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('s-' + id)?.classList.add('active');
  document.querySelectorAll('[data-sec]').forEach(b => {
    b.classList.toggle('active', b.dataset.sec === id);
  });
  const titles = {
    dashboard:'Dashboard', productos:'Productos', ventas:'Ventas',
    pedidos:'Pedidos', arreglos:'Arreglos', mensajes:'Mensajes',
  };
  const el = document.getElementById('topbar-title');
  if (el && titles[id]) el.textContent = titles[id];
}

function setTopbarDate() {
  const el = document.getElementById('topbar-date');
  if (el) el.textContent = new Date().toLocaleDateString('es-CO', {
    weekday:'long', day:'numeric', month:'long', year:'numeric'
  });
}

function showLoader(on) {
  const el = document.getElementById('admin-loader');
  if (el) el.style.display = on ? 'flex' : 'none';
}

// ─── 7. HELPERS DE UI ────────────────────────────────────────────────
const MEDIOS_PAGO = ['Efectivo','Nequi','Daviplata','Bancolombia','Tarjeta débito','Tarjeta crédito','Transferencia'];

function mediosPagoOptions(selected = 'Efectivo') {
  return MEDIOS_PAGO.map(m => `<option${m === selected ? ' selected' : ''}>${m}</option>`).join('');
}

const PAGO_ICONS = {
  Nequi:'💜', Daviplata:'🔴', Bancolombia:'🟡', Efectivo:'💵',
  Transferencia:'🏦', 'Tarjeta débito':'💳', 'Tarjeta crédito':'💳'
};
function pagoIcon(pago) {
  return `<span class="pago-icon">${PAGO_ICONS[pago]||'💵'} ${pago||'Efectivo'}</span>`;
}

function badge(text, cls = 'b-gray') {
  return `<span class="badge ${cls}">${text}</span>`;
}

function getSaldo(item) {
  const total = Number(item.total || item.costo || 0);
  return Math.max(0, total - Number(item.anticipo || 0) - getAbonados(item));
}
function getAbonados(item) {
  return (item.abonos || []).reduce((s, a) => s + Number(a.monto || 0), 0);
}
function progressBar(item) {
  const total = Number(item.total || item.costo || 0);
  if (!total) return '';
  const pct = Math.min(100, Math.round(((Number(item.anticipo||0) + getAbonados(item)) / total) * 100));
  return `<div class="progress-bar-wrap" style="margin-top:4px"><div class="progress-bar" style="width:${pct}%"></div></div>`;
}

// ─── 8. SIDEBAR RESPONSIVE ───────────────────────────────────────────
function toggleSidebar() {
  const sb_el = document.getElementById('sidebar');
  const ov = document.getElementById('sidebar-overlay');
  const open = sb_el.classList.toggle('open');
  ov.style.display = open ? 'block' : 'none';
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').style.display = 'none';
}

// ─── 9. DATOS GLOBALES ───────────────────────────────────────────────
let DB = {
  ordenes: [], productos: [], categorias: [],
  pedidos: [], arreglos: [], ventas: [], clientes: [],
};

function populatePagoSelects() {
  document.querySelectorAll('select[id$="-pago"],select[id$="-pago-anticipo"],#abono-pago,#v-pago').forEach(sel => {
    if (!sel.options.length) {
      MEDIOS_PAGO.forEach(m => {
        const o = document.createElement('option');
        o.value = o.textContent = m;
        sel.appendChild(o);
      });
    }
  });
}

async function loadDB() {
  const [ordenes, productos, categorias, pedidos, arreglos, ventas, clientes] = await Promise.all([
    sb.from('ordenes').select('*, profiles(nombre,apellido), orden_items(*)').order('created_at', { ascending: false }),
    sb.from('productos').select('*, producto_imagenes(url, es_principal, orden)').order('fecha_creado', { ascending: false }),
    sb.from('categorias').select('*').order('orden'),
    sb.from('pedidos').select('*, abonos!abonos_pedido_id_fkey(*)').order('fecha', { ascending: false }),
    sb.from('arreglos').select('*, abonos!abonos_arreglo_id_fkey(*)').order('fecha', { ascending: false }),
    sb.from('ventas').select('*').order('fecha', { ascending: false }),
    sb.from('profiles').select('*').eq('rol', 'cliente').order('created_at', { ascending: false }),
  ]);

  if (ordenes.error)   console.warn('[DB] ordenes:', ordenes.error.message);
  if (productos.error) console.warn('[DB] productos:', productos.error.message);
  if (pedidos.error)   console.warn('[DB] pedidos:', pedidos.error.message);
  if (arreglos.error)  console.warn('[DB] arreglos:', arreglos.error.message);
  if (ventas.error)    console.warn('[DB] ventas:', ventas.error.message);

  DB.ordenes    = ordenes.data    || [];
  DB.productos  = productos.data  || [];
  DB.categorias = categorias.data || [];
  DB.pedidos    = pedidos.data    || [];
  DB.arreglos   = arreglos.data   || [];
  DB.ventas     = ventas.data     || [];
  DB.clientes   = clientes.data   || [];

  populatePagoSelects();
}

// ─── 10. NAV BADGES ──────────────────────────────────────────────────
function updateNavBadges() {
  const ped = DB.pedidos.filter(p => p.estado !== 'Entregado' && p.estado !== 'Cancelado').length;
  const arr = DB.arreglos.filter(a => a.estado !== 'Entregado').length;
  const bp = document.getElementById('badge-pedidos');
  const ba = document.getElementById('badge-arreglos');
  if (bp) { bp.textContent = ped; bp.style.display = ped ? '' : 'none'; }
  if (ba) { ba.textContent = arr; ba.style.display = arr ? '' : 'none'; }
}

// ─── 11. ESTADOS ─────────────────────────────────────────────────────
const ESTADO_PEDIDO_CLASS = {
  'Pendiente':'b-yellow', 'En proceso':'b-blue',
  'Listo para entregar':'b-green', 'Entregado':'b-gray', 'Cancelado':'b-red',
};
const ESTADO_ARREGLO_CLASS = {
  'Recibido':'b-yellow', 'En proceso':'b-blue', 'Listo':'b-green', 'Entregado':'b-gray',
};

// ─── 12. SUPABASE CRUD ───────────────────────────────────────────────
async function saveProducto(obj) {
  const { error } = await sb.from('productos').upsert({
    id: obj.id,
    nombre: obj.nombre,
    ref: obj.ref,
    marca: obj.marca,
    categoria: obj.categoria,
    genero: obj.genero || 'Unisex',
    costo: Number(obj.costo) || 0,
    precio: Number(obj.precio) || 0,
    precio_descuento: obj.precio_descuento ? Number(obj.precio_descuento) : null,
    stock: Number(obj.stock) || 0,
    stockmin: Number(obj.stockmin) || 2,
    activo: obj.activo !== false,
    destacado: !!obj.destacado,
    es_nuevo: !!obj.es_nuevo,
    notas: obj.notas,
  }, { onConflict: 'id' });
  if (error) { toast('Error: ' + error.message, 'error'); throw error; }
  toast('Producto guardado ✓', 'success');
}

async function saveVenta(obj) {
  const { error } = await sb.from('ventas').upsert({
    id: obj.id, cliente: obj.cliente,
    producto_id: obj.productoId,
    producto_nombre: obj.productoNombre,
    cantidad: obj.cantidad, precio: Number(obj.precio)||0,
    total: Number(obj.total)||0, pago: obj.pago,
    fecha: obj.fecha, notas: obj.notas,
  }, { onConflict: 'id' });
  if (error) { toast('Error: ' + error.message, 'error'); throw error; }
  toast('Venta registrada ✓', 'success');
}

async function updateStock(prodId, newStock) {
  const { error } = await sb.from('productos').update({ stock: newStock }).eq('id', prodId);
  if (error) console.warn('updateStock:', error.message);
}

async function savePedido(obj) {
  const { abonos, ...data } = obj;
  const { error } = await sb.from('pedidos').upsert({
    id: data.id, cliente: data.cliente, tel: data.tel, descripcion: data.descripcion,
    anticipo: Number(data.anticipo)||0, pago_anticipo: data.pago_anticipo || data.pagoAnticipo,
    total: Number(data.total)||0, entrega: data.entrega || null,
    estado: data.estado, notas: data.notas, fecha: data.fecha,
  }, { onConflict: 'id' });
  if (error) { toast('Error: ' + error.message, 'error'); throw error; }
  toast('Pedido guardado ✓', 'success');
}

async function saveArreglo(obj) {
  const { abonos, ...data } = obj;
  const { error } = await sb.from('arreglos').upsert({
    id: data.id, cliente: data.cliente, tel: data.tel, tipo: data.tipo,
    descripcion: data.descripcion, costo: Number(data.costo)||0,
    anticipo: Number(data.anticipo)||0, pago_anticipo: data.pagoAnticipo,
    entrega: data.entrega || null, estado: data.estado,
    fecha: data.fecha, total: Number(data.total)||0,
  }, { onConflict: 'id' });
  if (error) { toast('Error: ' + error.message, 'error'); throw error; }
  toast('Arreglo guardado ✓', 'success');
}

async function saveAbono(tabla, itemId, abono) {
  const col = tabla === 'pedidos' ? 'pedido_id' : 'arreglo_id';
  const { error } = await sb.from('abonos').insert({
    id: abono.id, [col]: itemId, monto: abono.monto,
    pago: abono.pago, nota: abono.nota, fecha: abono.fecha,
  });
  if (error) { toast('Error: ' + error.message, 'error'); throw error; }
  toast('Abono registrado ✓', 'success');
}

async function deleteAbonoDB(abonoId) {
  const { error } = await sb.from('abonos').delete().eq('id', abonoId);
  if (error) { toast('Error: ' + error.message, 'error'); throw error; }
}

async function deleteItemDB(tabla, id) {
  const { error } = await sb.from(tabla).delete().eq('id', id);
  if (error) { toast('Error: ' + error.message, 'error'); throw error; }
  toast('Eliminado ✓');
}
// ─── 13. EXPORTAR REPORTES CSV ────────────────────────────────────────
function exportCSV(filename, rows) {
  if (!rows || !rows.length) { toast('Sin datos para exportar', 'error'); return; }
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h] == null ? '' : String(row[h]);
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(',')
    )
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename + '_' + today() + '.csv';
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  toast('✅ Archivo descargado: ' + a.download, 'success');
}

async function exportReporteClientes() {
  const rows = DB.clientes.map(c => ({
    Nombre: (c.nombre || '') + ' ' + (c.apellido || ''),
    Telefono: c.telefono || '',
    Activo: c.activo ? 'Sí' : 'No',
    Rol: c.rol || 'cliente',
    Registro: c.created_at ? c.created_at.slice(0, 10) : '',
  }));
  exportCSV('reporte_clientes', rows);
}

async function exportReporteVentas() {
  const rows = DB.ventas.map(v => ({
    Fecha: v.fecha || '',
    Cliente: v.cliente || '',
    Producto: v.producto_nombre || '',
    Cantidad: v.cantidad || 1,
    Precio: v.precio || 0,
    Total: v.total || 0,
    Pago: v.pago || '',
    Notas: v.notas || '',
  }));
  exportCSV('reporte_ventas', rows);
}

async function exportReporteProductos() {
  const rows = DB.productos.map(p => ({
    Nombre: p.nombre || '',
    Referencia: p.ref || '',
    Marca: p.marca || '',
    Categoria: p.categoria || '',
    Genero: p.genero || '',
    Costo: p.costo || 0,
    Precio: p.precio || 0,
    PrecioDescuento: p.precio_descuento || '',
    Stock: p.stock || 0,
    StockMinimo: p.stockmin || 2,
    Activo: p.activo ? 'Sí' : 'No',
    Destacado: p.destacado ? 'Sí' : 'No',
    Nuevo: p.es_nuevo ? 'Sí' : 'No',
  }));
  exportCSV('reporte_productos', rows);
}

async function exportReportePedidos() {
  const rows = DB.pedidos.map(p => ({
    Fecha: p.fecha || '',
    Cliente: p.cliente || '',
    Telefono: p.tel || '',
    Descripcion: p.descripcion || '',
    Total: p.total || 0,
    Anticipo: p.anticipo || 0,
    Abonado: getAbonados(p),
    Saldo: getSaldo(p),
    Estado: p.estado || '',
    Entrega: p.entrega || '',
  }));
  exportCSV('reporte_pedidos', rows);
}

async function exportReporteArreglos() {
  const rows = DB.arreglos.map(a => ({
    Fecha: a.fecha || '',
    Cliente: a.cliente || '',
    Telefono: a.tel || '',
    Tipo: a.tipo || '',
    Descripcion: a.descripcion || '',
    Costo: a.costo || 0,
    Anticipo: a.anticipo || 0,
    Abonado: getAbonados(a),
    Saldo: getSaldo(a),
    Estado: a.estado || '',
    Entrega: a.entrega || '',
  }));
  exportCSV('reporte_arreglos', rows);
}

// ─── 14. IMÁGENES DE PRODUCTO (Storage) ──────────────────────────────
async function uploadProductImage(prodId, file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${prodId}/${Date.now()}.${ext}`;
  const { error: upErr } = await sb.storage.from('productos').upload(path, file, { upsert: true });
  if (upErr) { toast('Error subiendo imagen: ' + upErr.message, 'error'); return null; }
  const { data: { publicUrl } } = sb.storage.from('productos').getPublicUrl(path);
  const { error: dbErr } = await sb.from('producto_imagenes').insert({
    producto_id: prodId, url: publicUrl, storage_path: path,
    es_principal: false, orden: 0,
  });
  if (dbErr) { toast('Error guardando imagen: ' + dbErr.message, 'error'); return null; }
  return { url: publicUrl, path };
}

async function deleteProductImage(imgId, storagePath) {
  if (storagePath) await sb.storage.from('productos').remove([storagePath]);
  await sb.from('producto_imagenes').delete().eq('id', imgId);
}

async function setPrincipalImage(imgId, prodId) {
  await sb.from('producto_imagenes').update({ es_principal: false }).eq('producto_id', prodId);
  await sb.from('producto_imagenes').update({ es_principal: true }).eq('id', imgId);
}
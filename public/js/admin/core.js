// ─── RICWER ADMIN — core.js ──────────────────────────────────────────
// Inicializa Supabase, verifica sesión y rol ANTES de mostrar nada.
// Si el usuario no está autenticado o no es admin → redirige.

// ─── 1. SUPABASE INIT ────────────────────────────────────────────────
const SUPABASE_URL      = 'https://rrvaklhrwirevdroofaq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJydmFrbGhyd2lyZXZkcm9vZmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjI3NjMsImV4cCI6MjA5MTkzODc2M30.NkRiTZwn6AvBOH5g5drzSdFdgGj_Ih4ghBlqE_ZULIw';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── 2. PROTECCIÓN DE RUTA ADMIN ─────────────────────────────────────
// Se ejecuta INMEDIATAMENTE — el body está oculto hasta que se valide.
(async () => {
  // Ocultar todo el contenido mientras validamos
  document.body.style.visibility = 'hidden';

  try {
    const { data: { session } } = await sb.auth.getSession();

    // Sin sesión → login
    if (!session) {
      window.location.replace('/index.html');
      return;
    }

    // Verificar rol en la tabla profiles
    const { data: profile, error } = await sb
      .from('profiles')
      .select('rol, nombre, apellido')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error || !profile) {
      // No tiene perfil o error → por seguridad, redirigir al login
      await sb.auth.signOut();
      window.location.replace('/index.html');
      return;
    }

    if (profile.rol !== 'admin') {
      // Es cliente, redirigir a su tienda
      window.location.replace('/cliente.html');
      return;
    }

    // ✅ Es admin → mostrar contenido y guardar perfil en window
    window.ADMIN_PROFILE = profile;
    window.ADMIN_SESSION = session;
    document.body.style.visibility = 'visible';

  } catch (err) {
    console.error('[RICWER auth]', err);
    window.location.replace('/index.html');
  }
})();

// ─── 3. ESCUCHAR CAMBIOS DE SESIÓN ───────────────────────────────────
// Si el admin cierra sesión desde otra pestaña, redirigir automáticamente
sb.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    window.location.replace('/index.html');
  }
});

// ─── 4. SIGN OUT ────────────────────────────────────────────────────
async function adminSignOut() {
  await sb.auth.signOut();
  window.location.replace('/index.html');
}

// ─── 5. HELPERS GLOBALES ────────────────────────────────────────────
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

function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    el.style.transition = '0.3s';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
  document.getElementById(id)?.querySelector('form')?.reset();
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
});

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('s-' + id)?.classList.add('active');
  document.querySelectorAll('[data-sec]').forEach(b => {
    b.classList.toggle('active', b.dataset.sec === id);
  });
  // Actualizar título del topbar
  const titles = {
    dashboard:  'Dashboard',
    productos:  'Productos',
    ordenes:    'Órdenes',
    pedidos:    'Pedidos a medida',
    arreglos:   'Arreglos',
    mensajes:   'Mensajes',
    clientes:   'Clientes',
    ventas:     'Ventas',
  };
  const titleEl = document.getElementById('topbar-title');
  if (titleEl && titles[id]) titleEl.textContent = titles[id];
}

function setTopbarDate() {
  const el = document.getElementById('topbar-date');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

// ─── 6. DATOS GLOBALES ──────────────────────────────────────────────
let DB = {
  ordenes: [], productos: [], categorias: [],
  pedidos: [], arreglos: [], ventas: [], clientes: [],
};

const MEDIOS_PAGO = ['Efectivo','Nequi','Daviplata','Bancolombia','Tarjeta débito','Tarjeta crédito','Transferencia'];

function populatePagoSelects() {
  document.querySelectorAll('select[id$="-pago"], select[id$="-pago-anticipo"], #abono-pago').forEach(sel => {
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
    sb.from('productos').select('*, producto_variantes(*), producto_imagenes(*)').order('fecha_creado', { ascending: false }),
    sb.from('categorias').select('*').order('orden'),
    sb.from('pedidos').select('*, abonos(*)').order('fecha', { ascending: false }),
    sb.from('arreglos').select('*, abonos(*)').order('fecha', { ascending: false }),
    sb.from('ventas').select('*').order('fecha', { ascending: false }),
    sb.from('profiles').select('*').eq('rol', 'cliente').order('created_at', { ascending: false }),
  ]);

  DB.ordenes    = ordenes.data    || [];
  DB.productos  = productos.data  || [];
  DB.categorias = categorias.data || [];
  DB.pedidos    = pedidos.data    || [];
  DB.arreglos   = arreglos.data   || [];
  DB.ventas     = ventas.data     || [];
  DB.clientes   = clientes.data   || [];

  populatePagoSelects();
}

// ─── 7. DASHBOARD ───────────────────────────────────────────────────
function renderDashboard() {
  const hoy = today();
  const ventasHoy   = DB.ventas.filter(v => v.fecha === hoy);
  const ordenasHoy  = DB.ordenes.filter(o => o.fecha === hoy);
  const pendientes  = DB.ordenes.filter(o => o.estado === 'pendiente').length;
  const totalVentas = DB.ventas.reduce((a, v) => a + Number(v.total || 0), 0);

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('stat-ventas-hoy',    fmtMoney(ventasHoy.reduce((a, v) => a + Number(v.total||0), 0)));
  set('stat-ordenes-hoy',   ordenasHoy.length);
  set('stat-pendientes',    pendientes);
  set('stat-total-ventas',  fmtMoney(totalVentas));
  set('stat-clientes',      DB.clientes.length);
  set('stat-productos',     DB.productos.length);
}
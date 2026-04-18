// ─── RICWER — supabase.js (shared) ──────────────────────────────────
// Importar este archivo PRIMERO en cualquier página que use Supabase
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// <script src="/public/js/shared/supabase.js"></script>

const SUPABASE_URL      = 'https://rrvaklhrwirevdroofaq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_y4CDF1S_OP_hD3XwJaP7CA_EiMsk_v3';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── AUTH HELPERS ────────────────────────────────────────────────────
async function getSession() {
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

// Reintenta hasta 5 veces con 600 ms de espera.
// Necesario porque el trigger de Supabase que crea el perfil
// puede tardar unos instantes tras el signUp.
async function getProfile(userId, retries = 5, delayMs = 600) {
  for (let i = 0; i < retries; i++) {
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) return data;

    // Si el error NO es "no rows" salimos inmediatamente
    if (error && error.code !== 'PGRST116') return null;

    // Esperar antes del siguiente intento
    if (i < retries - 1) await new Promise(r => setTimeout(r, delayMs));
  }
  return null;
}

async function signOut() {
  await sb.auth.signOut();
  window.location.href = '/index.html';
}

// ─── PROTECCIÓN DE RUTA ──────────────────────────────────────────────
// Redirige a /index.html solo si no hay sesión.
// Si el perfil no carga tras los reintentos, deja al usuario en la página
// y devuelve un perfil mínimo para no romper la UI.
async function requireAuth(expectedRol = null) {
  const session = await getSession();
  if (!session) {
    window.location.href = '/index.html';
    return null;
  }

  let profile = await getProfile(session.user.id);

  // Perfil aún no creado por el trigger → usar datos del token como fallback
  if (!profile) {
    console.warn('[requireAuth] Perfil no encontrado, usando fallback desde token.');
    profile = {
      id:       session.user.id,
      rol:      session.user.user_metadata?.rol || 'cliente',
      nombre:   session.user.user_metadata?.nombre || '',
      apellido: session.user.user_metadata?.apellido || '',
      telefono: session.user.user_metadata?.telefono || '',
    };
  }

  // Verificar rol solo si se especificó uno esperado
  if (expectedRol && profile.rol !== expectedRol) {
    window.location.href = profile.rol === 'admin' ? '/admin.html' : '/cliente.html';
    return null;
  }

  return { session, profile };
}
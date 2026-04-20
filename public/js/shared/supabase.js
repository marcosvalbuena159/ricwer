// ─── RICWER — supabase.js (shared) ──────────────────────────────────
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// <script src="./js/shared/supabase.js"></script>

const SUPABASE_URL      = 'https://rrvaklhrwirevdroofaq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_y4CDF1S_OP_hD3XwJaP7CA_EiMsk_v3';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── SESIÓN ──────────────────────────────────────────────────────────
async function getSession() {
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

// ─── PERFIL con maybeSingle() ────────────────────────────────────────
// Usa maybeSingle() en lugar de single() → devuelve null sin tirar 406
async function getProfile(userId, retries = 4, delayMs = 500) {
  for (let i = 0; i < retries; i++) {
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) return data;
    if (error) {
      console.error('[getProfile] error:', error.message);
      return null;
    }
    if (i < retries - 1) await new Promise(r => setTimeout(r, delayMs));
  }
  return null;
}

// ─── AUTO-CREAR PERFIL SI NO EXISTE ──────────────────────────────────
async function ensureProfile(session) {
  const { user } = session;
  const existing = await getProfile(user.id, 1, 0);
  if (existing) return existing;

  const meta = user.user_metadata || {};
  const { data, error } = await sb
    .from('profiles')
    .upsert({
      id:       user.id,
      rol:      meta.rol      || 'cliente',
      nombre:   meta.nombre   || '',
      apellido: meta.apellido || '',
      telefono: meta.telefono || '',
    }, { onConflict: 'id' })
    .select()
    .maybeSingle();

  if (error || !data) {
    console.warn('[ensureProfile] fallback desde token:', error?.message);
    return {
      id:       user.id,
      rol:      meta.rol      || 'cliente',
      nombre:   meta.nombre   || '',
      apellido: meta.apellido || '',
      telefono: meta.telefono || '',
      _fallback: true,
    };
  }
  return data;
}

// ─── CERRAR SESIÓN ───────────────────────────────────────────────────
async function signOut() {
  await sb.auth.signOut();
  window.location.href = '/index.html';
}

// ─── PROTECCIÓN DE RUTA ──────────────────────────────────────────────
async function requireAuth(expectedRol = null) {
  const session = await getSession();
  if (!session) {
    window.location.href = '/index.html';
    return null;
  }

  const profile = await ensureProfile(session);

  if (expectedRol && profile.rol !== expectedRol) {
    window.location.href = profile.rol === 'admin' ? '/admin.html' : '/cliente.html';
    return null;
  }

  return { session, profile };
}
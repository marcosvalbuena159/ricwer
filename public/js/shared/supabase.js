// ─── RICWER — supabase.js (shared) ──────────────────────────────────
// Importar este archivo PRIMERO en cualquier página que use Supabase
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// <script src="/public/js/shared/supabase.js"></script>

const SUPABASE_URL     = 'https://rrvaklhrwirevdroofaq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_y4CDF1S_OP_hD3XwJaP7CA_EiMsk_v3';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── AUTH HELPERS ────────────────────────────────────────────────────
async function getSession() {
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

async function getProfile(userId) {
  const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
  return data;
}

async function signOut() {
  await sb.auth.signOut();
  window.location.href = '/index.html';
}

// Protege una página: redirige si no hay sesión o si el rol no coincide
async function requireAuth(expectedRol = null) {
  const session = await getSession();
  if (!session) { window.location.href = '/index.html'; return null; }
  const profile = await getProfile(session.user.id);
  if (!profile) { window.location.href = '/index.html'; return null; }
  if (expectedRol && profile.rol !== expectedRol) {
    window.location.href = profile.rol === 'admin' ? '/admin.html' : '/cliente.html';
    return null;
  }
  return { session, profile };
}
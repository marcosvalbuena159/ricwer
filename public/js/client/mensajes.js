// ─── RICWER CLIENT — mensajes.js ────────────────────────────────────
let _mensajes   = [];
let _currentMsg = null;

// ─── RENDER LISTA ────────────────────────────────────────────────────
async function renderMensajes() {
  const listEl = document.getElementById('msg-list-items');
  if (!listEl) return;

  listEl.innerHTML = `<div class="np-empty">⏳ Cargando...</div>`;

  const { data } = await sb
    .from('mensajes')
    .select('*, mensaje_respuestas(id)')
    .eq('user_id', APP.user.id)
    .order('updated_at', { ascending: false });

  _mensajes = data || [];

  // Cargar órdenes para el select del modal
  cargarOrdenesSelect();

  if (!_mensajes.length) {
    listEl.innerHTML = `
      <div class="np-empty">
        <div style="font-size:40px;margin-bottom:12px">💬</div>
        <p>Sin mensajes aún</p>
        <button class="btn btn-gold btn-sm" style="margin-top:12px" onclick="openNuevoMensaje()">Enviar primer mensaje</button>
      </div>`;
    return;
  }

  listEl.innerHTML = _mensajes.map(m => `
    <div class="msg-item ${!m.leido_user ? 'unread' : ''} ${_currentMsg?.id === m.id ? 'active' : ''}"
      onclick="openThread('${m.id}')">
      <div class="msg-item-tipo">${tipoBadge(m.tipo)}</div>
      <div class="msg-item-subject">${m.asunto}</div>
      <div class="msg-item-preview">${m.cuerpo.slice(0, 70)}...</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
        <div class="msg-item-date">${fmtDatetime(m.updated_at)}</div>
        <div style="display:flex;gap:6px;align-items:center">
          ${estadoMsgBadge(m.estado)}
          ${(m.mensaje_respuestas?.length || 0) > 0 ? `<span style="font-size:10px;color:var(--text-dim)">💬${m.mensaje_respuestas.length}</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function estadoMsgBadge(estado) {
  const map = { abierto: 'b-yellow', en_proceso: 'b-blue', resuelto: 'b-green', cerrado: 'b-gray' };
  const labels = { abierto: 'Abierto', en_proceso: 'En proceso', resuelto: 'Resuelto', cerrado: 'Cerrado' };
  return `<span class="badge ${map[estado] || 'b-gray'}" style="font-size:9px">${labels[estado] || estado}</span>`;
}

// ─── ABRIR HILO ──────────────────────────────────────────────────────
async function openThread(msgId) {
  const msg = _mensajes.find(m => m.id === msgId);
  if (!msg) return;
  _currentMsg = msg;

  // Marcar como leído
  if (!msg.leido_user) {
    await sb.from('mensajes').update({ leido_user: true }).eq('id', msgId);
    msg.leido_user = true;
    // Actualizar estilo en la lista
    document.querySelector(`.msg-item[onclick*="${msgId}"]`)?.classList.remove('unread');
  }

  // Obtener respuestas
  const { data: respuestas } = await sb
    .from('mensaje_respuestas')
    .select('*, profiles(nombre,apellido)')
    .eq('mensaje_id', msgId)
    .order('created_at');

  const threadEl = document.getElementById('msg-thread');
  threadEl.innerHTML = `
    <div class="msg-thread-header">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
        <div>
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
            ${tipoBadge(msg.tipo)}
            ${estadoMsgBadge(msg.estado)}
          </div>
          <div class="msg-thread-title">${msg.asunto}</div>
          <div class="msg-thread-meta">
            ${msg.calificacion ? starsHTML(msg.calificacion) + ' · ' : ''}
            ${fmtDatetime(msg.created_at)}
            ${msg.orden_id ? ` · 📦 Pedido vinculado` : ''}
          </div>
        </div>
      </div>
    </div>
    <div class="msg-thread-body" id="thread-body">
      <!-- Mensaje original -->
      <div class="msg-bubble client">
        <div>${msg.cuerpo}</div>
        <div class="msg-bubble-meta">Tú · ${fmtDatetime(msg.created_at)}</div>
      </div>
      <!-- Respuestas -->
      ${(respuestas || []).map(r => `
        <div class="msg-bubble ${r.es_admin ? 'admin' : 'client'}">
          <div>${r.cuerpo}</div>
          <div class="msg-bubble-meta">
            ${r.es_admin
              ? `<strong style="color:var(--gold)">RICWER</strong>`
              : `Tú`
            } · ${fmtDatetime(r.created_at)}
          </div>
        </div>
      `).join('')}
      ${msg.estado === 'cerrado' ? `
        <div style="text-align:center;font-size:12px;color:var(--text-dim);padding:12px;border-top:1px solid var(--border)">
          Este ticket está cerrado.
        </div>
      ` : ''}
    </div>
    ${msg.estado !== 'cerrado' ? `
      <div class="msg-reply-box">
        <textarea class="msg-reply-input" id="reply-input" placeholder="Escribe tu respuesta..." rows="2"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();enviarRespuesta()}"
        ></textarea>
        <button class="btn btn-gold btn-sm" onclick="enviarRespuesta()" style="align-self:flex-end">
          Enviar →
        </button>
      </div>
    ` : ''}
  `;

  // Scroll al fondo
  const body = document.getElementById('thread-body');
  if (body) body.scrollTop = body.scrollHeight;

  // Resaltar en lista
  document.querySelectorAll('.msg-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('onclick')?.includes(msgId));
  });
}

// ─── ENVIAR RESPUESTA ────────────────────────────────────────────────
async function enviarRespuesta() {
  if (!_currentMsg) return;
  const input = document.getElementById('reply-input');
  const cuerpo = input?.value.trim();
  if (!cuerpo) return;

  input.value = '';
  input.disabled = true;

  const { data, error } = await sb.from('mensaje_respuestas').insert({
    mensaje_id: _currentMsg.id,
    user_id:    APP.user.id,
    es_admin:   false,
    cuerpo,
    leido:      false,
  }).select().single();

  input.disabled = false;

  if (error) { toast('Error enviando respuesta', 'error'); input.value = cuerpo; return; }

  // Actualizar updated_at del mensaje
  await sb.from('mensajes').update({ updated_at: new Date().toISOString() }).eq('id', _currentMsg.id);

  // Agregar bubble al DOM sin re-cargar todo
  const body = document.getElementById('thread-body');
  if (body) {
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble client';
    bubble.innerHTML = `<div>${cuerpo}</div><div class="msg-bubble-meta">Tú · ahora</div>`;
    body.insertBefore(bubble, body.lastElementChild?.tagName === 'DIV' && body.lastElementChild.classList.contains('msg-bubble') ? null : body.lastElementChild);
    body.scrollTop = body.scrollHeight;
  }
}

// ─── NUEVO MENSAJE MODAL ─────────────────────────────────────────────
function openNuevoMensaje() {
  document.getElementById('msg-tipo').value = 'soporte';
  document.getElementById('msg-asunto').value = '';
  document.getElementById('msg-cuerpo').value = '';
  document.getElementById('msg-calificacion').value = '';
  resetStars();
  toggleCalificacionField();
  openModal('modal-mensaje');
}

async function cargarOrdenesSelect() {
  const sel = document.getElementById('msg-orden-id');
  if (!sel) return;
  const { data } = await sb.from('ordenes').select('id, numero_orden').eq('user_id', APP.user.id).order('created_at', { ascending: false }).limit(10);
  sel.innerHTML = '<option value="">— Sin pedido relacionado —</option>' +
    (data || []).map(o => `<option value="${o.id}">${o.numero_orden}</option>`).join('');
}

// Mostrar/ocultar campo calificación según tipo
document.addEventListener('change', e => {
  if (e.target.id === 'msg-tipo') toggleCalificacionField();
});

function toggleCalificacionField() {
  const tipo = document.getElementById('msg-tipo')?.value;
  const wrap = document.getElementById('msg-cal-wrap');
  if (wrap) wrap.style.display = tipo === 'calificacion' ? 'block' : 'none';
}

// Star rating interactivo
function resetStars() {
  document.querySelectorAll('#star-rating span').forEach(s => s.textContent = '☆');
  document.getElementById('msg-calificacion').value = '';
}

document.addEventListener('click', e => {
  if (e.target.closest('#star-rating')) {
    const val = Number(e.target.dataset.val);
    if (!val) return;
    document.getElementById('msg-calificacion').value = val;
    document.querySelectorAll('#star-rating span').forEach((s, i) => {
      s.textContent = i < val ? '★' : '☆';
      s.style.color = i < val ? 'var(--gold)' : 'var(--text-dim)';
    });
  }
});

async function enviarMensaje() {
  const tipo  = document.getElementById('msg-tipo')?.value;
  const asunto = document.getElementById('msg-asunto')?.value.trim();
  const cuerpo = document.getElementById('msg-cuerpo')?.value.trim();
  const cal    = document.getElementById('msg-calificacion')?.value;
  const orden  = document.getElementById('msg-orden-id')?.value;

  if (!asunto) { toast('Escribe el asunto', 'error'); return; }
  if (!cuerpo) { toast('Escribe el mensaje', 'error'); return; }
  if (tipo === 'calificacion' && !cal) { toast('Selecciona una calificación', 'error'); return; }

  const { data, error } = await sb.from('mensajes').insert({
    user_id:     APP.user.id,
    tipo,
    asunto,
    cuerpo,
    calificacion: cal ? Number(cal) : null,
    orden_id:    orden || null,
    estado:      'abierto',
    leido_admin: false,
    leido_user:  true,
  }).select().single();

  if (error) { toast('Error enviando mensaje', 'error'); return; }

  toast('✅ Mensaje enviado. Te responderemos pronto.', 'success');
  closeModal('modal-mensaje');
  renderMensajes();
  setTimeout(() => openThread(data.id), 300);
}
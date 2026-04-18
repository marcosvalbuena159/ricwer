// ─── RICWER CLIENT — perfil.js + ordenes ────────────────────────────

// ─── PERFIL ──────────────────────────────────────────────────────────
async function renderPerfil() {
  const el = document.getElementById('perfil-content');
  if (!el) return;

  const { data: dirs } = await sb.from('direcciones').select('*').eq('user_id', APP.user.id).order('es_principal', { ascending: false });
  const { count: ordCount } = await sb.from('ordenes').select('id', { count: 'exact' }).eq('user_id', APP.user.id);
  const { data: favs } = await sb.from('favoritos').select('producto_id').eq('user_id', APP.user.id);

  const nombre   = APP.profile?.nombre || '';
  const apellido = APP.profile?.apellido || '';
  const initials = (nombre.charAt(0) + apellido.charAt(0)).toUpperCase() || '?';

  el.innerHTML = `
    <div class="perfil-header">
      <div class="perfil-avatar">${initials}</div>
      <div>
        <div class="perfil-name">${nombre} ${apellido}</div>
        <div class="perfil-email">${APP.user?.email || ''}</div>
        <div class="perfil-meta">
          <div class="perfil-stat"><strong>${ordCount || 0}</strong>Pedidos</div>
          <div class="perfil-stat"><strong>${favs?.length || 0}</strong>Favoritos</div>
        </div>
      </div>
    </div>

    <div class="perfil-tabs">
      <button class="perfil-tab active" onclick="switchPerfilTab('datos')">Mis datos</button>
      <button class="perfil-tab" onclick="switchPerfilTab('dirs')">Direcciones</button>
      <button class="perfil-tab" onclick="switchPerfilTab('security')">Seguridad</button>
    </div>

    <!-- Datos personales -->
    <div class="perfil-panel active" id="pp-datos">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:28px;max-width:560px">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Nombre</label>
            <input class="form-input" id="pf-nombre" value="${nombre}" />
          </div>
          <div class="form-group">
            <label class="form-label">Apellido</label>
            <input class="form-input" id="pf-apellido" value="${apellido}" />
          </div>
          <div class="form-group span2">
            <label class="form-label">Teléfono</label>
            <input class="form-input" id="pf-tel" value="${APP.profile?.telefono || ''}" placeholder="+57 300 000 0000" type="tel" />
          </div>
          <div class="form-group span2">
            <label class="form-label">Correo electrónico</label>
            <input class="form-input" value="${APP.user?.email || ''}" disabled style="opacity:0.5" />
          </div>
        </div>
        <button class="btn btn-gold btn-sm" style="margin-top:20px" onclick="guardarPerfil()">Guardar cambios</button>
      </div>
    </div>

    <!-- Direcciones -->
    <div class="perfil-panel" id="pp-dirs">
      <div style="max-width:600px">
        <div id="dirs-list">
          ${(dirs || []).length === 0 ? `
            <div style="padding:40px;text-align:center;color:var(--text-muted)">
              <div style="font-size:40px;margin-bottom:12px">📍</div>
              <p>No tienes direcciones guardadas.</p>
            </div>
          ` : (dirs || []).map(d => `
            <div style="background:var(--surface);border:1px solid ${d.es_principal ? 'var(--gold)' : 'var(--border)'};border-radius:var(--radius-lg);padding:20px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
              <div>
                <div style="font-weight:600;color:var(--text);margin-bottom:4px">${d.alias || 'Casa'} ${d.es_principal ? '<span style="font-size:10px;color:var(--gold)">⭐ Principal</span>' : ''}</div>
                <div style="font-size:13px;color:var(--text-muted);line-height:1.6">${d.direccion}<br>${d.ciudad}, ${d.departamento}${d.telefono ? '<br>📱 ' + d.telefono : ''}</div>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px">
                ${!d.es_principal ? `<button class="btn btn-ghost btn-sm" onclick="setPrincipalDir('${d.id}')">⭐ Principal</button>` : ''}
                <button class="btn btn-danger btn-sm" onclick="deleteDir('${d.id}')">× Eliminar</button>
              </div>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-outline btn-sm" onclick="toggleNuevaDirPerfil()">+ Agregar dirección</button>
        <div id="nueva-dir-perfil" style="display:none;margin-top:16px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px">
          <div class="form-grid">
            <div class="form-group span2">
              <label class="form-label">Dirección *</label>
              <input class="form-input" id="ndp-dir" placeholder="Calle 10 # 43-55, Apto 301" />
            </div>
            <div class="form-group">
              <label class="form-label">Ciudad *</label>
              <input class="form-input" id="ndp-ciudad" value="Medellín" />
            </div>
            <div class="form-group">
              <label class="form-label">Departamento</label>
              <input class="form-input" id="ndp-depto" value="Antioquia" />
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input class="form-input" id="ndp-tel" placeholder="+57 300" type="tel" />
            </div>
            <div class="form-group">
              <label class="form-label">Alias</label>
              <input class="form-input" id="ndp-alias" value="Casa" />
            </div>
          </div>
          <div style="display:flex;gap:10px;margin-top:14px">
            <button class="btn btn-gold btn-sm" onclick="guardarDirPerfil()">Guardar</button>
            <button class="btn btn-outline btn-sm" onclick="toggleNuevaDirPerfil()">Cancelar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Seguridad -->
    <div class="perfil-panel" id="pp-security">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:28px;max-width:420px">
        <h3 style="font-family:var(--font-display);font-size:20px;letter-spacing:2px;margin-bottom:20px">CAMBIAR CONTRASEÑA</h3>
        <div class="form-group" style="margin-bottom:14px">
          <label class="form-label">Nueva contraseña</label>
          <input class="form-input" id="pf-pass1" type="password" placeholder="Mínimo 8 caracteres" />
        </div>
        <div class="form-group" style="margin-bottom:20px">
          <label class="form-label">Confirmar contraseña</label>
          <input class="form-input" id="pf-pass2" type="password" placeholder="Repite la contraseña" />
        </div>
        <button class="btn btn-gold btn-sm" onclick="cambiarPassword()">Actualizar contraseña</button>
        <div class="divider" style="margin:28px 0"></div>
        <h3 style="font-family:var(--font-display);font-size:18px;letter-spacing:2px;margin-bottom:12px;color:var(--red)">ZONA DE PELIGRO</h3>
        <button class="btn btn-danger btn-sm btn-full" onclick="if(confirm('¿Cerrar sesión en todos los dispositivos?')) doSignOut()">
          Cerrar sesión en todos los dispositivos
        </button>
      </div>
    </div>
  `;
}

function switchPerfilTab(id) {
  document.querySelectorAll('.perfil-tab').forEach((t, i) => {
    const panels = ['datos', 'dirs', 'security'];
    t.classList.toggle('active', panels[i] === id);
  });
  document.querySelectorAll('.perfil-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('pp-' + id)?.classList.add('active');
}

async function guardarPerfil() {
  const nombre   = document.getElementById('pf-nombre')?.value.trim();
  const apellido = document.getElementById('pf-apellido')?.value.trim();
  const tel      = document.getElementById('pf-tel')?.value.trim();
  if (!nombre) { toast('El nombre es requerido', 'error'); return; }

  const { error } = await sb.from('profiles').update({ nombre, apellido, telefono: tel, updated_at: new Date().toISOString() }).eq('id', APP.user.id);
  if (error) { toast('Error guardando cambios', 'error'); return; }

  APP.profile = { ...APP.profile, nombre, apellido, telefono: tel };
  updateUserUI();
  toast('✅ Perfil actualizado', 'success');
}

async function cambiarPassword() {
  const p1 = document.getElementById('pf-pass1')?.value;
  const p2 = document.getElementById('pf-pass2')?.value;
  if (!p1 || p1.length < 8) { toast('Contraseña mínima 8 caracteres', 'error'); return; }
  if (p1 !== p2) { toast('Las contraseñas no coinciden', 'error'); return; }
  const { error } = await sb.auth.updateUser({ password: p1 });
  if (error) { toast('Error actualizando contraseña', 'error'); return; }
  toast('✅ Contraseña actualizada', 'success');
  document.getElementById('pf-pass1').value = '';
  document.getElementById('pf-pass2').value = '';
}

function toggleNuevaDirPerfil() {
  const f = document.getElementById('nueva-dir-perfil');
  if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

async function guardarDirPerfil() {
  const dir    = document.getElementById('ndp-dir')?.value.trim();
  const ciudad = document.getElementById('ndp-ciudad')?.value.trim() || 'Medellín';
  const depto  = document.getElementById('ndp-depto')?.value.trim() || 'Antioquia';
  const tel    = document.getElementById('ndp-tel')?.value.trim();
  const alias  = document.getElementById('ndp-alias')?.value.trim() || 'Casa';
  if (!dir) { toast('Ingresa la dirección', 'error'); return; }
  const { error } = await sb.from('direcciones').insert({ user_id: APP.user.id, alias, direccion: dir, ciudad, departamento: depto, telefono: tel, es_principal: false });
  if (error) { toast('Error guardando dirección', 'error'); return; }
  toast('✅ Dirección guardada', 'success');
  renderPerfil();
}

async function setPrincipalDir(id) {
  await sb.from('direcciones').update({ es_principal: false }).eq('user_id', APP.user.id);
  await sb.from('direcciones').update({ es_principal: true }).eq('id', id);
  toast('✅ Dirección principal actualizada', 'success');
  renderPerfil();
}

async function deleteDir(id) {
  if (!confirm('¿Eliminar esta dirección?')) return;
  await sb.from('direcciones').delete().eq('id', id);
  toast('Dirección eliminada');
  renderPerfil();
}

// ─── ÓRDENES ─────────────────────────────────────────────────────────
async function renderOrdenes() {
  const el = document.getElementById('ordenes-list');
  if (!el) return;
  el.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)">⏳ Cargando pedidos...</div>`;

  const { data: ordenes } = await sb
    .from('ordenes')
    .select('*, orden_items(*)')
    .eq('user_id', APP.user.id)
    .order('created_at', { ascending: false });

  if (!ordenes?.length) {
    el.innerHTML = `
      <div style="text-align:center;padding:80px 20px;color:var(--text-muted)">
        <div style="font-size:64px;margin-bottom:16px;opacity:0.2">📦</div>
        <p style="font-size:16px;margin-bottom:24px">Aún no tienes pedidos</p>
        <button class="btn btn-gold" onclick="showSection('catalogo')">Explorar catálogo</button>
      </div>`;
    return;
  }

  el.innerHTML = ordenes.map(o => {
    const items = o.orden_items || [];
    const resumen = items.slice(0, 3).map(i => `${i.producto_nombre}${i.talla ? ' T' + i.talla : ''}`).join(', ');
    return `
      <div class="orden-card">
        <div class="orden-card-header">
          <div>
            <div class="orden-num">${o.numero_orden}</div>
            <div class="orden-fecha">Realizado el ${fmtDate(o.fecha)}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            ${estadoBadge(o.estado)}
            ${o.tipo_entrega === 'domicilio' ? '<span class="badge b-blue">🚚 Domicilio</span>' : '<span class="badge b-gold">🏪 Tienda</span>'}
          </div>
        </div>
        <div class="orden-body">
          <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px">${resumen}${items.length > 3 ? ` y ${items.length - 3} más` : ''}</div>
          ${o.direccion_texto ? `<div style="font-size:12px;color:var(--text-dim)">📍 ${o.direccion_texto}</div>` : ''}
        </div>
        <div class="orden-card-footer">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:13px;color:var(--text-muted)">Total:</span>
            <span class="orden-total"><span>${fmtMoneyFull(o.total)}</span></span>
          </div>
          <div style="display:flex;gap:8px">
            ${o.estado !== 'cancelado' && o.estado !== 'entregado' ? `
              <button class="btn btn-outline btn-sm" onclick="openMensajeOrden('${o.id}','${o.numero_orden}')">¿Problema?</button>
            ` : ''}
            <button class="btn btn-ghost btn-sm" onclick="verDetalleOrden('${o.id}')">Ver detalle →</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openMensajeOrden(ordenId, numeroOrden) {
  document.getElementById('msg-tipo').value = 'soporte';
  document.getElementById('msg-asunto').value = `Consulta sobre pedido ${numeroOrden}`;
  const sel = document.getElementById('msg-orden-id');
  if (sel) {
    const opt = new Option(numeroOrden, ordenId, true, true);
    sel.add(opt);
  }
  openModal('modal-mensaje');
}

async function verDetalleOrden(ordenId) {
  const { data: o } = await sb.from('ordenes').select('*, orden_items(*)').eq('id', ordenId).single();
  if (!o) return;

  const items = o.orden_items || [];
  const modal = document.createElement('div');
  modal.className = 'modal-overlay open';
  modal.id = 'modal-orden-detalle';
  modal.innerHTML = `
    <div class="modal-box" style="max-width:600px">
      <div class="modal-head">
        <h3>${o.numero_orden}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap">
          ${estadoBadge(o.estado)}
          ${o.tipo_entrega === 'domicilio' ? '<span class="badge b-blue">🚚 Domicilio</span>' : '<span class="badge b-gold">🏪 Recogida en tienda</span>'}
        </div>
        <div style="background:var(--surface2);border-radius:var(--radius);padding:14px;margin-bottom:20px;font-size:13px;color:var(--text-muted);display:flex;flex-direction:column;gap:6px">
          <div>📅 Fecha: ${fmtDate(o.fecha)}</div>
          <div>💳 Pago: ${o.metodo_pago || '—'}</div>
          ${o.direccion_texto ? `<div>📍 ${o.direccion_texto}</div>` : ''}
          ${o.notas_cliente ? `<div>📝 ${o.notas_cliente}</div>` : ''}
        </div>
        <div style="margin-bottom:16px">
          ${items.map(i => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);font-size:13px">
              <div>
                <div style="font-weight:500;color:var(--text)">${i.producto_nombre}</div>
                <div style="color:var(--text-muted);font-size:11px">${i.talla ? 'T' + i.talla : ''} ${i.color ? '· ' + i.color : ''} × ${i.cantidad}</div>
              </div>
              <div style="font-weight:600;color:var(--white)">${fmtMoneyFull(i.subtotal)}</div>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:13px">
          ${o.descuento > 0 ? `<div style="display:flex;justify-content:space-between;color:var(--green)"><span>Descuento</span><span>-${fmtMoneyFull(o.descuento)}</span></div>` : ''}
          ${o.costo_envio > 0 ? `<div style="display:flex;justify-content:space-between;color:var(--text-muted)"><span>Envío</span><span>${fmtMoneyFull(o.costo_envio)}</span></div>` : ''}
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;color:var(--white);padding-top:8px;border-top:1px solid var(--border)"><span>TOTAL</span><span style="color:var(--gold)">${fmtMoneyFull(o.total)}</span></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}
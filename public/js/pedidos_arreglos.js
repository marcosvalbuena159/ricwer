// ─── PEDIDOS ─────────────────────────────────────────────────────────
function renderPedidos() {
  const q = (document.getElementById('ped-search').value || '').toLowerCase();
  const est = document.getElementById('ped-estado-filter').value;
  let list = DB.pedidos.filter(p =>
    (!q || `${p.cliente} ${p.desc} ${p.tel}`.toLowerCase().includes(q)) &&
    (!est || p.estado === est)
  ).slice().reverse();

  const empty = document.getElementById('ped-empty');
  const tbody = document.getElementById('ped-tbody');
  if (!list.length) { empty.style.display = 'block'; tbody.innerHTML = ''; return; }
  empty.style.display = 'none';

  tbody.innerHTML = list.map(p => {
    const saldo = getSaldo(p);
    const abonado = getAbonados(p);
    const totalPagado = Number(p.anticipo || 0) + abonado;
    return `<tr>
      <td style="white-space:nowrap">${fmtDate(p.entrega || p.fecha)}<br>
        <span style="font-size:10px;color:var(--text-muted)">${fmtDate(p.fecha)}</span></td>
      <td>
        <div style="font-weight:500">${p.cliente || '—'}</div>
        ${p.tel ? `<div style="font-size:11px;color:var(--text-muted)">📱 ${p.tel}</div>` : ''}
      </td>
      <td style="max-width:180px;font-size:12px;color:var(--text-muted)">${p.desc || '—'}</td>
      <td>
        <div style="font-weight:600;color:var(--blue-dark)">${fmtMoneyFull(p.total)}</div>
        <div style="font-size:11px;color:var(--text-muted)">Pagado: ${fmtMoneyFull(totalPagado)}</div>
        ${progressBar(p)}
      </td>
      <td style="font-weight:600;color:${saldo > 0 ? 'var(--accent)' : '#065f46'}">${saldo > 0 ? fmtMoneyFull(saldo) : '✓ Pagado'}</td>
      <td>${badge(p.estado, ESTADO_PEDIDO_CLASS[p.estado] || 'b-blue')}</td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" onclick="editPedido('${p.id}')">✏️</button>
          <button class="btn btn-success btn-sm" onclick="openAbonoModal('pedidos','${p.id}')">💰 Abonar</button>
          <button class="btn btn-danger btn-sm" onclick="deleteItem('pedidos','${p.id}',renderPedidos)">×</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function openNuevoPedido() {
  document.getElementById('modal-ped-title').textContent = 'Nuevo pedido / Encargo';
  document.getElementById('pe-id').value = '';
  ['pe-cliente','pe-tel','pe-desc','pe-notas'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('pe-anticipo').value = '0';
  document.getElementById('pe-total').value = '0';
  document.getElementById('pe-entrega').value = '';
  document.getElementById('pe-estado').value = 'Pendiente';
  document.getElementById('pe-pago-anticipo').innerHTML = mediosPagoOptions('Efectivo');
  openModal('modal-pedido');
}

function savePedido() {
  const id = document.getElementById('pe-id').value || uid();
  const cliente = document.getElementById('pe-cliente').value.trim();
  if (!cliente) { alert('Escribe el nombre del cliente.'); return; }
  const existing = DB.pedidos.find(x => x.id === id);
  const abonos = existing ? existing.abonos || [] : [];
  const obj = {
    id, cliente,
    tel: document.getElementById('pe-tel').value.trim(),
    desc: document.getElementById('pe-desc').value.trim(),
    anticipo: Number(document.getElementById('pe-anticipo').value || 0),
    pagoAnticipo: document.getElementById('pe-pago-anticipo').value,
    total: Number(document.getElementById('pe-total').value || 0),
    entrega: document.getElementById('pe-entrega').value,
    estado: document.getElementById('pe-estado').value,
    notas: document.getElementById('pe-notas').value.trim(),
    fecha: existing ? existing.fecha : today(),
    abonos
  };
  const idx = DB.pedidos.findIndex(x => x.id === id);
  if (idx >= 0) DB.pedidos[idx] = obj; else DB.pedidos.push(obj);
  saveDB(); closeModal('modal-pedido'); renderPedidos(); updateNavBadges();
}

function editPedido(id) {
  const p = DB.pedidos.find(x => x.id === id); if (!p) return;
  document.getElementById('modal-ped-title').textContent = 'Editar pedido';
  document.getElementById('pe-id').value = p.id;
  document.getElementById('pe-cliente').value = p.cliente || '';
  document.getElementById('pe-tel').value = p.tel || '';
  document.getElementById('pe-desc').value = p.desc || '';
  document.getElementById('pe-anticipo').value = p.anticipo || '0';
  document.getElementById('pe-total').value = p.total || '0';
  document.getElementById('pe-entrega').value = p.entrega || '';
  document.getElementById('pe-estado').value = p.estado || 'Pendiente';
  document.getElementById('pe-notas').value = p.notas || '';
  document.getElementById('pe-pago-anticipo').innerHTML = mediosPagoOptions(p.pagoAnticipo || 'Efectivo');
  openModal('modal-pedido');
}

// ─── ARREGLOS ────────────────────────────────────────────────────────
function renderArreglos() {
  const q = (document.getElementById('arr-search').value || '').toLowerCase();
  const est = document.getElementById('arr-estado-filter').value;
  let list = DB.arreglos.filter(a =>
    (!q || `${a.cliente} ${a.tipo} ${a.desc} ${a.tel}`.toLowerCase().includes(q)) &&
    (!est || a.estado === est)
  ).slice().reverse();

  const empty = document.getElementById('arr-empty');
  const tbody = document.getElementById('arr-tbody');
  if (!list.length) { empty.style.display = 'block'; tbody.innerHTML = ''; return; }
  empty.style.display = 'none';

  tbody.innerHTML = list.map(a => {
    const saldo = getSaldo(a);
    const abonado = getAbonados(a);
    const totalPag = Number(a.anticipo || 0) + abonado;
    return `<tr>
      <td style="white-space:nowrap">
        <div>${fmtDate(a.fecha)}</div>
        ${a.entrega ? `<div style="font-size:10px;color:var(--text-muted)">Entrega: ${fmtDate(a.entrega)}</div>` : ''}
      </td>
      <td>
        <div style="font-weight:500">${a.cliente || '—'}</div>
        ${a.tel ? `<div style="font-size:11px;color:var(--text-muted)">📱 ${a.tel}</div>` : ''}
      </td>
      <td><span class="chip chip-gold">${a.tipo || '—'}</span></td>
      <td style="max-width:160px;font-size:12px;color:var(--text-muted)">${a.desc || '—'}</td>
      <td>
        <div style="font-weight:600;color:var(--blue-dark)">${fmtMoneyFull(a.costo)}</div>
        <div style="font-size:11px;color:var(--text-muted)">Pagado: ${fmtMoneyFull(totalPag)}</div>
        ${progressBar(a)}
      </td>
      <td style="font-weight:600;color:${saldo > 0 ? 'var(--accent)' : '#065f46'}">${saldo > 0 ? fmtMoneyFull(saldo) : '✓ Pagado'}</td>
      <td>${badge(a.estado, ESTADO_ARREGLO_CLASS[a.estado] || 'b-blue')}</td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" onclick="editArreglo('${a.id}')">✏️</button>
          <button class="btn btn-success btn-sm" onclick="openAbonoModal('arreglos','${a.id}')">💰 Abonar</button>
          <button class="btn btn-danger btn-sm" onclick="deleteItem('arreglos','${a.id}',renderArreglos)">×</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function openNuevoArreglo() {
  document.getElementById('modal-arr-title').textContent = 'Nuevo arreglo';
  document.getElementById('a-id').value = '';
  ['a-cliente','a-tel','a-desc'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('a-costo').value = '0';
  document.getElementById('a-anticipo').value = '0';
  document.getElementById('a-fecha').value = today();
  document.getElementById('a-entrega').value = '';
  document.getElementById('a-tipo').selectedIndex = 0;
  document.getElementById('a-estado').value = 'Recibido';
  document.getElementById('a-pago-anticipo').innerHTML = mediosPagoOptions('Efectivo');
  openModal('modal-arreglo');
}

function saveArreglo() {
  const id = document.getElementById('a-id').value || uid();
  const cliente = document.getElementById('a-cliente').value.trim();
  if (!cliente) { alert('Escribe el nombre del cliente.'); return; }
  const existing = DB.arreglos.find(x => x.id === id);
  const abonos = existing ? existing.abonos || [] : [];
  const obj = {
    id, cliente,
    tel: document.getElementById('a-tel').value.trim(),
    tipo: document.getElementById('a-tipo').value,
    desc: document.getElementById('a-desc').value.trim(),
    costo: Number(document.getElementById('a-costo').value || 0),
    anticipo: Number(document.getElementById('a-anticipo').value || 0),
    pagoAnticipo: document.getElementById('a-pago-anticipo').value,
    entrega: document.getElementById('a-entrega').value,
    estado: document.getElementById('a-estado').value,
    fecha: document.getElementById('a-fecha').value || today(),
    total: Number(document.getElementById('a-costo').value || 0),
    abonos
  };
  const idx = DB.arreglos.findIndex(x => x.id === id);
  if (idx >= 0) DB.arreglos[idx] = obj; else DB.arreglos.push(obj);
  saveDB(); closeModal('modal-arreglo'); renderArreglos(); updateNavBadges();
}

function editArreglo(id) {
  const a = DB.arreglos.find(x => x.id === id); if (!a) return;
  document.getElementById('modal-arr-title').textContent = 'Editar arreglo';
  document.getElementById('a-id').value = a.id;
  document.getElementById('a-cliente').value = a.cliente || '';
  document.getElementById('a-tel').value = a.tel || '';
  document.getElementById('a-tipo').value = a.tipo || 'Media suela';
  document.getElementById('a-desc').value = a.desc || '';
  document.getElementById('a-costo').value = a.costo || a.total || '0';
  document.getElementById('a-anticipo').value = a.anticipo || '0';
  document.getElementById('a-entrega').value = a.entrega || '';
  document.getElementById('a-estado').value = a.estado || 'Recibido';
  document.getElementById('a-fecha').value = a.fecha || today();
  document.getElementById('a-pago-anticipo').innerHTML = mediosPagoOptions(a.pagoAnticipo || 'Efectivo');
  openModal('modal-arreglo');
}

// ─── ABONOS ──────────────────────────────────────────────────────────
let _abonoCtx = { tabla: null, id: null };

function openAbonoModal(tabla, id) {
  _abonoCtx = { tabla, id };
  renderAbonoModal();
  openModal('modal-abono');
}

function renderAbonoModal() {
  const { tabla, id } = _abonoCtx;
  const item = DB[tabla].find(x => x.id === id);
  if (!item) return;
  const abonos = item.abonos || [];
  const abonado = getAbonados(item);
  const anticipo = Number(item.anticipo || 0);
  const total = Number(item.total || item.costo || 0);
  const saldo = getSaldo(item);

  document.getElementById('abono-nombre').textContent = item.cliente || 'Cliente';
  document.getElementById('abono-pago').innerHTML = mediosPagoOptions('Efectivo');
  document.getElementById('abono-monto').value = saldo > 0 ? saldo : '';

  document.getElementById('abono-balance').innerHTML = `
    <div class="bal-item"><div class="bal-label">Total</div><div class="bal-val blue">${fmtMoneyFull(total)}</div></div>
    <div class="bal-item"><div class="bal-label">Anticipo</div><div class="bal-val">${fmtMoneyFull(anticipo)}</div></div>
    <div class="bal-item"><div class="bal-label">Abonos</div><div class="bal-val">${fmtMoneyFull(abonado)}</div></div>
    <div class="bal-item"><div class="bal-label">Saldo</div><div class="bal-val ${saldo > 0 ? 'red' : 'green'}">${saldo > 0 ? fmtMoneyFull(saldo) : '✓ Pagado'}</div></div>
  `;

  if (!abonos.length) {
    document.getElementById('abono-historial').innerHTML = '<p style="font-size:13px;color:var(--text-muted);text-align:center;padding:10px">Sin abonos registrados.</p>';
  } else {
    document.getElementById('abono-historial').innerHTML = '<div class="abono-list">' +
      abonos.map((a, i) => `
        <div class="abono-item">
          <span class="a-fecha">${fmtDate(a.fecha)}</span>
          <span class="a-pago">${pagoIcon(a.pago)}</span>
          ${a.nota ? `<span style="font-size:11px;color:var(--text-muted)">📝 ${a.nota}</span>` : ''}
          <span class="a-monto">${fmtMoneyFull(a.monto)}</span>
          <button class="btn btn-danger btn-sm" style="padding:2px 7px" onclick="deleteAbono(${i})">×</button>
        </div>`).join('') + '</div>';
  }
}

function registrarAbono() {
  const { tabla, id } = _abonoCtx;
  const item = DB[tabla].find(x => x.id === id);
  if (!item) return;
  const monto = Number(document.getElementById('abono-monto').value || 0);
  if (!monto || monto <= 0) { alert('Ingresa un monto válido.'); return; }
  if (!item.abonos) item.abonos = [];
  item.abonos.push({
    id: uid(),
    monto,
    pago: document.getElementById('abono-pago').value,
    nota: document.getElementById('abono-nota').value.trim(),
    fecha: document.getElementById('abono-fecha').value || today()
  });
  document.getElementById('abono-nota').value = '';
  document.getElementById('abono-fecha').value = today();
  const saldo = getSaldo(item);
  if (saldo <= 0 && item.estado !== 'Entregado' && item.estado !== 'Cancelado') {
    if (confirm('✅ Saldo pagado completamente. ¿Marcar como "Listo para entregar" / "Listo"?')) {
      item.estado = tabla === 'pedidos' ? 'Listo para entregar' : 'Listo';
    }
  }
  saveDB(); renderAbonoModal();
  if (tabla === 'pedidos') renderPedidos(); else renderArreglos();
  updateNavBadges();
}

function deleteAbono(idx) {
  const { tabla, id } = _abonoCtx;
  const item = DB[tabla].find(x => x.id === id);
  if (!item || !item.abonos) return;
  if (!confirm('¿Eliminar este abono?')) return;
  item.abonos.splice(idx, 1);
  saveDB(); renderAbonoModal();
  if (tabla === 'pedidos') renderPedidos(); else renderArreglos();
}

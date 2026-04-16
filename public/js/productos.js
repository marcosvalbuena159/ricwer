// ─── DASHBOARD ──────────────────────────────────────────────────────
function renderDashboard() {
  const hoy = today();
  const ventasHoy = DB.ventas.filter(v => v.fecha === hoy);
  const totalHoy = ventasHoy.reduce((s, v) => s + Number(v.total || 0), 0);
  const pedPend = DB.pedidos.filter(p => p.estado !== 'Entregado' && p.estado !== 'Cancelado').length;
  const arrAct = DB.arreglos.filter(a => a.estado !== 'Entregado').length;
  const totalProd = DB.productos.reduce((s, p) => s + Number(p.stock || 0), 0);
  const saldosPend = [
    ...DB.pedidos.filter(p => p.estado !== 'Cancelado'),
    ...DB.arreglos.filter(a => a.estado !== 'Entregado')
  ].reduce((s, x) => s + getSaldo(x), 0);

  document.getElementById('dash-stats').innerHTML = `
    <div class="stat-card amber">
      <div class="s-icon">💰</div>
      <div class="s-label">Ventas hoy</div>
      <div class="s-value gold">${fmtMoney(totalHoy)}</div>
      <div class="s-sub">${ventasHoy.length} transacción${ventasHoy.length !== 1 ? 'es' : ''}</div>
    </div>
    <div class="stat-card">
      <div class="s-icon">📦</div>
      <div class="s-label">Pedidos activos</div>
      <div class="s-value">${pedPend}</div>
      <div class="s-sub">por entregar</div>
    </div>
    <div class="stat-card">
      <div class="s-icon">🔧</div>
      <div class="s-label">Arreglos activos</div>
      <div class="s-value">${arrAct}</div>
      <div class="s-sub">en proceso</div>
    </div>
    <div class="stat-card">
      <div class="s-icon">👟</div>
      <div class="s-label">Pares en stock</div>
      <div class="s-value">${totalProd}</div>
      <div class="s-sub">productos</div>
    </div>
    <div class="stat-card amber">
      <div class="s-icon">⏳</div>
      <div class="s-label">Saldos pendientes</div>
      <div class="s-value gold">${fmtMoney(saldosPend)}</div>
      <div class="s-sub">por cobrar</div>
    </div>
  `;

  // Recent activity
  const acts = [];
  DB.ventas.slice(-5).forEach(v => acts.push({ tipo: 'venta', titulo: v.cliente || 'Cliente', sub: (v.productoNombre || 'Producto') + ' · ' + (v.pago || ''), monto: fmtMoneyFull(v.total), fecha: v.fecha, color: '#dcfce7' }));
  DB.pedidos.slice(-3).forEach(p => acts.push({ tipo: 'pedido', titulo: p.cliente || 'Cliente', sub: p.estado + (p.tel ? ' · ' + p.tel : ''), monto: fmtMoneyFull(p.total), fecha: p.fecha, color: '#fef9e6' }));
  DB.arreglos.slice(-3).forEach(a => acts.push({ tipo: 'arreglo', titulo: a.cliente || 'Cliente', sub: (a.tipo || '—') + ' · ' + a.estado, monto: fmtMoneyFull(a.costo), fecha: a.fecha, color: '#f3f0ff' }));
  acts.sort((a, b) => (b.fecha || '') > (a.fecha || '') ? 1 : -1);
  const top = acts.slice(0, 6);

  const icons = { venta: '💰', pedido: '📦', arreglo: '🔧' };
  const recentEl = document.getElementById('dash-recent');
  if (!top.length) {
    recentEl.innerHTML = '<div class="empty-state" style="padding:30px 0"><div class="e-icon">📋</div><p>Sin actividad aún</p></div>';
  } else {
    recentEl.innerHTML = `<div class="activity-list">` + top.map(r => `
      <div class="act-item">
        <div class="act-dot" style="background:${r.color}">${icons[r.tipo]}</div>
        <div class="act-info">
          <div class="act-title">${r.titulo}</div>
          <div class="act-sub">${r.sub} · ${fmtDate(r.fecha)}</div>
        </div>
        <div class="act-amount" style="color:var(--blue-dark)">${r.monto}</div>
      </div>`).join('') + `</div>`;
  }

  // Low stock
  const low = DB.productos.filter(p => Number(p.stock || 0) <= Number(p.stockmin || 2));
  const lsEl = document.getElementById('dash-lowstock');
  if (!low.length) {
    lsEl.innerHTML = '<div class="alert alert-info">✓ Todo el inventario tiene buen stock.</div>';
  } else {
    lsEl.innerHTML = low.map(p => `
      <div class="alert alert-warn">
        <span>⚠️</span>
        <div><strong>${p.nombre}</strong>${p.talla ? ' · T' + p.talla : ''}${p.color ? ' · ' + p.color : ''}<br>
        <span style="font-size:12px">Solo <strong>${p.stock}</strong> en stock (mín: ${p.stockmin || 2})</span></div>
      </div>`).join('');
  }

  updateNavBadges();
}

// ─── PRODUCTOS ───────────────────────────────────────────────────────
function renderProductos() {
  const q = (document.getElementById('prod-search').value || '').toLowerCase();
  const cat = document.getElementById('prod-cat-filter').value;
  let list = DB.productos.filter(p =>
    (!q || `${p.nombre} ${p.marca} ${p.talla} ${p.color} ${p.ref}`.toLowerCase().includes(q)) &&
    (!cat || p.categoria === cat)
  );

  const empty = document.getElementById('prod-empty');
  const tbody = document.getElementById('prod-tbody');

  if (!list.length) {
    empty.style.display = 'block'; tbody.innerHTML = ''; return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = list.map(p => {
    const stock = Number(p.stock || 0);
    const min = Number(p.stockmin || 2);
    const stockBadge = stock === 0 ? badge('Agotado', 'b-red') :
      stock <= min ? badge('Stock bajo', 'b-amber') : badge('Disponible', 'b-green');
    return `<tr>
      <td>
        <div style="font-weight:500">${p.nombre}</div>
        ${p.ref ? `<div style="font-size:11px;color:var(--text-muted)">Ref: ${p.ref}</div>` : ''}
        ${p.marca ? `<div style="font-size:11px;color:var(--text-light)">${p.marca}</div>` : ''}
      </td>
      <td><span class="chip">${p.categoria || '—'}</span></td>
      <td>${p.talla || '—'}</td>
      <td>${p.color || '—'}</td>
      <td style="color:var(--text-muted);font-size:12px">${fmtMoneyFull(p.costo)}</td>
      <td style="font-weight:600;color:var(--blue-dark)">${fmtMoneyFull(p.precio)}</td>
      <td style="font-weight:700;color:${stock <= min ? 'var(--accent)' : 'var(--blue-dark)'}">${stock}</td>
      <td>${stockBadge}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" onclick="editProducto('${p.id}')">✏️ Editar</button>
          <button class="btn btn-danger btn-sm" onclick="deleteItem('productos','${p.id}',renderProductos)">×</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function openNuevoProducto() {
  document.getElementById('modal-prod-title').textContent = 'Nuevo producto';
  document.getElementById('p-id').value = '';
  ['p-nombre','p-ref','p-marca','p-talla','p-color','p-notas'].forEach(id => document.getElementById(id).value = '');
  ['p-costo','p-precio','p-stock'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('p-stockmin').value = '2';
  document.getElementById('p-cat').selectedIndex = 0;
  openModal('modal-prod');
}

function saveProducto() {
  const id = document.getElementById('p-id').value || uid();
  const nombre = document.getElementById('p-nombre').value.trim();
  if (!nombre) { alert('Escribe el nombre del producto.'); return; }
  const obj = {
    id, nombre,
    ref: document.getElementById('p-ref').value.trim(),
    marca: document.getElementById('p-marca').value.trim(),
    categoria: document.getElementById('p-cat').value,
    talla: document.getElementById('p-talla').value.trim(),
    color: document.getElementById('p-color').value.trim(),
    costo: document.getElementById('p-costo').value || 0,
    precio: document.getElementById('p-precio').value || 0,
    stock: document.getElementById('p-stock').value || 0,
    stockmin: document.getElementById('p-stockmin').value || 2,
    notas: document.getElementById('p-notas').value.trim(),
    fechaCreado: today()
  };
  const idx = DB.productos.findIndex(p => p.id === id);
  if (idx >= 0) DB.productos[idx] = obj; else DB.productos.push(obj);
  saveDB(); closeModal('modal-prod'); renderProductos();
}

function editProducto(id) {
  const p = DB.productos.find(x => x.id === id); if (!p) return;
  document.getElementById('modal-prod-title').textContent = 'Editar producto';
  document.getElementById('p-id').value = p.id;
  document.getElementById('p-nombre').value = p.nombre || '';
  document.getElementById('p-ref').value = p.ref || '';
  document.getElementById('p-marca').value = p.marca || '';
  document.getElementById('p-cat').value = p.categoria || 'Tenis';
  document.getElementById('p-talla').value = p.talla || '';
  document.getElementById('p-color').value = p.color || '';
  document.getElementById('p-costo').value = p.costo || '';
  document.getElementById('p-precio').value = p.precio || '';
  document.getElementById('p-stock').value = p.stock || '';
  document.getElementById('p-stockmin').value = p.stockmin || 2;
  document.getElementById('p-notas').value = p.notas || '';
  openModal('modal-prod');
}

function deleteItem(table, id, cb) {
  if (!confirm('¿Eliminar este registro?')) return;
  DB[table] = DB[table].filter(x => x.id !== id);
  saveDB(); cb(); updateNavBadges();
}

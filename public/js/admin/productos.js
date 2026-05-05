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
  const vis = document.getElementById('prod-vis-filter')?.value || '';
  let list = DB.productos.filter(p =>
    (!q || `${p.nombre} ${p.marca} ${p.ref} ${p.categoria}`.toLowerCase().includes(q)) &&
    (!cat || p.categoria === cat) &&
    (!vis || (vis === 'destacado' ? p.destacado : vis === 'nuevo' ? p.es_nuevo : vis === 'inactivo' ? !p.activo : true))
  );
  const empty = document.getElementById('prod-empty');
  const tbody = document.getElementById('prod-tbody');
  if (!list.length) { empty.style.display = 'block'; tbody.innerHTML = ''; return; }
  empty.style.display = 'none';
  tbody.innerHTML = list.map(p => {
    const stock = Number(p.stock || 0);
    const min = Number(p.stockmin || 2);
    const stockBadge = stock === 0 ? badge('Agotado', 'b-red') :
      stock <= min ? badge('Stock bajo', 'b-amber') : badge('Disponible', 'b-green');
    const imgs = p.producto_imagenes || [];
    const principal = imgs.find(i => i.es_principal) || imgs[0];
    const imgHTML = principal?.url
      ? `<img src="${principal.url}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid var(--border)">`
      : `<div style="width:40px;height:40px;border-radius:6px;background:var(--surface-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:20px">👟</div>`;
    const tags = [
      p.destacado ? `<span class="chip chip-gold" style="font-size:9px">★ Dest.</span>` : '',
      p.es_nuevo  ? `<span class="chip" style="font-size:9px;background:var(--green-bg);color:var(--green)">Nuevo</span>` : '',
      !p.activo   ? `<span class="chip chip-red" style="font-size:9px">Inactivo</span>` : '',
    ].filter(Boolean).join('');
    return `<tr>
      <td style="width:44px">${imgHTML}</td>
      <td>
        <div style="font-weight:500">${p.nombre}</div>
        ${p.ref ? `<div style="font-size:11px;color:var(--text-muted)">Ref: ${p.ref}</div>` : ''}
        ${p.marca ? `<div style="font-size:11px;color:var(--text-muted)">${p.marca}</div>` : ''}
        ${tags ? `<div style="margin-top:3px;display:flex;gap:4px;flex-wrap:wrap">${tags}</div>` : ''}
      </td>
      <td><span class="chip">${p.categoria || '—'}</span></td>
      <td style="font-size:12px">${p.genero || '—'}</td>
      <td style="color:var(--text-muted);font-size:12px">${fmtMoneyFull(p.costo)}</td>
      <td>
        <div style="font-weight:600;color:var(--blue-dark)">${fmtMoneyFull(p.precio)}</div>
        ${p.precio_descuento ? `<div style="font-size:11px;color:var(--accent);text-decoration:line-through">${fmtMoneyFull(p.precio)}</div><div style="font-size:11px;color:var(--green);font-weight:700">${fmtMoneyFull(p.precio_descuento)}</div>` : ''}
      </td>
      <td style="font-weight:700;color:${stock <= min ? 'var(--accent)' : 'var(--blue-dark)'}">${stock}</td>
      <td>${stockBadge}</td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" onclick="editProducto('${p.id}')">✏️</button>
          <button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="openImagenesModal('${p.id}')">🖼️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteItemUI('productos','${p.id}',renderProductos)">×</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function openNuevoProducto() {
  document.getElementById('modal-prod-title').textContent = 'Nuevo producto';
  document.getElementById('p-id').value = '';
  ['p-nombre','p-ref','p-marca','p-notas','p-precio-desc'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  ['p-costo','p-precio','p-stock'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('p-stockmin').value = '2';
  document.getElementById('p-cat').selectedIndex = 0;
  const gen = document.getElementById('p-genero'); if (gen) gen.value = 'Unisex';
  const dest = document.getElementById('p-destacado'); if (dest) dest.checked = false;
  const nuevo = document.getElementById('p-nuevo'); if (nuevo) nuevo.checked = false;
  const activo = document.getElementById('p-activo'); if (activo) activo.checked = true;
  openModal('modal-prod');
}

async function saveProductoUI() {
  const id = document.getElementById('p-id').value || uid();
  const nombre = document.getElementById('p-nombre').value.trim();
  if (!nombre) { alert('Escribe el nombre del producto.'); return; }
  const obj = {
    id, nombre,
    ref:             document.getElementById('p-ref').value.trim(),
    marca:           document.getElementById('p-marca').value.trim(),
    categoria:       document.getElementById('p-cat').value,
    genero:          document.getElementById('p-genero')?.value || 'Unisex',
    costo:           document.getElementById('p-costo').value || 0,
    precio:          document.getElementById('p-precio').value || 0,
    precio_descuento: document.getElementById('p-precio-desc')?.value || null,
    stock:           document.getElementById('p-stock').value || 0,
    stockmin:        document.getElementById('p-stockmin').value || 2,
    activo:          document.getElementById('p-activo')?.checked !== false,
    destacado:       !!document.getElementById('p-destacado')?.checked,
    es_nuevo:        !!document.getElementById('p-nuevo')?.checked,
    notas:           document.getElementById('p-notas').value.trim(),
  };
  showLoader(true);
  await saveProducto(obj);
  // Preservar imagenes en memoria
  const existing = DB.productos.find(p => p.id === id);
  obj.producto_imagenes = existing?.producto_imagenes || [];
  const idx = DB.productos.findIndex(p => p.id === id);
  if (idx >= 0) DB.productos[idx] = obj; else DB.productos.push(obj);
  showLoader(false);
  closeModal('modal-prod'); renderProductos();
}

function editProducto(id) {
  const p = DB.productos.find(x => x.id === id); if (!p) return;
  document.getElementById('modal-prod-title').textContent = 'Editar producto';
  document.getElementById('p-id').value = p.id;
  document.getElementById('p-nombre').value = p.nombre || '';
  document.getElementById('p-ref').value = p.ref || '';
  document.getElementById('p-marca').value = p.marca || '';
  document.getElementById('p-cat').value = p.categoria || 'Tenis';
  document.getElementById('p-costo').value = p.costo || '';
  document.getElementById('p-precio').value = p.precio || '';
  document.getElementById('p-precio-desc') && (document.getElementById('p-precio-desc').value = p.precio_descuento || '');
  document.getElementById('p-stock').value = p.stock || '';
  document.getElementById('p-stockmin').value = p.stockmin || 2;
  document.getElementById('p-notas').value = p.notas || '';
  const gen = document.getElementById('p-genero'); if (gen) gen.value = p.genero || 'Unisex';
  const dest = document.getElementById('p-destacado'); if (dest) dest.checked = !!p.destacado;
  const nuevo = document.getElementById('p-nuevo'); if (nuevo) nuevo.checked = !!p.es_nuevo;
  const activo = document.getElementById('p-activo'); if (activo) activo.checked = p.activo !== false;
  openModal('modal-prod');
}

async function deleteItemUI(table, id, cb) {
  if (!confirm('¿Eliminar este registro?')) return;
  showLoader(true);
  await deleteItemDB(table, id);
  DB[table] = DB[table].filter(x => x.id !== id);
  showLoader(false);
  cb(); updateNavBadges();
}
// ─── MODAL IMÁGENES DE PRODUCTO ───────────────────────────────────────
let _imgProdId = null;

async function openImagenesModal(prodId) {
  _imgProdId = prodId;
  const prod = DB.productos.find(p => p.id === prodId);
  document.getElementById('img-modal-nombre').textContent = prod?.nombre || 'Producto';
  await renderImagenesModal();
  openModal('modal-imagenes');
}

async function renderImagenesModal() {
  const { data: imgs } = await sb
    .from('producto_imagenes')
    .select('*')
    .eq('producto_id', _imgProdId)
    .order('orden');
  const prod = DB.productos.find(p => p.id === _imgProdId);
  if (prod) prod.producto_imagenes = imgs || [];
  const el = document.getElementById('img-modal-list');
  if (!imgs?.length) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px">Sin imágenes. Sube la primera.</p>';
    return;
  }
  el.innerHTML = imgs.map(img => `
    <div style="position:relative;display:inline-block;border-radius:8px;overflow:hidden;border:2px solid ${img.es_principal ? 'var(--gold)' : 'var(--border)'};width:100px;height:100px;">
      <img src="${img.url}" alt="" style="width:100%;height:100%;object-fit:cover">
      ${img.es_principal ? '<div style="position:absolute;top:3px;left:3px;background:var(--gold);color:#000;font-size:9px;font-weight:700;padding:2px 5px;border-radius:3px">PRINCIPAL</div>' : ''}
      <div style="position:absolute;bottom:0;left:0;right:0;display:flex;gap:2px;padding:4px;background:rgba(0,0,0,0.6)">
        ${!img.es_principal ? `<button onclick="setPrincipalImgUI('${img.id}')" title="Principal" style="flex:1;background:var(--gold);border:none;border-radius:3px;font-size:10px;cursor:pointer;padding:2px">★</button>` : ''}
        <button onclick="deleteImgUI('${img.id}','${img.storage_path || ''}')" title="Eliminar" style="flex:1;background:#ef4444;border:none;border-radius:3px;color:#fff;font-size:10px;cursor:pointer;padding:2px">✕</button>
      </div>
    </div>
  `).join('');
}

async function uploadImageUI() {
  const input = document.getElementById('img-file-input');
  const files = Array.from(input.files || []);
  if (!files.length) { alert('Selecciona al menos una imagen.'); return; }
  if (!_imgProdId) { alert('Primero guarda el producto.'); return; }
  showLoader(true);
  for (const file of files) {
    await uploadProductImage(_imgProdId, file);
  }
  input.value = '';
  showLoader(false);
  await renderImagenesModal();
  renderProductos();
  toast('✅ Imagen(s) subida(s)', 'success');
}

async function setPrincipalImgUI(imgId) {
  showLoader(true);
  await setPrincipalImage(imgId, _imgProdId);
  showLoader(false);
  await renderImagenesModal();
  renderProductos();
  toast('Imagen principal actualizada ✓', 'success');
}

async function deleteImgUI(imgId, storagePath) {
  if (!confirm('¿Eliminar esta imagen?')) return;
  showLoader(true);
  await deleteProductImage(imgId, storagePath);
  showLoader(false);
  await renderImagenesModal();
  renderProductos();
}
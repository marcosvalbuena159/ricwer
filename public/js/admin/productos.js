// ─── DASHBOARD ──────────────────────────────────────────────────────
function renderDashboard() {
  const hoy = today();
  const ventasHoy = DB.ventas.filter(v => v.fecha === hoy);
  const totalHoy  = ventasHoy.reduce((s, v) => s + Number(v.total || 0), 0);
  const pedPend   = DB.pedidos.filter(p => p.estado !== 'Entregado' && p.estado !== 'Cancelado').length;
  const arrAct    = DB.arreglos.filter(a => a.estado !== 'Entregado').length;
  const totalProd = DB.productos.reduce((s, p) => s + Number(p.stock || 0), 0);
  const saldosPend = [
    ...DB.pedidos.filter(p => p.estado !== 'Cancelado'),
    ...DB.arreglos.filter(a => a.estado !== 'Entregado'),
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
      <div class="s-sub">en inventario</div>
    </div>
    <div class="stat-card amber">
      <div class="s-icon">⏳</div>
      <div class="s-label">Saldos pendientes</div>
      <div class="s-value gold">${fmtMoney(saldosPend)}</div>
      <div class="s-sub">por cobrar</div>
    </div>
  `;

  const acts = [];
  DB.ventas.slice(-5).forEach(v  => acts.push({ tipo:'venta',   titulo: v.cliente||'Cliente', sub: (v.productoNombre||'Producto')+' · '+(v.pago||''), monto: fmtMoneyFull(v.total), fecha: v.fecha, color:'#dcfce7' }));
  DB.pedidos.slice(-3).forEach(p => acts.push({ tipo:'pedido',  titulo: p.cliente||'Cliente', sub: p.estado+(p.tel?' · '+p.tel:''),                    monto: fmtMoneyFull(p.total), fecha: p.fecha, color:'#fef9e6' }));
  DB.arreglos.slice(-3).forEach(a=> acts.push({ tipo:'arreglo', titulo: a.cliente||'Cliente', sub: (a.tipo||'—')+' · '+a.estado,                       monto: fmtMoneyFull(a.costo), fecha: a.fecha, color:'#f3f0ff' }));
  acts.sort((a,b) => (b.fecha||'') > (a.fecha||'') ? 1 : -1);
  const icons = { venta:'💰', pedido:'📦', arreglo:'🔧' };
  const recentEl = document.getElementById('dash-recent');
  if (!acts.length) {
    recentEl.innerHTML = '<div class="empty-state" style="padding:30px 0"><div class="e-icon">📋</div><p>Sin actividad aún</p></div>';
  } else {
    recentEl.innerHTML = '<div class="activity-list">' + acts.slice(0,6).map(r => `
      <div class="act-item">
        <div class="act-dot" style="background:${r.color}">${icons[r.tipo]}</div>
        <div class="act-info">
          <div class="act-title">${r.titulo}</div>
          <div class="act-sub">${r.sub} · ${fmtDate(r.fecha)}</div>
        </div>
        <div class="act-amount" style="color:var(--blue-dark)">${r.monto}</div>
      </div>`).join('') + '</div>';
  }

  const low = DB.productos.filter(p => Number(p.stock||0) <= Number(p.stockmin||2));
  const lsEl = document.getElementById('dash-lowstock');
  lsEl.innerHTML = !low.length
    ? '<div class="alert alert-info">✓ Todo el inventario tiene buen stock.</div>'
    : low.map(p => `
      <div class="alert alert-warn">
        <span>⚠️</span>
        <div><strong>${p.nombre}</strong><br>
        <span style="font-size:12px">Solo <strong>${p.stock}</strong> pares (mín: ${p.stockmin||2})</span></div>
      </div>`).join('');

  updateNavBadges();
}

// ─── LISTA DE PRODUCTOS ──────────────────────────────────────────────
function renderProductos() {
  const q   = (document.getElementById('prod-search')?.value || '').toLowerCase();
  const cat = document.getElementById('prod-cat-filter')?.value || '';
  const vis = document.getElementById('prod-vis-filter')?.value || '';

  const list = DB.productos.filter(p =>
    (!q   || `${p.nombre} ${p.marca} ${p.ref} ${p.categoria}`.toLowerCase().includes(q)) &&
    (!cat || p.categoria === cat) &&
    (!vis || (vis === 'destacado' ? p.destacado : vis === 'nuevo' ? p.es_nuevo : vis === 'inactivo' ? !p.activo : true))
  );

  const empty = document.getElementById('prod-empty');
  const tbody = document.getElementById('prod-tbody');

  if (!list.length) {
    empty.style.display = 'block';
    tbody.innerHTML = '';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = list.map(p => {
    const stock = Number(p.stock || 0);
    const min   = Number(p.stockmin || 2);
    const stockBadge = stock === 0       ? badge('Agotado',    'b-red')
                     : stock <= min      ? badge('Stock bajo', 'b-amber')
                                         : badge('Disponible', 'b-green');

    // Imagen principal
    const imgs      = p.producto_imagenes || [];
    const principal = imgs.find(i => i.es_principal) || imgs[0];
    const imgHTML   = principal?.url
      ? `<img src="${principal.url}" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:6px;border:1px solid var(--border)">`
      : `<div style="width:44px;height:44px;border-radius:6px;background:var(--surface-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:22px">👟</div>`;

    // Puntos de color de variantes
    const variantes  = p.producto_variantes || [];
    const coloresMap = new Map(variantes.filter(v => v.color && v.color_hex).map(v => [v.color, v.color_hex]));
    const colorDots  = [...coloresMap.entries()].slice(0, 6).map(([nombre, hex]) =>
      `<span title="${nombre}" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${hex};border:1px solid rgba(0,0,0,0.2)"></span>`
    ).join('');

    // Resumen de tallas con stock
    const tallasConStock = variantes
      .filter(v => v.activo && Number(v.stock) > 0)
      .map(v => v.talla)
      .filter((t, i, arr) => arr.indexOf(t) === i)
      .sort((a, b) => isNaN(a)||isNaN(b) ? String(a).localeCompare(String(b)) : Number(a)-Number(b));

    const tags = [
      p.destacado ? `<span class="chip chip-gold" style="font-size:9px">★ Dest.</span>` : '',
      p.es_nuevo  ? `<span class="chip" style="font-size:9px;background:var(--green-bg);color:var(--green)">Nuevo</span>` : '',
      !p.activo   ? `<span class="chip chip-red" style="font-size:9px">Inactivo</span>` : '',
    ].filter(Boolean).join('');

    // Nombre para mostrar = marca + referencia
    const nombreDisplay = [p.marca, p.ref].filter(Boolean).join(' ') || p.nombre;

    return `<tr>
      <td style="width:48px">${imgHTML}</td>
      <td>
        <div style="font-weight:600">${nombreDisplay}</div>
        ${p.descripcion ? `<div style="font-size:11px;color:var(--text-muted);max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.descripcion}</div>` : ''}
        <div style="margin-top:3px;display:flex;gap:4px;align-items:center;flex-wrap:wrap">
          ${colorDots}
          ${tags}
        </div>
        ${tallasConStock.length ? `<div style="margin-top:2px;font-size:10px;color:var(--text-muted)">T: ${tallasConStock.join(', ')}</div>` : ''}
      </td>
      <td><span class="chip">${p.categoria || '—'}</span></td>
      <td style="font-size:12px">${p.genero || '—'}</td>
      <td style="color:var(--text-muted);font-size:12px">${fmtMoneyFull(p.costo)}</td>
      <td>
        <div style="font-weight:600;color:var(--blue-dark)">${fmtMoneyFull(p.precio)}</div>
        ${p.precio_descuento ? `<div style="font-size:11px;color:var(--green);font-weight:700">${fmtMoneyFull(p.precio_descuento)} <span style="color:var(--text-muted);font-weight:400;text-decoration:line-through">${fmtMoneyFull(p.precio)}</span></div>` : ''}
      </td>
      <td style="font-weight:700;color:${stock<=min?'var(--accent)':'var(--blue-dark)'}">${stock}</td>
      <td>${stockBadge}</td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" onclick="editProducto('${p.id}')" title="Editar datos">✏️</button>
          <button class="btn btn-primary btn-sm" onclick="openDetalleProducto('${p.id}')" title="Variantes + Imágenes" style="font-size:11px;padding:4px 8px">🎨 Detalles</button>
          <button class="btn btn-danger btn-sm" onclick="deleteItemUI('productos','${p.id}',renderProductos)">×</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ─── MODAL 1: DATOS BASE DEL PRODUCTO ───────────────────────────────
// (marca + ref → nombre del zapato, categoría, género, precios, estado)

function openNuevoProducto() {
  document.getElementById('modal-prod-title').textContent = 'Nuevo producto';
  document.getElementById('p-id').value = '';
  ['p-nombre','p-ref','p-marca','p-descripcion','p-precio-desc','p-notas'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  ['p-costo','p-precio'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('p-stockmin').value = '2';
  document.getElementById('p-cat').selectedIndex = 0;
  const g = document.getElementById('p-genero'); if (g) g.value = 'Unisex';
  const d = document.getElementById('p-destacado'); if (d) d.checked = false;
  const n = document.getElementById('p-nuevo');    if (n) n.checked = false;
  const a = document.getElementById('p-activo');   if (a) a.checked = true;
  openModal('modal-prod');
}

async function saveProductoUI() {
  const existingId = document.getElementById('p-id').value.trim();
  const isNew      = !existingId;

  // El "nombre" en DB se construye de marca + ref (o se puede guardar como está)
  const marca = document.getElementById('p-marca').value.trim();
  const ref   = document.getElementById('p-ref').value.trim();
  // Campo nombre en DB es requerido — usamos marca+ref o lo que haya en p-nombre
  const nombre = document.getElementById('p-nombre')?.value.trim() || [marca, ref].filter(Boolean).join(' ') || marca || ref;
  if (!nombre) { alert('Ingresa al menos la marca o referencia.'); return; }

  const obj = {
    id:               isNew ? null : existingId,
    nombre,
    ref,
    marca,
    categoria:        document.getElementById('p-cat').value,
    genero:           document.getElementById('p-genero')?.value || 'Unisex',
    descripcion:      document.getElementById('p-descripcion')?.value.trim() || null,
    costo:            document.getElementById('p-costo').value || 0,
    precio:           document.getElementById('p-precio').value || 0,
    precio_descuento: document.getElementById('p-precio-desc')?.value.trim() || null,
    stock:            0,   // el stock nace de las variantes
    stockmin:         document.getElementById('p-stockmin')?.value || 2,
    activo:           document.getElementById('p-activo')?.checked !== false,
    destacado:        !!document.getElementById('p-destacado')?.checked,
    es_nuevo:         !!document.getElementById('p-nuevo')?.checked,
    notas:            document.getElementById('p-notas')?.value.trim() || null,
  };

  showLoader(true);
  let saved;
  try { saved = await saveProducto(obj); } catch(e) { showLoader(false); return; }

  const realId = saved.id;
  obj.id = realId;
  const existing = DB.productos.find(p => p.id === realId);
  obj.producto_imagenes  = existing?.producto_imagenes  || [];
  obj.producto_variantes = existing?.producto_variantes || [];
  const idx = DB.productos.findIndex(p => p.id === realId);
  if (idx >= 0) DB.productos[idx] = obj; else DB.productos.push(obj);

  showLoader(false);
  closeModal('modal-prod');
  renderProductos();

  // Si es nuevo, ir directo al modal de detalles (variantes + imágenes)
  if (isNew) {
    setTimeout(() => openDetalleProducto(realId), 200);
  }
}

function editProducto(id) {
  const p = DB.productos.find(x => x.id === id); if (!p) return;
  document.getElementById('modal-prod-title').textContent = 'Editar producto';
  document.getElementById('p-id').value    = p.id;
  const nameEl = document.getElementById('p-nombre'); if (nameEl) nameEl.value = p.nombre || '';
  document.getElementById('p-ref').value   = p.ref   || '';
  document.getElementById('p-marca').value = p.marca || '';
  document.getElementById('p-cat').value   = p.categoria || 'Tenis';
  document.getElementById('p-costo').value  = p.costo  || '';
  document.getElementById('p-precio').value = p.precio || '';
  const pd = document.getElementById('p-precio-desc'); if (pd) pd.value = p.precio_descuento || '';
  const sm = document.getElementById('p-stockmin');    if (sm) sm.value = p.stockmin || 2;
  const nt = document.getElementById('p-notas');       if (nt) nt.value = p.notas || '';
  const ge = document.getElementById('p-genero');      if (ge) ge.value = p.genero || 'Unisex';
  const de = document.getElementById('p-destacado');   if (de) de.checked = !!p.destacado;
  const nv = document.getElementById('p-nuevo');       if (nv) nv.checked = !!p.es_nuevo;
  const ac = document.getElementById('p-activo');      if (ac) ac.checked = p.activo !== false;
  const ds = document.getElementById('p-descripcion'); if (ds) ds.value = p.descripcion || '';
  openModal('modal-prod');
}

// ─── MODAL 2: DETALLE — VARIANTES (talla+color+stock) + IMÁGENES ────
// Un solo modal unificado que reemplaza los dos modales anteriores.
// La imagen va vinculada al color, no al producto en general.

let _detProdId = null;

async function openDetalleProducto(prodId) {
  _detProdId = prodId;
  const prod = DB.productos.find(p => p.id === prodId);
  const nombreDisplay = [prod?.marca, prod?.ref].filter(Boolean).join(' ') || prod?.nombre || 'Producto';
  document.getElementById('det-modal-nombre').textContent = nombreDisplay;

  // Resetear form de nueva variante
  ['det-talla','det-color','det-stock'].forEach(id => { const el = document.getElementById(id); if(el) el.value = id === 'det-stock' ? '0' : ''; });
  document.getElementById('det-color-hex').value = '#000000';

  await renderDetalleModal();
  openModal('modal-detalle-prod');
}

async function renderDetalleModal() {
  if (!_detProdId) return;

  // Cargar variantes frescas de Supabase
  const { data: vars } = await sb
    .from('producto_variantes')
    .select('*')
    .eq('producto_id', _detProdId)
    .order('color').then(r => ({ data: r.data?.sort((a,b) => {
      if (a.color !== b.color) return (a.color||'').localeCompare(b.color||'');
      const na = parseFloat(a.talla), nb = parseFloat(b.talla);
      return (!isNaN(na)&&!isNaN(nb)) ? na-nb : String(a.talla).localeCompare(String(b.talla));
    }) || [], error: r.error }));

  // Cargar imágenes
  const { data: imgs } = await sb
    .from('producto_imagenes')
    .select('*')
    .eq('producto_id', _detProdId)
    .order('orden');

  // Actualizar memoria
  const prod = DB.productos.find(p => p.id === _detProdId);
  if (prod) {
    prod.producto_variantes = vars || [];
    prod.producto_imagenes  = imgs || [];
  }

  // ── Render variantes agrupadas por color ──────────────────────────
  const varEl = document.getElementById('det-var-list');

  if (!vars?.length) {
    varEl.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px">
      Sin variantes. Agrega la primera talla abajo.</div>`;
  } else {
    // Agrupar por color
    const grupos = new Map();
    vars.forEach(v => {
      const key = v.color || '__sincolor__';
      if (!grupos.has(key)) grupos.set(key, { color: v.color, colorHex: v.color_hex, variantes: [] });
      grupos.get(key).variantes.push(v);
    });

    varEl.innerHTML = [...grupos.values()].map(g => {
      const totalColor = g.variantes.reduce((s, v) => s + Number(v.stock||0), 0);
      // Imagen vinculada a este color
      const imgColor = imgs?.find(i => i.color_ref === g.color) || null;

      return `
        <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:10px">
          <!-- Cabecera de color -->
          <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface-2);border-bottom:1px solid var(--border)">
            ${g.colorHex ? `<span style="width:18px;height:18px;border-radius:50%;background:${g.colorHex};border:2px solid var(--border);flex-shrink:0"></span>` : ''}
            <strong style="flex:1">${g.color || 'Sin color'}</strong>
            <span style="font-size:12px;color:var(--text-muted)">${totalColor} par${totalColor!==1?'es':''} total</span>
            <!-- Imagen del color -->
            <label style="cursor:pointer;font-size:11px;color:var(--gold);text-decoration:underline" title="Subir imagen para este color">
              ${imgColor ? '🖼️ Cambiar img' : '📷 + Imagen'}
              <input type="file" accept="image/*" style="display:none"
                onchange="uploadColorImg(this, '${g.color||''}', '${g.colorHex||''}')">
            </label>
            ${imgColor ? `<img src="${imgColor.url}" style="width:36px;height:36px;object-fit:cover;border-radius:4px;border:1px solid var(--border)">` : ''}
          </div>
          <!-- Tallas de este color -->
          <div style="padding:8px 12px">
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <thead><tr style="color:var(--text-muted);font-size:11px">
                <th style="text-align:left;padding:4px 6px">Talla</th>
                <th style="text-align:left;padding:4px 6px">Stock (pares)</th>
                <th style="text-align:left;padding:4px 6px">Precio extra</th>
                <th style="text-align:left;padding:4px 6px">Estado</th>
                <th></th>
              </tr></thead>
              <tbody>
                ${g.variantes.map(v => `
                  <tr style="border-top:1px solid var(--border)">
                    <td style="padding:6px;font-weight:700;font-size:15px">${v.talla}</td>
                    <td style="padding:6px">
                      <div style="display:flex;align-items:center;gap:6px">
                        <button onclick="cambiarStockVar('${v.id}',-1)" style="width:24px;height:24px;border:1px solid var(--border);border-radius:4px;background:var(--surface);cursor:pointer;font-size:14px;line-height:1">−</button>
                        <span id="stock-val-${v.id}" style="min-width:28px;text-align:center;font-weight:600;color:${Number(v.stock)===0?'var(--accent)':Number(v.stock)<=2?'#d97706':'var(--blue-dark)'}">${v.stock}</span>
                        <button onclick="cambiarStockVar('${v.id}',1)" style="width:24px;height:24px;border:1px solid var(--border);border-radius:4px;background:var(--surface);cursor:pointer;font-size:14px;line-height:1">+</button>
                        ${Number(v.stock)===0 ? '<span style="font-size:10px;color:var(--accent);margin-left:2px">Agotado</span>' : Number(v.stock)<=2 ? '<span style="font-size:10px;color:#d97706;margin-left:2px">⚠️ Bajo</span>' : ''}
                      </div>
                    </td>
                    <td style="padding:6px;color:var(--text-muted)">${Number(v.precio_extra||0)>0?'+'+fmtMoneyFull(v.precio_extra):'—'}</td>
                    <td style="padding:6px">
                      <button onclick="toggleVarianteActivo('${v.id}',${v.activo})"
                        style="font-size:11px;padding:2px 8px;border-radius:20px;border:none;cursor:pointer;
                        background:${v.activo?'var(--green-bg)':'var(--surface-2)'};
                        color:${v.activo?'var(--green)':'var(--text-muted)'}">
                        ${v.activo?'✓ Activo':'Inactivo'}
                      </button>
                    </td>
                    <td style="padding:6px">
                      <button class="btn btn-danger btn-sm" onclick="deleteVarianteUI('${v.id}')">×</button>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
    }).join('');
  }

  // ── Render galería de imágenes (por color) ──────────────────────
  const imgEl = document.getElementById('det-img-list');
  if (!imgs?.length) {
    imgEl.innerHTML = `<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:12px">Sin imágenes aún.</div>`;
  } else {
    imgEl.innerHTML = imgs.map(img => `
      <div style="position:relative;border-radius:8px;overflow:hidden;border:2px solid ${img.es_principal?'var(--gold)':'var(--border)'}">
        <img src="${img.url}" alt="" style="width:100%;height:80px;object-fit:cover;display:block">
        ${img.color_ref ? `<div style="position:absolute;top:0;left:0;right:0;font-size:9px;text-align:center;padding:2px;background:rgba(0,0,0,0.5);color:#fff">${img.color_ref}</div>` : ''}
        ${img.es_principal ? '<div style="position:absolute;bottom:20px;left:0;right:0;font-size:9px;text-align:center;background:var(--gold);color:#000;padding:1px">PRINCIPAL</div>' : ''}
        <div style="display:flex;gap:2px;padding:3px;background:rgba(0,0,0,0.7)">
          ${!img.es_principal?`<button onclick="setPrincipalImgUI('${img.id}')" style="flex:1;background:var(--gold);border:none;border-radius:3px;font-size:10px;cursor:pointer;padding:2px" title="Hacer principal">★</button>`:''}
          <button onclick="deleteImgUI('${img.id}','${img.storage_path||''}')" style="flex:1;background:#ef4444;border:none;border-radius:3px;color:#fff;font-size:10px;cursor:pointer;padding:2px">✕</button>
        </div>
      </div>
    `).join('');
  }
}

// ── Nueva variante desde el modal de detalle ─────────────────────
async function saveVarianteUI() {
  const talla = document.getElementById('det-talla').value.trim();
  if (!talla) { alert('La talla es obligatoria'); return; }
  const color    = document.getElementById('det-color').value.trim();
  const colorHex = document.getElementById('det-color-hex').value || null;
  const stock    = Number(document.getElementById('det-stock').value || 0);
  const extra    = Number(document.getElementById('det-extra')?.value || 0);

  showLoader(true);
  const { error } = await sb.from('producto_variantes').insert({
    producto_id: _detProdId,
    talla, color: color || null, color_hex: colorHex,
    stock, precio_extra: extra, activo: true,
  });
  showLoader(false);
  if (error) { toast('Error: ' + error.message, 'error'); return; }

  ['det-talla','det-color','det-stock'].forEach(id => { const el = document.getElementById(id); if(el) el.value = id==='det-stock'?'0':''; });
  document.getElementById('det-color-hex').value = '#000000';

  await renderDetalleModal();
  renderProductos();
  toast('Variante agregada ✓', 'success');
}

// ── +1 / -1 stock directo ────────────────────────────────────────
async function cambiarStockVar(varId, delta) {
  const prod = DB.productos.find(p => p.id === _detProdId);
  const v    = prod?.producto_variantes?.find(v => v.id === varId);
  if (!v) return;
  const nuevo = Math.max(0, Number(v.stock||0) + delta);
  await sb.from('producto_variantes').update({ stock: nuevo }).eq('id', varId);
  v.stock = nuevo;
  // Actualizar solo el span sin re-renderizar todo
  const el = document.getElementById('stock-val-' + varId);
  if (el) {
    el.textContent = nuevo;
    el.style.color = nuevo===0 ? 'var(--accent)' : nuevo<=2 ? '#d97706' : 'var(--blue-dark)';
  }
  // Recalcular stock total del producto
  if (prod) {
    prod.stock = (prod.producto_variantes||[]).reduce((s,v)=>s+Number(v.stock||0),0);
    renderProductos();
  }
}

// ── Activar / desactivar variante ───────────────────────────────
async function toggleVarianteActivo(varId, actual) {
  await sb.from('producto_variantes').update({ activo: !actual }).eq('id', varId);
  await renderDetalleModal();
  renderProductos();
}

// ── Eliminar variante ─────────────────────────────────────────────
async function deleteVarianteUI(varId) {
  if (!confirm('¿Eliminar esta variante?')) return;
  showLoader(true);
  await sb.from('producto_variantes').delete().eq('id', varId);
  showLoader(false);
  await renderDetalleModal();
  renderProductos();
}

// ── Subir imagen vinculada a un color ────────────────────────────
async function uploadColorImg(input, colorRef, colorHex) {
  const file = input.files?.[0];
  if (!file || !_detProdId) return;
  showLoader(true);
  // Subir a storage
  const ext  = file.name.split('.').pop();
  const path = `${_detProdId}/${Date.now()}_${colorRef||'general'}.${ext}`;
  const { error: upErr } = await sb.storage.from('productos').upload(path, file, { upsert: true });
  if (upErr) { showLoader(false); toast('Error subiendo imagen: ' + upErr.message, 'error'); return; }
  const { data: { publicUrl } } = sb.storage.from('productos').getPublicUrl(path);

  // Verificar si ya hay imagen para este color y si hay imagen principal
  const prod = DB.productos.find(p => p.id === _detProdId);
  const imgs = prod?.producto_imagenes || [];
  const esLaPrimera = imgs.length === 0;

  // Guardar en producto_imagenes con color_ref
  const { error: dbErr } = await sb.from('producto_imagenes').insert({
    producto_id:  _detProdId,
    url:          publicUrl,
    storage_path: path,
    color_ref:    colorRef || null,
    es_principal: esLaPrimera,
    orden:        imgs.length,
  });
  showLoader(false);
  if (dbErr) { toast('Error guardando imagen: ' + dbErr.message, 'error'); return; }
  await renderDetalleModal();
  renderProductos();
  toast(`✅ Imagen ${colorRef ? 'para ' + colorRef : ''} subida`, 'success');
}

// ── Subir imagen general (sin color) ─────────────────────────────
async function uploadImageUI() {
  const input = document.getElementById('det-img-input');
  const files = Array.from(input?.files || []);
  if (!files.length) { alert('Selecciona al menos una imagen.'); return; }
  if (!_detProdId)   { alert('Primero guarda el producto.');     return; }
  showLoader(true);
  for (const file of files) await uploadProductImage(_detProdId, file);
  input.value = '';
  showLoader(false);
  await renderDetalleModal();
  renderProductos();
  toast('✅ Imagen(s) subida(s)', 'success');
}

async function setPrincipalImgUI(imgId) {
  showLoader(true);
  await setPrincipalImage(imgId, _detProdId);
  showLoader(false);
  await renderDetalleModal();
  renderProductos();
  toast('Imagen principal actualizada ✓', 'success');
}

async function deleteImgUI(imgId, storagePath) {
  if (!confirm('¿Eliminar esta imagen?')) return;
  showLoader(true);
  await deleteProductImage(imgId, storagePath);
  showLoader(false);
  await renderDetalleModal();
  renderProductos();
}

// ── Eliminar producto ─────────────────────────────────────────────
async function deleteItemUI(table, id, cb) {
  if (!confirm('¿Eliminar este registro?')) return;
  showLoader(true);
  await deleteItemDB(table, id);
  DB[table] = DB[table].filter(x => x.id !== id);
  showLoader(false);
  cb();
  updateNavBadges();
}

// Alias de compatibilidad (el HTML puede llamar openVariantesModal o openImagenesModal)
function openVariantesModal(id) { openDetalleProducto(id); }
function openImagenesModal(id)  { openDetalleProducto(id); }
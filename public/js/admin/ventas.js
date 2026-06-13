// ─── VENTAS ─────────────────────────────────────────────────────────

// Llena el selector de productos agrupando por producto,
// y a partir de ahí permite elegir la variante (talla/color).
function fillProductoSelectVenta() {
  const sel = document.getElementById('v-producto');
  // Productos con al menos una variante activa con stock > 0,
  // o productos sin variantes pero con stock directo
  const conVariantes = DB.productos.filter(p => {
    const vars = (p.producto_variantes || []).filter(v => v.activo && Number(v.stock) > 0);
    return vars.length > 0;
  });
  const sinVariantes = DB.productos.filter(p => {
    const vars = p.producto_variantes || [];
    return vars.length === 0 && Number(p.stock || 0) > 0;
  });

  let opts = '<option value="">— Seleccionar producto —</option>';

  if (conVariantes.length) {
    opts += '<optgroup label="Con tallas/colores">';
    conVariantes.forEach(p => {
      // No agregamos el producto directamente; se elige por variante abajo
      opts += `<option value="prod:${p.id}" disabled style="font-style:italic;color:var(--text-muted)">📦 ${p.nombre}${p.marca ? ' · ' + p.marca : ''}</option>`;
      (p.producto_variantes || [])
        .filter(v => v.activo && Number(v.stock) > 0)
        .sort((a, b) => {
          const na = isNaN(a.talla) ? a.talla : Number(a.talla);
          const nb = isNaN(b.talla) ? b.talla : Number(b.talla);
          return na > nb ? 1 : -1;
        })
        .forEach(v => {
          const label = `  T${v.talla}${v.color ? ' · ' + v.color : ''} — Stock: ${v.stock} — ${fmtMoneyFull(Number(p.precio) + Number(v.precio_extra || 0))}`;
          opts += `<option value="var:${v.id}" data-prod-id="${p.id}" data-prod-nombre="${p.nombre}" data-talla="${v.talla}" data-color="${v.color || ''}" data-precio="${Number(p.precio) + Number(v.precio_extra || 0)}" data-stock="${v.stock}">${label}</option>`;
        });
    });
    opts += '</optgroup>';
  }

  if (sinVariantes.length) {
    opts += '<optgroup label="Sin variantes">';
    sinVariantes.forEach(p => {
      opts += `<option value="prod:${p.id}" data-prod-id="${p.id}" data-prod-nombre="${p.nombre}" data-precio="${p.precio}" data-stock="${p.stock}">${p.nombre}${p.marca ? ' · ' + p.marca : ''} — Stock: ${p.stock} — ${fmtMoneyFull(p.precio)}</option>`;
    });
    opts += '</optgroup>';
  }

  opts += '<option value="__manual__">✏️ Producto manual (no en inventario)</option>';
  sel.innerHTML = opts;

  // Resetear campo de variante/detalle
  const infoEl = document.getElementById('v-variante-info');
  if (infoEl) infoEl.style.display = 'none';
}

function onProductoVentaChange() {
  const sel = document.getElementById('v-producto');
  const val = sel.value;
  const manualWrap = document.getElementById('v-prod-manual-wrap');
  const infoEl = document.getElementById('v-variante-info');

  if (val === '__manual__') {
    manualWrap.style.display = 'block';
    if (infoEl) infoEl.style.display = 'none';
    document.getElementById('v-precio').value = '';
  } else if (val && !val.startsWith('prod:')) {
    // Es una variante concreta (var:uuid) o producto sin variantes (prod:uuid)
    manualWrap.style.display = 'none';
    const opt = sel.options[sel.selectedIndex];
    const precio = opt.dataset.precio || '';
    const stock  = opt.dataset.stock  || '?';
    document.getElementById('v-precio').value = precio;

    // Mostrar chip informativo de stock disponible
    if (infoEl) {
      const talla = opt.dataset.talla;
      const color = opt.dataset.color;
      infoEl.style.display = 'block';
      infoEl.innerHTML = `
        <span style="font-size:12px;color:var(--text-muted)">
          ${talla ? `Talla: <strong>${talla}</strong>` : ''}
          ${color ? ` &nbsp;·&nbsp; Color: <strong>${color}</strong>` : ''}
          &nbsp;·&nbsp; Disponibles: <strong style="color:${Number(stock) <= 2 ? 'var(--accent)' : 'var(--green)'}">${stock} pares</strong>
        </span>`;
    }
  } else {
    manualWrap.style.display = 'none';
    if (infoEl) infoEl.style.display = 'none';
  }
  calcTotalVenta();
}

function calcTotalVenta() {
  const cant = Number(document.getElementById('v-cant').value || 1);
  const precio = Number(document.getElementById('v-precio').value || 0);
  document.getElementById('v-total').value = cant * precio;
}

function renderVentas() {
  const q = (document.getElementById('venta-search').value || '').toLowerCase();
  let list = DB.ventas.filter(v =>
    !q || `${v.cliente} ${v.productoNombre} ${v.pago}`.toLowerCase().includes(q)
  ).slice().reverse();

  const empty = document.getElementById('venta-empty');
  const tbody = document.getElementById('venta-tbody');
  if (!list.length) { empty.style.display = 'block'; tbody.innerHTML = ''; return; }
  empty.style.display = 'none';

  tbody.innerHTML = list.map(v => `<tr>
    <td style="white-space:nowrap">${fmtDate(v.fecha)}</td>
    <td style="font-weight:500">${v.cliente || '—'}</td>
    <td>
      <div>${v.productoNombre || '—'}</div>
      ${v.cantidad > 1 ? `<div style="font-size:11px;color:var(--text-muted)">× ${v.cantidad}</div>` : ''}
    </td>
    <td style="font-weight:600;color:var(--accent)">${fmtMoneyFull(v.total)}</td>
    <td>${pagoIcon(v.pago)}</td>
    <td>${v.notas ? `<span style="font-size:12px;color:var(--text-muted)" title="${v.notas}">📝 Nota</span>` : ''}</td>
    <td><button class="btn btn-danger btn-sm" onclick="deleteItemUI('ventas','${v.id}',()=>{renderVentas();renderDashboard()})">×</button></td>
  </tr>`).join('');
}

function openNuevaVenta() {
  fillProductoSelectVenta();
  document.getElementById('v-fecha').value = today();
  document.getElementById('v-cant').value = '1';
  document.getElementById('v-precio').value = '';
  document.getElementById('v-total').value = '';
  document.getElementById('v-cliente').value = '';
  document.getElementById('v-notas').value = '';
  document.getElementById('v-pago').innerHTML = mediosPagoOptions();
  document.getElementById('v-prod-manual-wrap').style.display = 'none';
  document.getElementById('v-id').value = '';
  const infoEl = document.getElementById('v-variante-info');
  if (infoEl) infoEl.style.display = 'none';
  openModal('modal-venta');
}

async function saveVentaUI() {
  const sel = document.getElementById('v-producto');
  const val = sel.value;
  const opt = sel.options[sel.selectedIndex];

  let prodId = null, varianteId = null, prodNombre = '';

  if (val === '__manual__') {
    prodNombre = document.getElementById('v-prod-manual').value.trim() || 'Producto';
  } else if (val && val.startsWith('var:')) {
    // Venta con variante específica
    varianteId = val.replace('var:', '');
    prodId = opt.dataset.prodId;
    const talla = opt.dataset.talla;
    const color = opt.dataset.color;
    const base  = opt.dataset.prodNombre || opt.text.split('—')[0].trim();
    prodNombre = `${base} T${talla}${color ? ' ' + color : ''}`;
  } else if (val && val.startsWith('prod:')) {
    // Producto sin variantes
    prodId = val.replace('prod:', '');
    prodNombre = opt.dataset.prodNombre || opt.text.split('—')[0].trim();
  } else {
    alert('Selecciona un producto o variante.'); return;
  }

  const cant = Number(document.getElementById('v-cant').value || 1);

  // Verificar stock antes de guardar
  if (varianteId) {
    const prod = DB.productos.find(p => p.id === prodId);
    const variante = (prod?.producto_variantes || []).find(v => v.id === varianteId);
    if (variante && Number(variante.stock) < cant) {
      alert(`Stock insuficiente. Solo hay ${variante.stock} par(es) disponibles.`);
      return;
    }
  } else if (prodId) {
    const prod = DB.productos.find(p => p.id === prodId);
    if (prod && Number(prod.stock || 0) < cant) {
      alert(`Stock insuficiente. Solo hay ${prod.stock} unidades disponibles.`);
      return;
    }
  }

  const obj = {
    id: document.getElementById('v-id').value || uid(),
    cliente:        document.getElementById('v-cliente').value.trim(),
    productoId:     prodId,
    varianteId:     varianteId,
    productoNombre: prodNombre,
    cantidad:       cant,
    precio:         Number(document.getElementById('v-precio').value || 0),
    total:          Number(document.getElementById('v-total').value || 0),
    pago:           document.getElementById('v-pago').value,
    fecha:          document.getElementById('v-fecha').value || today(),
    notas:          document.getElementById('v-notas').value.trim(),
  };

  showLoader(true);
  await saveVenta(obj);

  // Descontar stock: si tiene variante, descuenta de producto_variantes
  // (el trigger trg_sync_stock actualizará productos.stock automáticamente)
  if (varianteId) {
    const { error } = await sb.rpc('descontar_stock_variante', {
      p_variante_id: varianteId,
      p_cantidad: cant,
    });
    if (error) {
      console.warn('[stock] descontar_stock_variante:', error.message);
      // Fallback: update directo
      const prod = DB.productos.find(p => p.id === prodId);
      const variante = (prod?.producto_variantes || []).find(v => v.id === varianteId);
      if (variante) {
        const nuevoStock = Math.max(0, Number(variante.stock) - cant);
        await sb.from('producto_variantes').update({ stock: nuevoStock }).eq('id', varianteId);
        variante.stock = nuevoStock;
      }
    } else {
      // Actualizar en memoria
      const prod = DB.productos.find(p => p.id === prodId);
      const variante = (prod?.producto_variantes || []).find(v => v.id === varianteId);
      if (variante) variante.stock = Math.max(0, Number(variante.stock) - cant);
      if (prod) prod.stock = (prod.producto_variantes || [])
        .filter(v => v.activo)
        .reduce((s, v) => s + Number(v.stock || 0), 0);
    }
  } else if (prodId) {
    // Producto sin variantes: descuenta directo en productos
    const prod = DB.productos.find(p => p.id === prodId);
    if (prod) {
      const newStock = Math.max(0, Number(prod.stock || 0) - cant);
      await updateStock(prodId, newStock);
      prod.stock = newStock;
    }
  }

  const idx = DB.ventas.findIndex(x => x.id === obj.id);
  if (idx >= 0) DB.ventas[idx] = obj; else DB.ventas.push(obj);
  showLoader(false);
  closeModal('modal-venta');
  renderVentas();
  renderDashboard();
}
// ─── VENTAS ─────────────────────────────────────────────────────────
function fillProductoSelectVenta() {
  const sel = document.getElementById('v-producto');
  const disponibles = DB.productos.filter(p => Number(p.stock || 0) > 0);
  sel.innerHTML = '<option value="">— Seleccionar producto del inventario —</option>' +
    disponibles.map(p =>
      `<option value="${p.id}" data-precio="${p.precio}" data-nombre="${p.nombre} T${p.talla || '?'} ${p.color || ''}">${p.nombre} · T${p.talla || '?'} · ${p.color || ''} · Stock: ${p.stock} · ${fmtMoneyFull(p.precio)}</option>`
    ).join('') +
    '<option value="__manual__">✏️ Producto manual (no en inventario)</option>';
}

function onProductoVentaChange() {
  const sel = document.getElementById('v-producto');
  const val = sel.value;
  const manualWrap = document.getElementById('v-prod-manual-wrap');
  if (val === '__manual__') {
    manualWrap.style.display = 'block';
    document.getElementById('v-precio').value = '';
  } else if (val) {
    manualWrap.style.display = 'none';
    const opt = sel.options[sel.selectedIndex];
    document.getElementById('v-precio').value = opt.dataset.precio || '';
  } else {
    manualWrap.style.display = 'none';
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
  openModal('modal-venta');
}

async function saveVentaUI() {
  const sel = document.getElementById('v-producto');
  const val = sel.value;
  let prodId = null, prodNombre = '';

  if (val === '__manual__') {
    prodNombre = document.getElementById('v-prod-manual').value.trim() || 'Producto';
  } else if (val) {
    prodId = val;
    const opt = sel.options[sel.selectedIndex];
    prodNombre = opt.dataset.nombre || opt.text.split('·')[0].trim();
  } else {
    alert('Selecciona un producto.'); return;
  }

  const cant = Number(document.getElementById('v-cant').value || 1);
  const obj = {
    id: document.getElementById('v-id').value || uid(),
    cliente: document.getElementById('v-cliente').value.trim(),
    productoId: prodId,
    productoNombre: prodNombre,
    cantidad: cant,
    precio: Number(document.getElementById('v-precio').value || 0),
    total: Number(document.getElementById('v-total').value || 0),
    pago: document.getElementById('v-pago').value,
    fecha: document.getElementById('v-fecha').value || today(),
    notas: document.getElementById('v-notas').value.trim()
  };

  showLoader(true);
  await saveVenta(obj);

  if (prodId) {
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
  closeModal('modal-venta'); renderVentas(); renderDashboard();
}
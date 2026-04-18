// ─── RICWER CLIENT — carrito.js ─────────────────────────────────────
let CARRITO = []; // [{ id, variante_id, producto_id, producto_nombre, talla, color, precio_unitario, cantidad, imagen }]

// ─── CARGAR CARRITO DESDE SUPABASE ──────────────────────────────────
async function loadCarrito() {
  const { data } = await sb
    .from('carrito')
    .select(`
      id, cantidad, precio_unitario,
      producto_variantes (
        id, talla, color, stock,
        productos ( id, nombre, precio, precio_descuento,
          producto_imagenes ( url, es_principal )
        )
      )
    `)
    .eq('user_id', APP.user.id);

  CARRITO = (data || []).map(item => {
    const v = item.producto_variantes;
    const p = v?.productos;
    return {
      id:              item.id,
      variante_id:     v?.id,
      producto_id:     p?.id,
      producto_nombre: p?.nombre || 'Producto',
      talla:           v?.talla,
      color:           v?.color,
      precio_unitario: Number(item.precio_unitario),
      cantidad:        Number(item.cantidad),
      imagen:          p?.producto_imagenes?.find(i => i.es_principal)?.url || p?.producto_imagenes?.[0]?.url,
      stock_max:       Number(v?.stock || 99),
    };
  });

  updateCartUI();
}

// ─── AGREGAR AL CARRITO ──────────────────────────────────────────────
async function addItemToCart({ variante_id, producto_id, producto_nombre, talla, color, precio_unitario, cantidad, imagen }) {
  if (!variante_id) {
    toast('Este producto no tiene variante seleccionada.', 'error');
    return;
  }

  // ¿Ya existe en carrito?
  const existing = CARRITO.find(c => c.variante_id === variante_id);
  if (existing) {
    const newQty = existing.cantidad + cantidad;
    await updateCartItemQty(existing.id, newQty);
    toast('✅ Cantidad actualizada en el carrito', 'success');
    openCart();
    return;
  }

  // Upsert en Supabase
  const { data, error } = await sb.from('carrito').upsert({
    user_id: APP.user.id,
    variante_id,
    cantidad,
    precio_unitario,
  }, { onConflict: 'user_id,variante_id' }).select().single();

  if (error) { toast('Error agregando al carrito', 'error'); return; }

  CARRITO.push({
    id: data.id, variante_id, producto_id, producto_nombre,
    talla, color, precio_unitario, cantidad, imagen, stock_max: 99,
  });

  updateCartUI();
  toast('🛒 Agregado al carrito', 'success');
  openCart();
}

// ─── ACTUALIZAR CANTIDAD ─────────────────────────────────────────────
async function updateCartItemQty(cartItemId, newQty) {
  if (newQty <= 0) { await removeCartItem(cartItemId); return; }

  const { error } = await sb.from('carrito')
    .update({ cantidad: newQty, updated_at: new Date().toISOString() })
    .eq('id', cartItemId);

  if (!error) {
    const item = CARRITO.find(c => c.id === cartItemId);
    if (item) item.cantidad = newQty;
    updateCartUI();
    if (document.getElementById('checkout-steps')?.innerHTML) renderCheckout();
  }
}

// ─── ELIMINAR ITEM ───────────────────────────────────────────────────
async function removeCartItem(cartItemId) {
  await sb.from('carrito').delete().eq('id', cartItemId);
  CARRITO = CARRITO.filter(c => c.id !== cartItemId);
  updateCartUI();
  if (document.getElementById('checkout-steps')?.innerHTML) renderCheckout();
}

// ─── VACIAR CARRITO ──────────────────────────────────────────────────
async function clearCarrito() {
  await sb.from('carrito').delete().eq('user_id', APP.user.id);
  CARRITO = [];
  updateCartUI();
}

// ─── CALCULAR TOTALES ────────────────────────────────────────────────
function getCartTotals(cuponDescuento = 0) {
  const subtotal = CARRITO.reduce((s, c) => s + c.precio_unitario * c.cantidad, 0);
  const envio    = 0; // se calcula en checkout según tipo entrega
  const descuento = cuponDescuento;
  const total = Math.max(0, subtotal - descuento + envio);
  return { subtotal, envio, descuento, total };
}

// ─── UI DEL DRAWER ───────────────────────────────────────────────────
function updateCartUI() {
  const count = CARRITO.reduce((s, c) => s + c.cantidad, 0);
  const countEl = document.getElementById('cart-count');
  if (countEl) {
    countEl.textContent = count;
    countEl.style.display = count > 0 ? '' : 'none';
  }

  renderCartItems();
  renderCartFooter();

  const btn = document.getElementById('btn-checkout');
  if (btn) btn.disabled = CARRITO.length === 0;
}

function renderCartItems() {
  const el = document.getElementById('cart-items');
  if (!el) return;

  if (!CARRITO.length) {
    el.innerHTML = `
      <div class="cart-empty">
        <div class="e-icon">🛒</div>
        <p style="margin-bottom:16px">Tu carrito está vacío</p>
        <button class="btn btn-gold btn-sm" onclick="closeCart();showSection('catalogo')">Explorar catálogo</button>
      </div>`;
    return;
  }

  el.innerHTML = CARRITO.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${item.imagen ? `<img src="${item.imagen}" alt="" />` : '👟'}
      </div>
      <div>
        <div class="cart-item-name">${item.producto_nombre}</div>
        <div class="cart-item-variant">
          ${item.talla ? `Talla ${item.talla}` : ''}
          ${item.color ? ` · ${item.color}` : ''}
        </div>
        <div class="cart-item-qty">
          <button class="ci-qty-btn" onclick="updateCartItemQty('${item.id}', ${item.cantidad - 1})">−</button>
          <div class="ci-qty-val">${item.cantidad}</div>
          <button class="ci-qty-btn" onclick="updateCartItemQty('${item.id}', ${item.cantidad + 1})">+</button>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
        <div class="cart-item-price">${fmtMoneyFull(item.precio_unitario * item.cantidad)}</div>
        <button class="cart-item-del" onclick="removeCartItem('${item.id}')">🗑</button>
      </div>
    </div>
  `).join('');
}

function renderCartFooter() {
  const el = document.getElementById('cart-summary');
  if (!el) return;
  const { subtotal, total } = getCartTotals();
  el.innerHTML = `
    <div class="cart-row"><span>Subtotal (${CARRITO.reduce((s,c)=>s+c.cantidad,0)} art.)</span><span>${fmtMoneyFull(subtotal)}</span></div>
    <div class="cart-row"><span>Envío</span><span style="color:var(--green)">Se calcula al pagar</span></div>
    <div class="cart-row total"><span>TOTAL</span><span>${fmtMoneyFull(total)}</span></div>
  `;
}

// ─── OPEN / CLOSE DRAWER ────────────────────────────────────────────
function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  const ov = document.getElementById('cart-overlay');
  ov.style.display = 'block';
  setTimeout(() => ov.classList.add('show'), 10);
}

function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  const ov = document.getElementById('cart-overlay');
  ov.classList.remove('show');
  setTimeout(() => ov.style.display = 'none', 300);
}

function goToCheckout() {
  closeCart();
  showSection('checkout');
}
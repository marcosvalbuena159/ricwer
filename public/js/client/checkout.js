// ─── RICWER CLIENT — checkout.js ────────────────────────────────────
let CHECKOUT = {
  tipoEntrega: 'recogida',   // 'recogida' | 'domicilio'
  direccionId: null,
  direccionNueva: null,       // objeto si es dirección nueva
  metodoPago: 'nequi',
  cupon: null,
  cuponDescuento: 0,
  costoEnvio: 0,
};

const COSTO_ENVIO_DOM = 10000; // $10.000 fijo (personalizar)

const METODOS_PAGO = [
  { id: 'nequi',       icon: '📱', label: 'Nequi',             sub: 'Pago inmediato' },
  { id: 'daviplata',   icon: '📲', label: 'Daviplata',         sub: 'Pago inmediato' },
  { id: 'transferencia', icon: '🏦', label: 'Transferencia',   sub: 'Bancolombia / PSE' },
  { id: 'tarjeta',     icon: '💳', label: 'Tarjeta',           sub: 'Crédito o débito' },
  { id: 'efectivo',    icon: '💵', label: 'Contra entrega',    sub: 'Solo domicilio' },
];

// ─── RENDER CHECKOUT ─────────────────────────────────────────────────
async function renderCheckout() {
  if (!CARRITO.length) { showSection('catalogo'); return; }

  const stepsEl   = document.getElementById('checkout-steps');
  const summaryEl = document.getElementById('checkout-summary');
  if (!stepsEl || !summaryEl) return;

  // Cargar direcciones
  const { data: dirs } = await sb
    .from('direcciones')
    .select('*')
    .eq('user_id', APP.user.id)
    .order('es_principal', { ascending: false });
  const direcciones = dirs || [];

  const totals = getCartTotals(CHECKOUT.cuponDescuento);
  totals.envio = CHECKOUT.tipoEntrega === 'domicilio' ? COSTO_ENVIO_DOM : 0;
  const totalFinal = totals.subtotal - totals.descuento + totals.envio;

  // ── STEPS ──
  stepsEl.innerHTML = `

    <!-- PASO 1: TIPO ENTREGA -->
    <div class="checkout-step">
      <div class="step-header">
        <div class="step-num">1</div>
        <div class="step-title">TIPO DE ENTREGA</div>
      </div>
      <div class="delivery-tabs">
        <button class="delivery-tab ${CHECKOUT.tipoEntrega === 'recogida' ? 'active' : ''}" onclick="setTipoEntrega('recogida')">
          <div class="dt-icon">🏪</div>
          <div class="dt-title">Recoger en tienda</div>
          <div class="dt-desc">Medellín · Gratis<br>Listo en 1-2 días hábiles</div>
        </button>
        <button class="delivery-tab ${CHECKOUT.tipoEntrega === 'domicilio' ? 'active' : ''}" onclick="setTipoEntrega('domicilio')">
          <div class="dt-icon">🚚</div>
          <div class="dt-title">Envío a domicilio</div>
          <div class="dt-desc">Todo Colombia · ${fmtMoneyFull(COSTO_ENVIO_DOM)}<br>2-5 días hábiles</div>
        </button>
      </div>
      ${CHECKOUT.tipoEntrega === 'recogida' ? `
        <div style="padding:14px 16px;background:var(--gold-bg);border:1px solid rgba(201,168,76,0.2);border-radius:var(--radius);font-size:13px;color:var(--text-muted)">
          📍 <strong style="color:var(--text)">Tienda RICWER</strong><br>
          Medellín, Antioquia · Horario: Lun-Sáb 8am-7pm<br>
          Te avisaremos cuando tu pedido esté listo.
        </div>
      ` : `
        <div id="dir-section">
          ${renderDireccionesHTML(direcciones)}
        </div>
      `}
    </div>

    <!-- PASO 2: DATOS CONTACTO -->
    <div class="checkout-step">
      <div class="step-header">
        <div class="step-num">2</div>
        <div class="step-title">DATOS DE CONTACTO</div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Nombre</label>
          <input class="form-input" id="co-nombre" value="${APP.profile?.nombre || ''}" placeholder="Tu nombre" />
        </div>
        <div class="form-group">
          <label class="form-label">Apellido</label>
          <input class="form-input" id="co-apellido" value="${APP.profile?.apellido || ''}" placeholder="Tu apellido" />
        </div>
        <div class="form-group">
          <label class="form-label">Teléfono</label>
          <input class="form-input" id="co-tel" value="${APP.profile?.telefono || ''}" placeholder="+57 300 000 0000" type="tel" />
        </div>
        <div class="form-group">
          <label class="form-label">Correo</label>
          <input class="form-input" id="co-email" value="${APP.user?.email || ''}" disabled style="opacity:0.6" />
        </div>
        <div class="form-group span2">
          <label class="form-label">Notas para el pedido (opcional)</label>
          <textarea class="form-textarea" id="co-notas" placeholder="Ej: dejar con el portero, talla especial..."></textarea>
        </div>
      </div>
    </div>

    <!-- PASO 3: MÉTODO DE PAGO -->
    <div class="checkout-step">
      <div class="step-header">
        <div class="step-num">3</div>
        <div class="step-title">MÉTODO DE PAGO</div>
      </div>
      <div class="payment-methods">
        ${METODOS_PAGO.filter(m => CHECKOUT.tipoEntrega === 'domicilio' || m.id !== 'efectivo').map(m => `
          <button class="pay-option ${CHECKOUT.metodoPago === m.id ? 'active' : ''}" onclick="setMetodoPago('${m.id}')">
            <span class="pay-icon">${m.icon}</span>
            <span>
              <span class="pay-label">${m.label}</span>
              <span class="pay-sub">${m.sub}</span>
            </span>
          </button>
        `).join('')}
      </div>
      ${CHECKOUT.metodoPago === 'nequi' || CHECKOUT.metodoPago === 'daviplata' ? `
        <div style="margin-top:16px;padding:14px;background:var(--surface2);border-radius:var(--radius);font-size:13px;color:var(--text-muted)">
          📱 Número: <strong style="color:var(--gold)">300 000 0000</strong><br>
          Envía el comprobante a WhatsApp y tu pedido será confirmado en minutos.
        </div>
      ` : ''}
      ${CHECKOUT.metodoPago === 'transferencia' ? `
        <div style="margin-top:16px;padding:14px;background:var(--surface2);border-radius:var(--radius);font-size:13px;color:var(--text-muted)">
          🏦 Bancolombia Ahorros · CC 123-456789-12<br>
          A nombre de <strong style="color:var(--text)">RICWER SAS</strong><br>
          Envía el soporte por WhatsApp.
        </div>
      ` : ''}
    </div>

    <!-- CONFIRMAR -->
    <button class="btn btn-gold btn-full btn-lg" onclick="confirmarOrden()" id="btn-confirmar" style="margin-top:8px">
      Confirmar pedido · ${fmtMoneyFull(totalFinal)}
    </button>
    <p style="text-align:center;font-size:11px;color:var(--text-dim);margin-top:10px">
      Al confirmar aceptas nuestros <button class="btn btn-ghost" style="font-size:11px;padding:0;letter-spacing:0;text-transform:none" onclick="openModal('modal-terminos')">términos y condiciones</button>
    </p>
  `;

  // ── ORDER SUMMARY ──
  summaryEl.innerHTML = `
    <div class="order-summary">
      <div class="os-title">TU PEDIDO</div>
      <div class="os-items">
        ${CARRITO.map(item => `
          <div class="os-item">
            <div class="os-item-img">${item.imagen ? `<img src="${item.imagen}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:3px"/>` : '👟'}</div>
            <div class="os-item-info">
              <div class="os-item-name">${item.producto_nombre}</div>
              <div class="os-item-var">T${item.talla || '?'} ${item.color ? '· ' + item.color : ''} × ${item.cantidad}</div>
            </div>
            <div class="os-item-price">${fmtMoneyFull(item.precio_unitario * item.cantidad)}</div>
          </div>
        `).join('')}
      </div>
      <div class="os-divider"></div>

      <div class="coupon-wrap">
        <input class="coupon-input" id="coupon-input" placeholder="CÓDIGO DESCUENTO" maxlength="20" />
        <button class="btn btn-outline btn-sm" onclick="aplicarCupon()">Aplicar</button>
      </div>

      <div class="os-row"><span>Subtotal</span><span>${fmtMoneyFull(totals.subtotal)}</span></div>
      ${CHECKOUT.cuponDescuento > 0 ? `<div class="os-row" style="color:var(--green)"><span>Descuento</span><span>-${fmtMoneyFull(CHECKOUT.cuponDescuento)}</span></div>` : ''}
      <div class="os-row"><span>Envío</span><span>${totals.envio > 0 ? fmtMoneyFull(totals.envio) : '<span style="color:var(--green)">Gratis</span>'}</span></div>
      <div class="os-row total"><span>TOTAL</span><span>${fmtMoneyFull(totalFinal)}</span></div>
    </div>
  `;
}

function renderDireccionesHTML(dirs) {
  return `
    <div style="margin-bottom:16px">
      ${dirs.map(d => `
        <div class="delivery-tab" style="margin-bottom:8px;${CHECKOUT.direccionId === d.id ? 'border-color:var(--gold);background:var(--gold-bg)' : ''}"
          onclick="selectDireccion('${d.id}')">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div class="dt-title">${d.alias || 'Casa'} ${d.es_principal ? '⭐' : ''}</div>
              <div class="dt-desc">${d.direccion}<br>${d.ciudad}, ${d.departamento}${d.telefono ? '<br>📱 ' + d.telefono : ''}</div>
            </div>
            ${CHECKOUT.direccionId === d.id ? '<span style="color:var(--gold);font-size:20px">✓</span>' : ''}
          </div>
        </div>
      `).join('')}
    </div>
    <button class="btn btn-outline btn-sm" onclick="showNuevaDireccion()">+ Nueva dirección</button>
    <div id="nueva-dir-form" style="display:none;margin-top:16px">
      <div class="form-grid">
        <div class="form-group span2">
          <label class="form-label">Dirección *</label>
          <input class="form-input" id="nd-dir" placeholder="Calle 10 # 43-55, Apto 301" />
        </div>
        <div class="form-group">
          <label class="form-label">Ciudad *</label>
          <input class="form-input" id="nd-ciudad" value="Medellín" />
        </div>
        <div class="form-group">
          <label class="form-label">Departamento</label>
          <input class="form-input" id="nd-depto" value="Antioquia" />
        </div>
        <div class="form-group">
          <label class="form-label">Teléfono de contacto</label>
          <input class="form-input" id="nd-tel" placeholder="+57 300 000 0000" type="tel" />
        </div>
        <div class="form-group">
          <label class="form-label">Alias (ej: Casa, Trabajo)</label>
          <input class="form-input" id="nd-alias" placeholder="Casa" value="Casa" />
        </div>
      </div>
      <button class="btn btn-gold btn-sm" style="margin-top:12px" onclick="guardarNuevaDireccion()">Guardar dirección</button>
    </div>
  `;
}

function setTipoEntrega(tipo) {
  CHECKOUT.tipoEntrega = tipo;
  CHECKOUT.direccionId = null;
  if (tipo === 'recogida') CHECKOUT.metodoPago = 'nequi'; // reset pago
  renderCheckout();
}

function selectDireccion(id) {
  CHECKOUT.direccionId = id;
  renderCheckout();
}

function showNuevaDireccion() {
  const f = document.getElementById('nueva-dir-form');
  if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

async function guardarNuevaDireccion() {
  const dir   = document.getElementById('nd-dir')?.value.trim();
  const ciudad = document.getElementById('nd-ciudad')?.value.trim() || 'Medellín';
  const depto  = document.getElementById('nd-depto')?.value.trim() || 'Antioquia';
  const tel    = document.getElementById('nd-tel')?.value.trim();
  const alias  = document.getElementById('nd-alias')?.value.trim() || 'Casa';
  if (!dir) { toast('Ingresa la dirección', 'error'); return; }

  const { data, error } = await sb.from('direcciones').insert({
    user_id: APP.user.id, alias, direccion: dir, ciudad, departamento: depto,
    telefono: tel, es_principal: false,
  }).select().single();

  if (error) { toast('Error guardando dirección', 'error'); return; }
  CHECKOUT.direccionId = data.id;
  toast('✅ Dirección guardada', 'success');
  renderCheckout();
}

function setMetodoPago(metodo) {
  CHECKOUT.metodoPago = metodo;
  renderCheckout();
}

async function aplicarCupon() {
  const codigo = document.getElementById('coupon-input')?.value.trim().toUpperCase();
  if (!codigo) return;

  const { data, error } = await sb
    .from('cupones')
    .select('*')
    .eq('codigo', codigo)
    .eq('activo', true)
    .single();

  if (error || !data) { toast('Cupón no válido o expirado', 'error'); return; }

  // Validar fechas
  const hoy = new Date();
  if (data.fecha_inicio && new Date(data.fecha_inicio) > hoy) { toast('El cupón aún no está activo', 'error'); return; }
  if (data.fecha_fin && new Date(data.fecha_fin) < hoy) { toast('El cupón ha expirado', 'error'); return; }
  if (data.usos_maximos && data.usos_actuales >= data.usos_maximos) { toast('El cupón ya fue usado el máximo de veces', 'error'); return; }

  const totals = getCartTotals();
  if (totals.subtotal < data.minimo_compra) { toast(`Mínimo de compra: ${fmtMoneyFull(data.minimo_compra)}`, 'error'); return; }

  CHECKOUT.cupon = data;
  CHECKOUT.cuponDescuento = data.tipo === 'porcentaje'
    ? Math.round(totals.subtotal * (data.valor / 100))
    : Number(data.valor);

  toast(`✅ Cupón aplicado: -${fmtMoneyFull(CHECKOUT.cuponDescuento)}`, 'success');
  renderCheckout();
}

// ─── CONFIRMAR ORDEN ─────────────────────────────────────────────────
async function confirmarOrden() {
  // Validaciones
  if (CHECKOUT.tipoEntrega === 'domicilio' && !CHECKOUT.direccionId) {
    toast('Selecciona o agrega una dirección de envío', 'error'); return;
  }
  if (!CHECKOUT.metodoPago) {
    toast('Selecciona un método de pago', 'error'); return;
  }

  const nombre  = document.getElementById('co-nombre')?.value.trim();
  const apellido = document.getElementById('co-apellido')?.value.trim();
  const tel     = document.getElementById('co-tel')?.value.trim();
  const notas   = document.getElementById('co-notas')?.value.trim();

  if (!nombre || !tel) { toast('Completa nombre y teléfono', 'error'); return; }

  const btn = document.getElementById('btn-confirmar');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Procesando...'; }

  try {
    const totals = getCartTotals(CHECKOUT.cuponDescuento);
    totals.envio = CHECKOUT.tipoEntrega === 'domicilio' ? COSTO_ENVIO_DOM : 0;
    const totalFinal = totals.subtotal - totals.descuento + totals.envio;

    // Obtener dirección texto
    let dirTexto = CHECKOUT.tipoEntrega === 'recogida' ? 'Recogida en tienda — Medellín' : null;
    if (CHECKOUT.tipoEntrega === 'domicilio' && CHECKOUT.direccionId) {
      const { data: d } = await sb.from('direcciones').select('*').eq('id', CHECKOUT.direccionId).single();
      if (d) dirTexto = `${d.direccion}, ${d.ciudad}, ${d.departamento}`;
    }

    // Crear orden
    const { data: orden, error: errOrden } = await sb.from('ordenes').insert({
      user_id:         APP.user.id,
      estado:          'pendiente',
      tipo_entrega:    CHECKOUT.tipoEntrega,
      direccion_id:    CHECKOUT.direccionId,
      direccion_texto: dirTexto,
      subtotal:        totals.subtotal,
      descuento:       totals.descuento,
      costo_envio:     totals.envio,
      total:           totalFinal,
      metodo_pago:     CHECKOUT.metodoPago,
      estado_pago:     'pendiente',
      notas_cliente:   `${nombre} ${apellido} · ${tel}${notas ? ' · ' + notas : ''}`,
      fecha:           today(),
    }).select().single();

    if (errOrden) throw errOrden;

    // Crear items
    const items = CARRITO.map(c => ({
      orden_id:        orden.id,
      producto_id:     c.producto_id,
      variante_id:     c.variante_id,
      producto_nombre: c.producto_nombre,
      talla:           c.talla,
      color:           c.color,
      cantidad:        c.cantidad,
      precio_unitario: c.precio_unitario,
      subtotal:        c.precio_unitario * c.cantidad,
    }));
    await sb.from('orden_items').insert(items);

    // Actualizar usos cupón
    if (CHECKOUT.cupon) {
      await sb.from('cupones').update({ usos_actuales: CHECKOUT.cupon.usos_actuales + 1 }).eq('id', CHECKOUT.cupon.id);
    }

    // Actualizar stock variantes
    for (const c of CARRITO) {
      if (c.variante_id) {
        const { data: v } = await sb.from('producto_variantes').select('stock').eq('id', c.variante_id).single();
        if (v) await sb.from('producto_variantes').update({ stock: Math.max(0, v.stock - c.cantidad) }).eq('id', c.variante_id);
      }
    }

    // Vaciar carrito
    await clearCarrito();

    // Reset checkout state
    CHECKOUT = { tipoEntrega: 'recogida', direccionId: null, metodoPago: 'nequi', cupon: null, cuponDescuento: 0, costoEnvio: 0 };

    // Mostrar confirmación
    mostrarConfirmacionOrden(orden);

  } catch (err) {
    console.error(err);
    toast('Error al procesar el pedido. Intenta de nuevo.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Confirmar pedido'; }
  }
}

function mostrarConfirmacionOrden(orden) {
  const stepsEl = document.getElementById('checkout-steps');
  const summaryEl = document.getElementById('checkout-summary');
  if (stepsEl) stepsEl.innerHTML = `
    <div style="text-align:center;padding:48px 20px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg)">
      <div style="font-size:64px;margin-bottom:16px">🎉</div>
      <h2 style="font-family:var(--font-display);font-size:36px;letter-spacing:3px;color:var(--white);margin-bottom:8px">¡PEDIDO CONFIRMADO!</h2>
      <p style="color:var(--gold);font-family:var(--font-display);font-size:22px;letter-spacing:2px;margin-bottom:16px">${orden.numero_orden}</p>
      <p style="color:var(--text-muted);font-size:14px;line-height:1.7;margin-bottom:32px;max-width:400px;margin-left:auto;margin-right:auto">
        Recibiste un correo de confirmación. ${CHECKOUT.tipoEntrega === 'recogida'
          ? 'Te avisaremos cuando tu pedido esté listo para recoger en tienda.'
          : 'Tu pedido llegará en 2-5 días hábiles.'
        }
      </p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-gold" onclick="showSection('ordenes')">Ver mis pedidos</button>
        <button class="btn btn-outline" onclick="showSection('home')">Seguir comprando</button>
      </div>
    </div>
  `;
  if (summaryEl) summaryEl.innerHTML = '';
}
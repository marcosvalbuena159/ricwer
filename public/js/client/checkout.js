// ─── RICWER CLIENT — checkout.js (Wompi Edition) ─────────────────────
// Flujo por pasos: Entrega → Dirección → Contacto → Pago

let CHECKOUT = {
  tipoEntrega:    'recogida',
  direccionId:    null,
  metodoPago:     'wompi',
  cupon:          null,
  cuponDescuento: 0,
  costoEnvio:     0,
  // Control de pasos
  pasoActual:     1,   // 1=entrega, 2=dirección/datos, 3=pago
};

const COSTO_ENVIO_DOM = 10000;

const WOMPI_ENV     = 'sandbox';
const WOMPI_PUB_KEY = WOMPI_ENV === 'production'
  ? 'pub_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
  : 'pub_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
const WOMPI_REDIRECT_URL = window.location.origin + '/cliente#ordenes';
const WOMPI_API_BASE = WOMPI_ENV === 'production'
  ? 'https://production.wompi.co/v1'
  : 'https://sandbox.wompi.co/v1';

const METODOS_PAGO = [
  { id: 'wompi',    icon: '💳', label: 'Pagar en línea',
    sub: 'Tarjeta, Nequi, PSE, Bancolombia · Powered by Wompi' },
  { id: 'efectivo', icon: '💵', label: 'Contra entrega',
    sub: 'Solo domicilio · El cobrador te visitará' },
];

// ─── RENDER CHECKOUT ─────────────────────────────────────────────────
async function renderCheckout() {
  if (!CARRITO.length) { showSection('catalogo'); return; }

  const stepsEl   = document.getElementById('checkout-steps');
  const summaryEl = document.getElementById('checkout-summary');
  if (!stepsEl || !summaryEl) return;

  const { data: dirs } = await sb
    .from('direcciones').select('*')
    .eq('user_id', APP.user.id)
    .order('es_principal', { ascending: false });
  const direcciones = dirs || [];

  const totals = getCartTotals(CHECKOUT.cuponDescuento);
  totals.envio = CHECKOUT.tipoEntrega === 'domicilio' ? COSTO_ENVIO_DOM : 0;
  const totalFinal = Math.max(0, totals.subtotal - totals.descuento + totals.envio);

  const esDomicilio = CHECKOUT.tipoEntrega === 'domicilio';

  stepsEl.innerHTML = `

    <!-- ══ PASO 1: TIPO DE ENTREGA ══════════════════════════════ -->
    <div class="co-step ${CHECKOUT.pasoActual >= 1 ? 'active' : ''}" id="co-step-1">
      <div class="co-step-header" onclick="irAPaso(1)">
        <div class="co-step-num ${CHECKOUT.pasoActual > 1 ? 'done' : ''}">
          ${CHECKOUT.pasoActual > 1 ? '✓' : '1'}
        </div>
        <div class="co-step-title">TIPO DE ENTREGA</div>
        ${CHECKOUT.pasoActual > 1 ? `
          <div class="co-step-summary">
            ${CHECKOUT.tipoEntrega === 'recogida' ? '🏪 Recogida en tienda' : '🚚 Domicilio'}
          </div>` : ''}
      </div>
      <div class="co-step-body" id="co-body-1">
        <div class="delivery-tabs">
          <button class="delivery-tab ${CHECKOUT.tipoEntrega === 'recogida' ? 'active' : ''}"
            onclick="setTipoEntrega('recogida')">
            <div class="dt-icon">🏪</div>
            <div class="dt-title">Recoger en tienda</div>
            <div class="dt-desc">Bogotá · Gratis · Listo en 1-2 días</div>
          </button>
          <button class="delivery-tab ${CHECKOUT.tipoEntrega === 'domicilio' ? 'active' : ''}"
            onclick="setTipoEntrega('domicilio')">
            <div class="dt-icon">🚚</div>
            <div class="dt-title">Envío a domicilio</div>
            <div class="dt-desc">Todo Colombia · ${fmtMoneyFull(COSTO_ENVIO_DOM)} · 2-5 días</div>
          </button>
        </div>
        <button class="btn btn-gold co-next-btn" onclick="irAPaso(2)">
          Continuar →
        </button>
      </div>
    </div>

    <!-- ══ PASO 2: DIRECCIÓN (solo domicilio) + DATOS CONTACTO ══ -->
    <div class="co-step ${CHECKOUT.pasoActual >= 2 ? 'active' : 'locked'}" id="co-step-2">
      <div class="co-step-header" onclick="CHECKOUT.pasoActual > 2 && irAPaso(2)">
        <div class="co-step-num ${CHECKOUT.pasoActual > 2 ? 'done' : ''}">
          ${CHECKOUT.pasoActual > 2 ? '✓' : '2'}
        </div>
        <div class="co-step-title">${esDomicilio ? 'DIRECCIÓN Y CONTACTO' : 'DATOS DE CONTACTO'}</div>
        ${CHECKOUT.pasoActual > 2 ? `
          <div class="co-step-summary">
            ${document.getElementById('co-nombre')?.value || APP.profile?.nombre || 'Completado'} ✓
          </div>` : ''}
      </div>
      <div class="co-step-body" id="co-body-2">

        ${esDomicilio ? `
        <!-- Dirección de envío -->
        <div class="co-section-label">📍 DIRECCIÓN DE ENVÍO</div>
        <div id="dir-section">
          ${renderDireccionesHTML(direcciones)}
        </div>
        <div style="height:16px"></div>
        ` : `
        <!-- Info tienda -->
        <div style="padding:12px 16px;background:var(--gold-bg);border:1px solid rgba(201,168,76,0.25);border-radius:var(--radius);font-size:13px;color:var(--text-muted);margin-bottom:16px">
          📍 <strong style="color:var(--text)">Tienda RICWER</strong> · Bogotá, Colombia<br>
          Lun-Sáb 8am–7pm · Te avisaremos cuando tu pedido esté listo.
        </div>
        `}

        <!-- Datos de contacto -->
        <div class="co-section-label">👤 DATOS DE CONTACTO</div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Nombre *</label>
            <input class="form-input" id="co-nombre"
              value="${APP.profile?.nombre || ''}" placeholder="Tu nombre">
          </div>
          <div class="form-group">
            <label class="form-label">Apellido *</label>
            <input class="form-input" id="co-apellido"
              value="${APP.profile?.apellido || ''}" placeholder="Tu apellido">
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono *</label>
            <input class="form-input" id="co-tel" type="tel"
              value="${APP.profile?.telefono || ''}" placeholder="+57 300 000 0000">
          </div>
          <div class="form-group">
            <label class="form-label">Correo</label>
            <input class="form-input" id="co-email"
              value="${APP.user?.email || ''}" disabled style="opacity:0.6">
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Notas para el pedido (opcional)</label>
            <textarea class="form-textarea" id="co-notas"
              placeholder="Ej: dejar con el portero, referencia especial..."></textarea>
          </div>
        </div>

        <button class="btn btn-gold co-next-btn" onclick="irAPaso(3)">
          Continuar →
        </button>
      </div>
    </div>

    <!-- ══ PASO 3: MÉTODO DE PAGO ════════════════════════════════ -->
    <div class="co-step ${CHECKOUT.pasoActual >= 3 ? 'active' : 'locked'}" id="co-step-3">
      <div class="co-step-header">
        <div class="co-step-num">3</div>
        <div class="co-step-title">MÉTODO DE PAGO</div>
      </div>
      <div class="co-step-body" id="co-body-3">
        <div class="payment-methods">
          ${METODOS_PAGO
            .filter(m => esDomicilio || m.id !== 'efectivo')
            .map(m => `
              <button class="pay-option ${CHECKOUT.metodoPago === m.id ? 'active' : ''}"
                onclick="setMetodoPago('${m.id}')">
                <span class="pay-icon">${m.icon}</span>
                <span>
                  <span class="pay-label">${m.label}</span>
                  <span class="pay-sub">${m.sub}</span>
                </span>
              </button>`).join('')}
        </div>

        ${CHECKOUT.metodoPago === 'wompi' ? `
          <div class="co-info-box">
            🔒 Pago 100% seguro por <strong>Wompi (Bancolombia)</strong><br>
            Tarjeta crédito/débito · Nequi · PSE · Bancolombia a la mano
          </div>` : `
          <div class="co-info-box">
            💵 Paga al recibir tu pedido en la puerta.<br>
            Ten el monto exacto. Solo disponible para domicilios.
          </div>`}

        <!-- Cupón -->
        <div class="co-section-label" style="margin-top:16px">🏷️ CÓDIGO PROMOCIONAL</div>
        <div class="coupon-row">
          <input class="form-input coupon-input" id="co-cupon"
            placeholder="Ej: RICWER10"
            value="${CHECKOUT.cupon || ''}">
          <button class="btn btn-ghost" onclick="aplicarCupon()">Aplicar</button>
        </div>
        ${CHECKOUT.cuponDescuento > 0 ? `
          <div style="font-size:13px;color:var(--green);margin-top:6px;font-weight:600">
            ✅ Descuento aplicado: −${fmtMoneyFull(CHECKOUT.cuponDescuento)}
          </div>` : ''}

        <!-- Confirmar -->
        <button class="btn btn-gold btn-full" style="margin-top:20px;padding:16px;font-size:14px;letter-spacing:2px"
          onclick="confirmarOrden()" id="btn-confirmar">
          ${CHECKOUT.metodoPago === 'wompi'
            ? `🔒 Ir a pagar · ${fmtMoneyFull(totalFinal)}`
            : `✅ Confirmar pedido · ${fmtMoneyFull(totalFinal)}`}
        </button>
        <p style="text-align:center;font-size:11px;color:var(--text-dim);margin-top:8px">
          Al confirmar aceptas nuestros
          <button class="btn btn-ghost" style="font-size:11px;padding:0;text-transform:none;letter-spacing:0"
            onclick="openModal('modal-terminos')">términos y condiciones</button>
        </p>
      </div>
    </div>
  `;

  renderOrderSummary(summaryEl, totals, totalFinal);
}

// ─── CONTROL DE PASOS ────────────────────────────────────────────────
function irAPaso(paso) {
  // Validar antes de avanzar
  if (paso === 2 && CHECKOUT.pasoActual === 1) {
    CHECKOUT.pasoActual = 2;
    renderCheckout();
    return;
  }
  if (paso === 3 && CHECKOUT.pasoActual === 2) {
    // Validar datos de contacto
    const nombre = document.getElementById('co-nombre')?.value.trim();
    const tel    = document.getElementById('co-tel')?.value.trim();
    if (!nombre) { toast('Ingresa tu nombre', 'error'); return; }
    if (!tel)    { toast('Ingresa tu teléfono', 'error'); return; }
    if (CHECKOUT.tipoEntrega === 'domicilio' && !CHECKOUT.direccionId) {
      toast('Selecciona o agrega una dirección de envío', 'error'); return;
    }
    CHECKOUT.pasoActual = 3;
    renderCheckout();
    return;
  }
  // Volver atrás siempre es válido
  if (paso < CHECKOUT.pasoActual) {
    CHECKOUT.pasoActual = paso;
    renderCheckout();
  }
}

// ─── RESUMEN DE ORDEN ────────────────────────────────────────────────
function renderOrderSummary(el, totals, totalFinal) {
  el.innerHTML = `
    <div class="order-summary">
      <div class="os-title">TU PEDIDO</div>
      <div class="os-items">
        ${CARRITO.map(item => `
          <div class="os-item">
            <div class="os-item-img">
              ${item.imagen
                ? `<img src="${item.imagen}" alt="" style="width:100%;height:100%;object-fit:cover">`
                : '👟'}
            </div>
            <div class="os-item-info">
              <div class="os-item-name">${item.producto_nombre}</div>
              <div class="os-item-meta">
                ${item.talla ? `T${item.talla}` : ''}
                ${item.color ? ` · ${item.color}` : ''}
                · ×${item.cantidad}
              </div>
            </div>
            <div class="os-item-price">${fmtMoneyFull(item.precio_unitario * item.cantidad)}</div>
          </div>`).join('')}
      </div>
      <div class="os-totals">
        <div class="os-row"><span>Subtotal</span><span>${fmtMoneyFull(totals.subtotal)}</span></div>
        ${totals.envio > 0 ? `<div class="os-row"><span>Envío</span><span>${fmtMoneyFull(totals.envio)}</span></div>` : `<div class="os-row"><span>Envío</span><span style="color:var(--green)">Gratis</span></div>`}
        ${totals.descuento > 0 ? `<div class="os-row" style="color:var(--green)"><span>Descuento</span><span>−${fmtMoneyFull(totals.descuento)}</span></div>` : ''}
        <div class="os-row os-total"><span>TOTAL</span><span>${fmtMoneyFull(totalFinal)}</span></div>
      </div>
    </div>
  `;
}



function setTipoEntrega(tipo) {
  CHECKOUT.tipoEntrega = tipo;
  CHECKOUT.direccionId = null;
  if (tipo === 'recogida') CHECKOUT.metodoPago = 'wompi';
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
  const dir    = document.getElementById('nd-dir')?.value.trim();
  const ciudad = document.getElementById('nd-ciudad')?.value.trim() || 'Bogotá';
  const depto  = document.getElementById('nd-depto')?.value.trim() || 'Cundinamarca';
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

  const nombre   = document.getElementById('co-nombre')?.value.trim();
  const apellido = document.getElementById('co-apellido')?.value.trim();
  const tel      = document.getElementById('co-tel')?.value.trim();
  const notas    = document.getElementById('co-notas')?.value.trim();

  if (!nombre || !tel) { toast('Completa nombre y teléfono', 'error'); return; }

  const btn = document.getElementById('btn-confirmar');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Procesando...'; }

  try {
    const totals = getCartTotals(CHECKOUT.cuponDescuento);
    totals.envio = CHECKOUT.tipoEntrega === 'domicilio' ? COSTO_ENVIO_DOM : 0;
    const totalFinal = Math.max(0, totals.subtotal - totals.descuento + totals.envio);

    // Dirección texto
    let dirTexto = CHECKOUT.tipoEntrega === 'recogida' ? 'Recogida en tienda — RICWER Bogotá' : null;
    if (CHECKOUT.tipoEntrega === 'domicilio' && CHECKOUT.direccionId) {
      const { data: d } = await sb.from('direcciones').select('*').eq('id', CHECKOUT.direccionId).single();
      if (d) dirTexto = `${d.direccion}, ${d.ciudad}, ${d.departamento}`;
    }

    // ── Crear orden en Supabase (estado_pago: 'pendiente') ──
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

    // ── Insertar items de la orden ──
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

    const { error: errItems } = await sb.from('orden_items').insert(items);
    if (errItems) {
      // Si falla el insert de items, eliminar la orden huérfana
      await sb.from('ordenes').delete().eq('id', orden.id);
      throw errItems;
    }

    // ── Actualizar usos cupón ──
    if (CHECKOUT.cupon) {
      await sb.from('cupones').update({ usos_actuales: CHECKOUT.cupon.usos_actuales + 1 }).eq('id', CHECKOUT.cupon.id);
    }

    // ── Reducir stock ──
    for (const c of CARRITO) {
      if (c.variante_id) {
        const { data: v } = await sb.from('producto_variantes').select('stock').eq('id', c.variante_id).single();
        if (v) await sb.from('producto_variantes').update({ stock: Math.max(0, v.stock - c.cantidad) }).eq('id', c.variante_id);
      }
    }

    // ── Limpiar carrito local ──
    await clearCarrito();
    CHECKOUT.cupon = null;
    CHECKOUT.cuponDescuento = 0;

    // ── Notificar al admin (best-effort, no bloquea) ──
    try {
      const adminProfiles = await sb.from('profiles').select('id').eq('rol','admin');
      if (adminProfiles.data?.length) {
        const notifs = adminProfiles.data.map(a => ({
          user_id: a.id,
          tipo: 'orden',
          titulo: `Nueva orden ${orden.numero_orden}`,
          cuerpo: `Total: ${fmtMoneyFull(totalFinal)} · ${CHECKOUT.metodoPago === 'wompi' ? 'Wompi' : 'Contra entrega'}`,
          url: '#ordenes',
          leida: false,
        }));
        await sb.from('notificaciones').insert(notifs);
      }
    } catch (_) {}

    // ── Enrutar según método de pago ──
    if (CHECKOUT.metodoPago === 'wompi') {
      abrirWompi(orden, totalFinal, nombre, apellido, tel);
    } else {
      // Contra entrega: confirmar directamente
      Object.assign(CHECKOUT, { tipoEntrega: 'recogida', direccionId: null, metodoPago: 'wompi', cupon: null, cuponDescuento: 0, costoEnvio: 0 });
      mostrarConfirmacionOrden(orden);
    }

  } catch (err) {
    console.error('[confirmarOrden]', err);
    toast('Error al procesar el pedido. Intenta de nuevo.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Confirmar pedido'; }
  }
}

// ─── WOMPI WIDGET ─────────────────────────────────────────────────────
// Documentación: https://docs.wompi.co/docs/colombia/widget/
//
// El widget de Wompi abre una ventana/iframe de pago.
// Al completar el pago, Wompi redirige a WOMPI_REDIRECT_URL con parámetros
// en la URL: ?id=TRANSACTION_ID&...
// Debes verificar el estado del pago en tu backend o con la API de Wompi.

function abrirWompi(orden, totalCOP, nombre, apellido, tel) {
  // Wompi requiere el monto en CENTAVOS (COP × 100)
  const amountInCents = Math.round(totalCOP * 100);

  // Referencia única por orden (máx 50 chars)
  const referencia = orden.numero_orden || ('RW-' + orden.id.slice(0, 8).toUpperCase());

  // Guardar referencia en la orden (sin await, no bloquea)
  sb.from('ordenes').update({ referencia_pago: referencia }).eq('id', orden.id);

  // Construir la URL de redirect con el número de orden
  const redirectUrl = `${WOMPI_REDIRECT_URL}&orden_id=${orden.id}`;

  // ── Abrir el widget de Wompi ──
  // Requiere que <script src="https://checkout.wompi.co/widget.js"> esté en el HTML
  const checkout = new WidgetCheckout({
    currency:          'COP',
    amountInCents:     amountInCents,
    reference:         referencia,
    publicKey:         WOMPI_PUB_KEY,
    redirectUrl:       redirectUrl,          // Wompi redirige aquí al terminar
    customerData: {
      email:      APP.user.email || '',
      fullName:   `${nombre} ${apellido}`.trim(),
      phoneNumber: tel.replace(/\D/g, ''),  // solo dígitos
      phoneNumberPrefix: '+57',
      legalId:    '',                        // opcional: cédula
      legalIdType: 'CC',
    },
    // Opcional: fija el tipo de pago (quitar para mostrar todos)
    // paymentMethod: { type: 'NEQUI' },
  });

  checkout.open(result => {
    // Este callback se ejecuta si el usuario CIERRA el widget sin pagar
    // o cuando Wompi llama al redirect (depende del modo).
    // Lo más robusto es verificar el estado en la página de retorno.
    const transaction = result?.transaction;
    if (transaction?.status === 'APPROVED') {
      _onPagoAprobado(orden, transaction.id);
    } else if (transaction?.status === 'DECLINED') {
      toast('❌ Pago rechazado. Intenta con otro método.', 'error');
      // Restaurar botón para que puedan reintentar
      const btn = document.getElementById('btn-confirmar');
      if (btn) { btn.disabled = false; btn.textContent = `Ir a pagar · ${fmtMoneyFull(totalCOP)}`; }
    }
    // Si cerró sin pagar: la orden queda en estado 'pendiente'
    // y el admin puede gestionarla.
  });
}

// ─── VERIFICAR PAGO AL VOLVER DE WOMPI ───────────────────────────────
// Llama esto en el DOMContentLoaded de cliente.html
// cuando detectas los parámetros de Wompi en la URL.
async function verificarRetornoWompi() {
  const params     = new URLSearchParams(window.location.search);
  const transId    = params.get('id');
  const ordenId    = params.get('orden_id');

  if (!transId || !ordenId) return; // No viene de Wompi

  // Limpiar URL
  window.history.replaceState({}, '', window.location.pathname + '#ordenes');

  try {
    // Consultar estado de la transacción directamente a la API de Wompi
    const resp = await fetch(`https://production.wompi.co/v1/transactions/${transId}`);
    // Para sandbox: https://sandbox.wompi.co/v1/transactions/${transId}
    const json = await resp.json();
    const status = json?.data?.status;

    if (status === 'APPROVED') {
      // Actualizar estado de la orden en Supabase
      await sb.from('ordenes').update({
        estado_pago:      'pagado',
        estado:           'confirmado',
        referencia_pago:  transId,
      }).eq('id', ordenId);

      // Obtener orden para mostrar confirmación
      const { data: orden } = await sb.from('ordenes').select('*').eq('id', ordenId).single();
      showSection('ordenes');
      toast('✅ ¡Pago confirmado! Tu pedido está en camino.', 'success');

    } else if (status === 'DECLINED') {
      await sb.from('ordenes').update({ estado_pago: 'rechazado' }).eq('id', ordenId);
      showSection('checkout');
      toast('❌ Pago rechazado. Verifica tu método de pago.', 'error');

    } else if (status === 'VOIDED') {
      await sb.from('ordenes').update({ estado_pago: 'cancelado' }).eq('id', ordenId);
      showSection('home');
      toast('Pago cancelado.', '');

    } else {
      // PENDING: el pago aún se está procesando (PSE, Nequi con demora)
      showSection('ordenes');
      toast('⏳ Pago en procesamiento. Te notificaremos cuando se confirme.', '');
    }

  } catch (e) {
    console.error('[verificarRetornoWompi]', e);
  }
}

// ─── CALLBACK PAGO APROBADO (desde widget en línea) ──────────────────
async function _onPagoAprobado(orden, transactionId) {
  await sb.from('ordenes').update({
    estado_pago:     'pagado',
    estado:          'confirmado',
    referencia_pago: transactionId,
  }).eq('id', orden.id);

  Object.assign(CHECKOUT, { tipoEntrega: 'recogida', direccionId: null, metodoPago: 'wompi', cupon: null, cuponDescuento: 0, costoEnvio: 0 });
  mostrarConfirmacionOrden({ ...orden, estado_pago: 'pagado' });
}

// ─── PANTALLA DE CONFIRMACIÓN ─────────────────────────────────────────
function mostrarConfirmacionOrden(orden) {
  const stepsEl   = document.getElementById('checkout-steps');
  const summaryEl = document.getElementById('checkout-summary');

  const esPagado = orden.estado_pago === 'pagado';

  if (stepsEl) stepsEl.innerHTML = `
    <div style="text-align:center;padding:48px 20px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg)">
      <div style="font-size:64px;margin-bottom:16px">${esPagado ? '🎉' : '✅'}</div>
      <h2 style="font-family:var(--font-display);font-size:36px;letter-spacing:3px;color:var(--white);margin-bottom:8px">
        ${esPagado ? '¡PEDIDO PAGADO!' : '¡PEDIDO RECIBIDO!'}
      </h2>
      <p style="color:var(--gold);font-family:var(--font-display);font-size:22px;letter-spacing:2px;margin-bottom:16px">
        ${orden.numero_orden}
      </p>
      <p style="color:var(--text-muted);font-size:14px;line-height:1.7;margin-bottom:32px;max-width:400px;margin-left:auto;margin-right:auto">
        ${esPagado
          ? (orden.tipo_entrega === 'recogida'
              ? 'Tu pago fue aprobado. Te avisaremos cuando el pedido esté listo para recoger.'
              : 'Tu pago fue aprobado. Tu pedido llegará en 2-5 días hábiles.')
          : 'Recibimos tu pedido. Uno de nuestros asesores te contactará para coordinar el pago y la entrega.'
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
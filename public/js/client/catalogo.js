// ─── FILTROS CATÁLOGO ────────────────────────────────────────────────

function setGeneroFilter(btn, genero) {
  // Actualizar chips activos
  document.querySelectorAll('.cat-genero-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Sincronizar con el select oculto
  const sel = document.getElementById('genero-select');
  if (sel) sel.value = genero;
  renderCatalogo();
}

function setCatFromSelect(slug) {
  _catFilter = slug;
  renderCatalogo();
}

// Poblar select de categorías desde APP.categorias
function fillCatSelect() {
  const sel = document.getElementById('cat-select-drop');
  if (!sel || !APP.categorias) return;
  sel.innerHTML = '<option value="">Categoría</option>' +
    APP.categorias.map(c => `<option value="${c.slug}">${c.nombre}</option>`).join('');
}

// Poblar select de colores con los colores disponibles en los productos
function fillColorSelect(productos) {
  const sel = document.getElementById('color-select');
  if (!sel) return;
  const coloresSet = new Set();
  (productos || []).forEach(p =>
    (p.producto_variantes || []).forEach(v => {
      if (v.activo && v.stock > 0 && v.color) coloresSet.add(v.color);
    })
  );
  const actual = sel.value;
  sel.innerHTML = '<option value="">Color</option>' +
    [...coloresSet].sort().map(color =>
      `<option value="${color}" ${actual === color ? 'selected' : ''}>${color}</option>`
    ).join('');
}

// ─── RICWER CLIENT — catalogo.js ────────────────────────────────────
let _catFilter   = '';    // slug categoría activa
let _catSearch   = '';    // texto búsqueda
let _catTalla    = '';    // talla seleccionada para filtrar
let _catProducts = [];    // caché

// ─── RENDER CATÁLOGO ────────────────────────────────────────────────
async function renderCatalogo(searchQ = null) {
  if (searchQ !== null) _catSearch = searchQ;
  const grid    = document.getElementById('cat-grid');
  const countEl = document.getElementById('cat-count');
  if (!grid) return;

  grid.innerHTML = `<div style="grid-column:1/-1;padding:60px;text-align:center;color:var(--text-muted)">
    <div style="font-size:32px;margin-bottom:8px;animation:loaderSlide 1s infinite">⏳</div>Cargando productos...
  </div>`;

  renderCatChips();

  let query = sb
    .from('productos')
    .select('*, producto_variantes(*), producto_imagenes(*)')
    .eq('activo', true);

  if (_catFilter) {
    const cat = APP.categorias.find(c => c.slug === _catFilter);
    if (cat) query = query.eq('categoria_id', cat.id);
  }
  if (_catSearch) {
    query = query.ilike('nombre', `%${_catSearch}%`);
  }

  const genero = document.getElementById('genero-select')?.value;
  if (genero) query = query.eq('genero', genero);

  const sort = document.getElementById('sort-select')?.value;
  if (sort === 'precio_asc')       query = query.order('precio', { ascending: true });
  else if (sort === 'precio_desc') query = query.order('precio', { ascending: false });
  else if (sort === 'nombre')      query = query.order('nombre');
  else                             query = query.order('fecha_creado', { ascending: false });

  const { data, error } = await query;
  if (error) {
    grid.innerHTML = `<div style="grid-column:1/-1;padding:60px;text-align:center;color:var(--red)">Error cargando productos.</div>`;
    return;
  }

  let productos = data || [];

  // ── Filtro por talla (client-side sobre variantes ya cargadas) ──
  // PostgREST no soporta filtrar por columnas de tablas relacionadas
  // directamente, así que filtramos después del fetch.
  if (_catTalla) {
    productos = productos.filter(p =>
      (p.producto_variantes || []).some(
        v => v.activo && v.stock > 0 && String(v.talla) === _catTalla
      )
    );
  }

  // Filtro por color (client-side)
  const colorFiltro = document.getElementById('color-select')?.value || '';
  if (colorFiltro) {
    productos = productos.filter(p =>
      (p.producto_variantes || []).some(
        v => v.activo && v.stock > 0 && v.color === colorFiltro
      )
    );
  }

  _catProducts = productos;

  // Actualizar selects y chips con datos completos (antes del filtro)
  fillCatSelect();
  fillColorSelect(data || []);
  renderTallaChips(data || []);

  // Mostrar/ocultar fila de tallas
  const tallaRow = document.getElementById('talla-row');
  if (tallaRow) {
    const hayTallas = (data || []).some(p =>
      (p.producto_variantes || []).some(v => v.activo && v.stock > 0)
    );
    tallaRow.style.display = hayTallas ? 'flex' : 'none';
  }

  if (countEl) countEl.textContent = `${_catProducts.length} producto${_catProducts.length !== 1 ? 's' : ''}`;

  if (!_catProducts.length) {
    grid.innerHTML = `<div class="empty-cat"><div class="e-icon">🔍</div><p>No encontramos productos con esos filtros.</p></div>`;
    return;
  }

  grid.innerHTML = _catProducts.map(p => productCardHTML(p)).join('');
}

// ─── CHIPS CATEGORÍAS ────────────────────────────────────────────────
function renderCatChips() {
  // Sincronizar el select visible de categoría con _catFilter
  const sel = document.getElementById('cat-select-drop');
  if (sel) sel.value = _catFilter || '';
}

// ─── CHIPS TALLAS ────────────────────────────────────────────────────
// Muestra las tallas disponibles extraídas de TODOS los productos
// en pantalla (antes del filtro de talla), ordenadas numéricamente.
function renderTallaChips(productos) {
  const el = document.getElementById('talla-chips');
  if (!el) return;

  // Recopilar tallas únicas con stock > 0
  const tallasSet = new Set();
  productos.forEach(p => {
    (p.producto_variantes || []).forEach(v => {
      if (v.activo && v.stock > 0) tallasSet.add(String(v.talla));
    });
  });

  if (!tallasSet.size) { el.innerHTML = ''; return; }

  // Ordenar: numéricas primero, luego texto (S, M, L, XL)
  const tallas = [...tallasSet].sort((a, b) => {
    const na = parseFloat(a), nb = parseFloat(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    if (!isNaN(na)) return -1;
    if (!isNaN(nb)) return 1;
    return a.localeCompare(b);
  });

  el.innerHTML = `
    <button class="chip-filter chip-talla ${!_catTalla ? 'active' : ''}" onclick="filterTalla('')">
      Todas las tallas
    </button>
    ${tallas.map(t => `
      <button class="chip-filter chip-talla ${_catTalla === t ? 'active' : ''}" onclick="filterTalla('${t}')">
        T${t}
      </button>
    `).join('')}
  `;
}

function filterCategoria(slug) {
  _catFilter = slug;
  renderCatalogo();
}

function filterTalla(talla) {
  _catTalla = talla;
  renderCatalogo();
}

// ─── PRODUCT CARD HTML ───────────────────────────────────────────────
function productCardHTML(p) {
  const variantes = p.producto_variantes || [];
  const imagenes  = p.producto_imagenes  || [];

  // Tallas únicas con stock disponible
  const tallas = [...new Set(
    variantes.filter(v => v.activo && v.stock > 0).map(v => v.talla)
  )].sort((a, b) => {
    const na = parseFloat(a), nb = parseFloat(b);
    return (!isNaN(na) && !isNaN(nb)) ? na - nb : String(a).localeCompare(String(b));
  });

  const totalStock = variantes.reduce((s, v) => s + Number(v.stock || 0), 0) || Number(p.stock || 0);
  const agotado = totalStock === 0;

  const precioFinal = p.precio_descuento && p.precio_descuento < p.precio ? p.precio_descuento : p.precio;
  const descuento = p.precio_descuento && p.precio_descuento < p.precio
    ? Math.round((1 - p.precio_descuento / p.precio) * 100) : 0;

  const isFav = (APP.favoritos || []).includes(p.id);

  // Colores únicos con hex para mostrar en tarjeta
  const coloresCard = [...new Map(
    variantes.filter(v => v.activo && v.color).map(v => [v.color, v])
  ).values()];

  // Si el usuario está filtrando por talla, resaltar esa talla en la tarjeta
  const tallaChipsHTML = tallas.slice(0, 6).map(t => {
    const esSeleccionada = _catTalla && String(t) === _catTalla;
    return `<span class="pc-chip${esSeleccionada ? ' pc-chip-active' : ''}">T${t}</span>`;
  }).join('') + (tallas.length > 6 ? `<span class="pc-chip">+${tallas.length - 6}</span>` : '');

  // Puntos de color para la tarjeta (máx 6, con +N si hay más)
  const colorDotsHTML = coloresCard.length > 0 ? `
    <div class="pc-colors">
      ${coloresCard.slice(0, 6).map(v => `
        <span class="pc-color-dot"
          title="${v.color}"
          style="background:${v.color_hex || '#888888'}"
        ></span>`).join('')}
      ${coloresCard.length > 6 ? `<span style="font-size:10px;color:var(--text-muted)">+${coloresCard.length - 6}</span>` : ''}
    </div>` : '';

  return `<div class="product-card" onclick="openProducto('${p.id}')">
    <div class="pc-img-wrap">
      <div class="pc-img-inner">${productImgHTML(imagenes)}</div>
      <div class="pc-zoom-overlay"><div class="pc-zoom-icon">🔍</div></div>
      <div class="pc-badges">
        ${p.destacado ? '<span class="pc-badge nuevo">Destacado</span>' : ''}
        ${p.es_nuevo ? '<span class="pc-badge nuevo" style="background:var(--gold);color:#000">Nuevo</span>' : ''}
        ${descuento > 0 ? `<span class="pc-badge descuento">-${descuento}%</span>` : ''}
        ${agotado ? '<span class="pc-badge agotado">Agotado</span>' : ''}
      </div>
      <button class="pc-fav ${isFav ? 'active' : ''}" onclick="toggleFav(event,'${p.id}')">${isFav ? '❤️' : '🤍'}</button>
      ${!agotado ? `<div class="pc-quick"><button onclick="quickAddCart(event,'${p.id}')">Elegir talla</button></div>` : ''}
    </div>
    <div class="pc-info">
      ${p.marca ? `<div class="pc-brand">${p.marca}</div>` : ''}
      <div class="pc-name">${p.nombre}</div>
      ${tallas.length ? `<div class="pc-chips">${tallaChipsHTML}</div>` : ''}
      ${colorDotsHTML}
      <div class="pc-price">
        <span class="pc-price-main">${fmtMoneyFull(precioFinal)}</span>
        ${descuento > 0 ? `<span class="pc-price-old">${fmtMoneyFull(p.precio)}</span>` : ''}
      </div>
    </div>
  </div>`;
}

// ─── DETALLE PRODUCTO ────────────────────────────────────────────────
let _currentProd     = null;
let _selectedVariante = null;
let _selectedColor   = null;
let _selectedTalla   = null;
let _cantidad        = 1;

async function openProducto(prodId) {
  showSection('producto');
  const content = document.getElementById('prod-detail-content');
  content.innerHTML = `<div style="grid-column:1/-1;padding:60px;text-align:center;color:var(--text-muted)">⏳ Cargando...</div>`;

  const { data: p } = await sb
    .from('productos')
    .select('*, producto_variantes(*), producto_imagenes(*)')
    .eq('id', prodId)
    .single();

  if (!p) { content.innerHTML = `<div style="padding:40px;color:var(--red)">Producto no encontrado.</div>`; return; }

  _currentProd = p;
  _selectedColor = null;
  // Pre-seleccionar la talla del filtro activo si aplica
  const variantesActivas = (p.producto_variantes || []).filter(v => v.activo && v.stock > 0);
  _selectedTalla = _catTalla && variantesActivas.some(v => String(v.talla) === _catTalla)
    ? _catTalla : null;
  _cantidad = 1;

  const variantes = p.producto_variantes || [];
  const imagenes  = p.producto_imagenes  || [];

  const colores  = [...new Map(variantes.filter(v => v.color).map(v => [v.color, v])).values()];
  const getTallas = (color = null) => variantes.filter(v => v.activo && (!color || v.color === color));

  const precioFinal = p.precio_descuento && p.precio_descuento < p.precio ? p.precio_descuento : p.precio;
  const descuento = p.precio_descuento && p.precio_descuento < p.precio
    ? Math.round((1 - p.precio_descuento / p.precio) * 100) : 0;

  const imgList = imagenes.sort((a, b) => (b.es_principal ? 1 : 0) - (a.es_principal ? 1 : 0));
  const mainImg = imgList[0];

  const isFav = (APP.favoritos || []).includes(p.id);

  // ¿El producto tiene colores definidos?
  const tieneColores = colores.length >= 1;
  // Si solo hay un color único, auto-seleccionarlo
  if (tieneColores && colores.length === 1) {
    _selectedColor = colores[0].color;
  }
  // Si ya hay talla pre-seleccionada (viene del filtro), resetear cantidad
  _cantidad = 1;

  content.innerHTML = `
    <div class="prod-gallery">
      <!-- Imagen principal con lupa -->
      <div class="gallery-main" id="gallery-main" onclick="openZoom('${mainImg?.url || ''}')">
        ${mainImg?.url
          ? `<img src="${mainImg.url}" alt="${p.nombre}" id="gallery-main-img" />`
          : '<span style="font-size:140px">👟</span>'}
        <div class="gallery-zoom-hint" id="gallery-zoom-hint">
          <span>🔍</span>
        </div>
      </div>
      ${imgList.length > 1 ? `
        <div class="gallery-thumbs">
          ${imgList.map((img, i) => `
            <div class="gallery-thumb ${i === 0 ? 'active' : ''}"
              onclick="setGalleryImg('${img.url}',${i})">
              <img src="${img.url}" alt="" />
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>

    <div class="prod-info-side">
      <div class="prod-badge-row">
        ${p.destacado ? '<span class="prod-badge" style="background:var(--gold-bg);color:var(--gold);border:1px solid rgba(201,168,76,0.3)">★ Destacado</span>' : ''}
        ${descuento > 0 ? `<span class="prod-badge" style="background:rgba(229,62,62,0.1);color:var(--red);border:1px solid rgba(229,62,62,0.2)">-${descuento}% OFF</span>` : ''}
      </div>
      ${p.marca ? `<div class="prod-brand">${p.marca}</div>` : ''}
      <h1 class="prod-name">${p.nombre}</h1>
      ${p.ref ? `<div class="prod-ref">REF: ${p.ref}</div>` : ''}

      <div class="prod-price-block">
        <span class="prod-price">${fmtMoneyFull(precioFinal)}</span>
        ${descuento > 0 ? `<span class="prod-price-old">${fmtMoneyFull(p.precio)}</span>` : ''}
        ${descuento > 0 ? `<span class="prod-price-save">Ahorras ${fmtMoneyFull(p.precio - precioFinal)}</span>` : ''}
      </div>

      ${p.descripcion ? `<p class="prod-desc">${p.descripcion}</p>` : ''}

      <!-- ── PASO 1: Color ────────────────────────── -->
      ${tieneColores ? `
        <div class="selector-step ${!_selectedColor ? 'step-active' : 'step-done'}" id="step-color">
          <div class="select-label">
            <span class="step-num">1</span> Color
            <span id="color-label" class="step-val">${_selectedColor || ''}</span>
            ${_selectedColor ? `<span class="step-check">✓</span>` : '<span class="step-hint">← elige primero</span>'}
          </div>
          <div class="color-selector" id="color-selector">
            ${colores.map(v => `
              <div class="color-option ${_selectedColor === v.color ? 'active' : ''}"
                style="background:${v.color_hex || '#888'}"
                onclick="selectColor('${v.color}')"
                title="${v.color}">
                <div class="color-tooltip">${v.color}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- ── PASO 2: Talla (aparece tras elegir color) ── -->
      <div class="selector-step ${_selectedColor || !tieneColores ? '' : 'step-locked'}" id="step-talla">
        <div class="select-label">
          <span class="step-num">${tieneColores ? '2' : '1'}</span> Talla
          <span id="talla-label" class="step-val">${_selectedTalla ? _selectedTalla : ''}</span>
          ${_selectedTalla ? `<span class="step-check">✓</span>` : (!_selectedColor && tieneColores ? '<span class="step-hint">← elige color primero</span>' : '')}
        </div>
        <div class="size-selector" id="size-selector">
          ${(_selectedColor || !tieneColores)
            ? renderTallasHTML(getTallas(_selectedColor))
            : '<span style="font-size:12px;color:var(--text-dim)">Elige un color para ver las tallas disponibles.</span>'}
        </div>
      </div>

      <!-- ── PASO 3: Cantidad (aparece tras elegir talla) ── -->
      <div class="selector-step ${_selectedTalla ? '' : 'step-locked'}" id="step-cantidad">
        <div class="select-label">
          <span class="step-num">${tieneColores ? '3' : '2'}</span> Cantidad
          ${_selectedTalla ? `<span class="step-val" style="font-size:11px;color:var(--text-dim)">máx. <span id="stock-max-label"></span></span>` : ''}
        </div>
        <div class="qty-selector">
          <button class="qty-btn" onclick="changeQty(-1)">−</button>
          <div class="qty-val" id="qty-val">${_cantidad}</div>
          <button class="qty-btn" onclick="changeQty(1)">+</button>
        </div>
      </div>

      <button class="add-cart-btn" id="add-cart-btn" onclick="addToCart()">
        🛒 Agregar al carrito
      </button>

      <div class="prod-actions-row">
        <button class="btn btn-outline" style="flex:1" onclick="toggleFavProd('${p.id}')">
          ${isFav ? '❤️ En favoritos' : '🤍 Guardar'}
        </button>
        <button class="btn btn-outline" style="flex:1" onclick="shareProd('${p.nombre}')">
          📤 Compartir
        </button>
      </div>

      <div style="margin-top:20px;padding:14px 16px;background:var(--surface);border-radius:var(--radius);border:1px solid var(--border)">
        <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;color:var(--text-muted)">
          <div>🚚 Envío a todo Colombia · 2-5 días hábiles</div>
          <div>🏪 Recoge en tienda · Medellín · 1-2 días hábiles</div>
          <div>↩️ Cambios y devoluciones en 7 días</div>
          <div>🔒 Pago 100% seguro</div>
        </div>
      </div>
    </div>
  `;

  updateAddCartBtn();
  // Si ya hay color auto-seleccionado, mostrar tallas
  if (_selectedColor) {
    const varsFiltradas = (p.producto_variantes || []).filter(v => v.activo && v.color === _selectedColor);
    document.getElementById('size-selector').innerHTML = renderTallasHTML(varsFiltradas);
  }
}

// ─── VIEWER INMERSIVO tipo Adidas/Nike ───────────────────────────────
// Muestra todas las imágenes del producto en un lightbox de pantalla
// completa con navegación ← → y swipe en móvil.

let _zoomImgs = [];
let _zoomIdx  = 0;

function openZoom(clickedUrl) {
  if (!_currentProd) return;

  // Construir lista de imágenes desde el producto actual
  const imgs = (_currentProd.producto_imagenes || [])
    .slice()
    .sort((a, b) => (b.es_principal ? 1 : 0) - (a.es_principal ? 1 : 0));

  _zoomImgs = imgs.map(i => i.url).filter(Boolean);

  // Si no hay imágenes en BD, usar la URL que se pasó
  if (!_zoomImgs.length && clickedUrl) _zoomImgs = [clickedUrl];
  if (!_zoomImgs.length) return;

  // Índice de la imagen clickeada
  _zoomIdx = Math.max(0, _zoomImgs.indexOf(clickedUrl));

  _renderZoomViewer();
}

function _renderZoomViewer() {
  // Eliminar viewer anterior si existe
  document.getElementById('zoom-viewer')?.remove();

  const total = _zoomImgs.length;
  const url   = _zoomImgs[_zoomIdx];

  const viewer = document.createElement('div');
  viewer.id = 'zoom-viewer';
  viewer.innerHTML = `
    <!-- Overlay oscuro -->
    <div id="zoom-backdrop" style="
      position:fixed;inset:0;background:rgba(0,0,0,0.96);z-index:9998;
      opacity:0;transition:opacity 0.25s ease;pointer-events:none">
    </div>

    <!-- Viewer principal -->
    <div style="
      position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;
      align-items:center;justify-content:center;overflow:hidden" id="zoom-inner">

      <!-- Botón cerrar -->
      <button onclick="closeZoom()" style="
        position:absolute;top:16px;right:16px;
        width:40px;height:40px;border-radius:50%;border:none;
        background:rgba(255,255,255,0.12);color:#fff;font-size:20px;
        cursor:pointer;z-index:10;display:flex;align-items:center;justify-content:center;
        backdrop-filter:blur(4px);transition:background 0.15s">×</button>

      <!-- Contador -->
      ${total > 1 ? `<div style="
        position:absolute;top:20px;left:50%;transform:translateX(-50%);
        font-size:12px;color:rgba(255,255,255,0.5);letter-spacing:2px;z-index:10">
        ${_zoomIdx + 1} / ${total}
      </div>` : ''}

      <!-- Imagen principal -->
      <div id="zoom-img-wrap" style="
        flex:1;display:flex;align-items:center;justify-content:center;
        width:100%;padding:60px 80px;box-sizing:border-box;cursor:zoom-out"
        onclick="closeZoom()">
        <img id="zoom-main-img" src="${url}" style="
          max-width:100%;max-height:80vh;object-fit:contain;
          border-radius:4px;display:block;
          transition:opacity 0.2s ease;user-select:none;
          box-shadow:0 4px 40px rgba(0,0,0,0.4)" draggable="false">
      </div>

      <!-- Flechas nav (solo si hay más de 1 imagen) -->
      ${total > 1 ? `
        <button onclick="event.stopPropagation();zoomNav(-1)" style="
          position:absolute;left:12px;top:50%;transform:translateY(-50%);
          width:44px;height:44px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.2);
          background:rgba(255,255,255,0.08);color:#fff;font-size:20px;
          cursor:pointer;z-index:10;display:flex;align-items:center;justify-content:center;
          backdrop-filter:blur(4px);transition:background 0.15s"
          onmouseover="this.style.background='rgba(255,255,255,0.18)'"
          onmouseout="this.style.background='rgba(255,255,255,0.08)'">‹</button>

        <button onclick="event.stopPropagation();zoomNav(1)" style="
          position:absolute;right:12px;top:50%;transform:translateY(-50%);
          width:44px;height:44px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.2);
          background:rgba(255,255,255,0.08);color:#fff;font-size:20px;
          cursor:pointer;z-index:10;display:flex;align-items:center;justify-content:center;
          backdrop-filter:blur(4px);transition:background 0.15s"
          onmouseover="this.style.background='rgba(255,255,255,0.18)'"
          onmouseout="this.style.background='rgba(255,255,255,0.08)'">›</button>
      ` : ''}

      <!-- Miniaturas inferiores -->
      ${total > 1 ? `
        <div id="zoom-thumbs" style="
          display:flex;gap:8px;padding:12px 20px;overflow-x:auto;
          scrollbar-width:none;max-width:100%;flex-shrink:0"
          onclick="event.stopPropagation()">
          ${_zoomImgs.map((img, i) => `
            <img src="${img}" onclick="zoomGoTo(${i})" style="
              width:60px;height:60px;object-fit:cover;border-radius:6px;
              cursor:pointer;opacity:${i === _zoomIdx ? '1' : '0.45'};
              border:2px solid ${i === _zoomIdx ? '#c9a84c' : 'transparent'};
              transition:all 0.18s ease;flex-shrink:0"
              id="zoom-thumb-${i}">
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;

  document.body.appendChild(viewer);
  document.body.style.overflow = 'hidden';

  // Fade in backdrop
  requestAnimationFrame(() => {
    document.getElementById('zoom-backdrop').style.opacity = '1';
  });

  // Swipe en móvil
  let touchStartX = 0;
  viewer.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  viewer.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) zoomNav(dx < 0 ? 1 : -1);
  });

  // Teclado
  document.addEventListener('keydown', _zoomKeyHandler);
}

function zoomNav(delta) {
  const total = _zoomImgs.length;
  if (total <= 1) return;
  _zoomIdx = (_zoomIdx + delta + total) % total;
  // Cambiar imagen con fade
  const img = document.getElementById('zoom-main-img');
  if (img) {
    img.style.opacity = '0';
    setTimeout(() => {
      img.src = _zoomImgs[_zoomIdx];
      img.style.opacity = '1';
    }, 180);
  }
  // Actualizar miniaturas
  document.querySelectorAll('[id^="zoom-thumb-"]').forEach((el, i) => {
    el.style.opacity = i === _zoomIdx ? '1' : '0.45';
    el.style.borderColor = i === _zoomIdx ? '#c9a84c' : 'transparent';
  });
  // Actualizar contador
  const counter = document.querySelector('#zoom-viewer [style*="letter-spacing:2px"]');
  if (counter) counter.textContent = `${_zoomIdx + 1} / ${_zoomImgs.length}`;
}

function zoomGoTo(idx) {
  _zoomIdx = idx;
  zoomNav(0);
}

function closeZoom() {
  const viewer = document.getElementById('zoom-viewer');
  if (!viewer) return;
  document.getElementById('zoom-backdrop').style.opacity = '0';
  setTimeout(() => {
    viewer.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', _zoomKeyHandler);
  }, 220);
}

function _zoomKeyHandler(e) {
  if (e.key === 'Escape')      closeZoom();
  if (e.key === 'ArrowRight')  zoomNav(1);
  if (e.key === 'ArrowLeft')   zoomNav(-1);
}

function renderTallasHTML(variantes) {
  if (!variantes.length) return '<span style="font-size:13px;color:var(--text-muted)">Sin tallas disponibles</span>';
  const tallasMap = {};
  variantes.forEach(v => {
    if (!tallasMap[v.talla]) tallasMap[v.talla] = 0;
    tallasMap[v.talla] += Number(v.stock || 0);
  });
  // Ordenar tallas numéricamente
  const sorted = Object.entries(tallasMap).sort(([a], [b]) => {
    const na = parseFloat(a), nb = parseFloat(b);
    return (!isNaN(na) && !isNaN(nb)) ? na - nb : a.localeCompare(b);
  });
  return sorted.map(([talla, stock]) => `
    <button class="size-option ${stock === 0 ? 'agotado' : ''} ${_selectedTalla === String(talla) ? 'active' : ''}"
      onclick="${stock > 0 ? `selectTalla('${talla}')` : ''}"
      ${stock === 0 ? 'disabled title="Agotado"' : ''}>
      ${talla}
    </button>
  `).join('');
}

function setGalleryImg(url, idx) {
  // Cambiar imagen principal en galería
  const mainImg = document.getElementById('gallery-main-img');
  if (mainImg) {
    mainImg.style.opacity = '0';
    setTimeout(() => { mainImg.src = url; mainImg.style.opacity = '1'; }, 150);
  }
  // Actualizar miniatura activa
  document.querySelectorAll('.gallery-thumb').forEach((t, i) => t.classList.toggle('active', i === idx));
  // El click en la imagen principal abrirá el viewer desde esa posición
  const mainEl = document.getElementById('gallery-main');
  if (mainEl) mainEl.onclick = () => openZoom(url);
}

function selectColor(color) {
  _selectedColor = color;
  _selectedTalla = null;
  _cantidad = 1;

  // Actualizar label y dots
  const labelEl = document.getElementById('color-label');
  if (labelEl) labelEl.textContent = color;
  document.querySelectorAll('.color-option').forEach(el => {
    el.classList.toggle('active', el.title === color);
  });

  // Pasos visuales
  const stepColor  = document.getElementById('step-color');
  const stepTalla  = document.getElementById('step-talla');
  const stepCant   = document.getElementById('step-cantidad');
  if (stepColor) { stepColor.classList.remove('step-active'); stepColor.classList.add('step-done'); }
  if (stepTalla) { stepTalla.classList.remove('step-locked'); }
  if (stepCant)  { stepCant.classList.add('step-locked'); }

  // Mostrar tallas de este color
  const variantes = (_currentProd.producto_variantes || []).filter(v => v.activo && v.color === color);
  const sizeEl = document.getElementById('size-selector');
  if (sizeEl) sizeEl.innerHTML = renderTallasHTML(variantes);

  // Actualizar hint en step-talla
  const tallaLabel = document.getElementById('talla-label');
  if (tallaLabel) tallaLabel.textContent = '';
  const stepHint = stepTalla?.querySelector('.step-hint');
  if (stepHint) stepHint.remove();

  // Cambiar imagen si hay imagen vinculada a este color
  if (_currentProd.producto_imagenes) {
    const imgColor = _currentProd.producto_imagenes.find(i => i.color_ref === color);
    if (imgColor?.url) {
      const mainEl = document.getElementById('gallery-main-img');
      if (mainEl) mainEl.src = imgColor.url;
    }
  }

  updateAddCartBtn();
}

function selectTalla(talla) {
  _selectedTalla = talla;
  _cantidad = 1;

  const tallaLabel = document.getElementById('talla-label');
  if (tallaLabel) tallaLabel.textContent = talla;

  document.querySelectorAll('.size-option').forEach(el => {
    el.classList.toggle('active', el.textContent.trim() === String(talla));
  });

  // Mostrar paso de cantidad
  const stepCant = document.getElementById('step-cantidad');
  if (stepCant) stepCant.classList.remove('step-locked');

  // Mostrar stock máximo
  const variantes = _currentProd?.producto_variantes || [];
  const v = variantes.find(v =>
    String(v.talla) === String(talla) &&
    (!_selectedColor || v.color === _selectedColor) &&
    v.activo
  );
  const maxEl = document.getElementById('stock-max-label');
  if (maxEl && v) maxEl.textContent = `${v.stock} par${v.stock !== 1 ? 'es' : ''}`;

  // Reset cantidad a 1
  const qtyEl = document.getElementById('qty-val');
  if (qtyEl) qtyEl.textContent = '1';

  updateAddCartBtn();
}

function changeQty(delta) {
  // Calcular stock máximo de la variante seleccionada
  let stockMax = 10;
  if (_currentProd && _selectedTalla) {
    const variantes = _currentProd.producto_variantes || [];
    const v = variantes.find(v =>
      v.talla === _selectedTalla &&
      (!_selectedColor || v.color === _selectedColor) &&
      v.activo
    );
    if (v) stockMax = Math.max(1, Number(v.stock || 1));
  }

  const nuevo = _cantidad + delta;
  if (nuevo < 1) return;
  if (nuevo > stockMax) {
    toast(`Solo hay ${stockMax} par${stockMax > 1 ? 'es' : ''} disponibles`, 'error');
    return;
  }
  _cantidad = nuevo;
  const el = document.getElementById('qty-val');
  if (el) el.textContent = _cantidad;
}

function updateAddCartBtn() {
  const btn = document.getElementById('add-cart-btn');
  if (!btn) return;
  const variantes    = _currentProd?.producto_variantes || [];
  const tieneColores = [...new Set(variantes.filter(v=>v.color).map(v=>v.color))].length > 0;

  if (variantes.length === 0) {
    btn.disabled    = false;
    btn.textContent = '🛒 Agregar al carrito';
  } else if (tieneColores && !_selectedColor) {
    btn.disabled    = true;
    btn.textContent = 'Selecciona un color';
  } else if (!_selectedTalla) {
    btn.disabled    = true;
    btn.textContent = 'Selecciona una talla';
  } else {
    btn.disabled    = false;
    btn.textContent = '🛒 Agregar al carrito';
  }
}

async function addToCart() {
  if (!_currentProd) return;
  const variantes = _currentProd.producto_variantes || [];

  let variante = null;
  if (variantes.length > 0) {
    variante = variantes.find(v =>
      v.talla === _selectedTalla &&
      (!_selectedColor || v.color === _selectedColor) &&
      v.activo
    );
    if (!variante) { toast('Selecciona talla y color', 'error'); return; }
    if (variante.stock < _cantidad) {
      toast(`Solo quedan ${variante.stock} par${variante.stock > 1 ? 'es' : ''} disponibles.`, 'error');
      return;
    }
  }

  const precioFinal = _currentProd.precio_descuento && _currentProd.precio_descuento < _currentProd.precio
    ? _currentProd.precio_descuento : _currentProd.precio;

  await addItemToCart({
    variante_id:     variante?.id || null,
    producto_id:     _currentProd.id,
    producto_nombre: _currentProd.nombre,
    talla:           _selectedTalla || variante?.talla,
    color:           _selectedColor || variante?.color,
    precio_unitario: Number(precioFinal) + Number(variante?.precio_extra || 0),
    cantidad:        _cantidad,
    imagen:          _currentProd.producto_imagenes?.find(i => i.es_principal)?.url,
  });

  const btn = document.getElementById('add-cart-btn');
  if (btn) { btn.classList.add('added'); setTimeout(() => btn.classList.remove('added'), 500); }
}

// Quick add desde grid → abre el detalle para elegir talla
function quickAddCart(e, prodId) {
  e.stopPropagation();
  openProducto(prodId);
}

// ─── FAVORITOS ───────────────────────────────────────────────────────
async function toggleFav(e, prodId) {
  e.stopPropagation();
  toggleFavProd(prodId);
  const isFav = (APP.favoritos || []).includes(prodId);
  e.currentTarget.textContent = isFav ? '❤️' : '🤍';
  e.currentTarget.classList.toggle('active', isFav);
}

function toggleFavProd(prodId) {
  if (!APP.favoritos) APP.favoritos = [];
  const isFav = APP.favoritos.includes(prodId);
  if (isFav) {
    APP.favoritos = APP.favoritos.filter(id => id !== prodId);
    toast('Eliminado de favoritos');
  } else {
    APP.favoritos.push(prodId);
    toast('❤️ Guardado en favoritos', 'success');
  }
  try { localStorage.setItem('ricwer_favs', JSON.stringify(APP.favoritos)); } catch(_) {}
}

function shareProd(nombre) {
  if (navigator.share) {
    navigator.share({ title: `RICWER - ${nombre}`, url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href);
    toast('Enlace copiado al portapapeles', 'success');
  }
}

function loadFavoritos() {
  try { APP.favoritos = JSON.parse(localStorage.getItem('ricwer_favs') || '[]'); }
  catch(_) { APP.favoritos = []; }
}
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

  _catProducts = productos;

  // Construir chips de tallas con los datos COMPLETOS (antes del filtro)
  // para que el usuario siempre vea todas las tallas disponibles.
  renderTallaChips(data || []);

  if (countEl) countEl.textContent = `${_catProducts.length} producto${_catProducts.length !== 1 ? 's' : ''}`;

  if (!_catProducts.length) {
    grid.innerHTML = `<div class="empty-cat"><div class="e-icon">🔍</div><p>No encontramos productos con esos filtros.</p></div>`;
    return;
  }

  grid.innerHTML = _catProducts.map(p => productCardHTML(p)).join('');
}

// ─── CHIPS CATEGORÍAS ────────────────────────────────────────────────
function renderCatChips() {
  const el = document.getElementById('cat-chips');
  if (!el || !APP.categorias) return;
  el.innerHTML = `
    <button class="chip-filter ${!_catFilter ? 'active' : ''}" onclick="filterCategoria('')">Todos</button>
    ${APP.categorias.map(c => `
      <button class="chip-filter ${_catFilter === c.slug ? 'active' : ''}" onclick="filterCategoria('${c.slug}')">
        ${c.icono || ''} ${c.nombre}
      </button>
    `).join('')}
  `;
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

  content.innerHTML = `
    <div class="prod-gallery">
      <div class="gallery-main" id="gallery-main">
        ${mainImg?.url ? `<img src="${mainImg.url}" alt="${p.nombre}" />` : '<span style="font-size:140px">👟</span>'}
      </div>
      ${imgList.length > 1 ? `
        <div class="gallery-thumbs">
          ${imgList.map((img, i) => `
            <div class="gallery-thumb ${i === 0 ? 'active' : ''}" onclick="setGalleryImg('${img.url}',${i})">
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

      ${colores.length >= 1 ? `
        <div>
          <div class="select-label">Color <span id="color-label">${_selectedColor || 'Selecciona'}</span></div>
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

      <div>
        <div class="select-label">
          Talla
          <span id="talla-label">${_selectedTalla ? 'Talla ' + _selectedTalla : 'Selecciona una talla'}</span>
        </div>
        <div class="size-selector" id="size-selector">
          ${renderTallasHTML(getTallas())}
        </div>
        <div style="margin-top:8px;font-size:11px;color:var(--text-dim)">
          Solo se muestran tallas con stock disponible.
        </div>
      </div>

      <div>
        <div class="select-label">Cantidad</div>
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

      ${p.notas ? `
        <div style="margin-top:20px;padding:16px;background:var(--surface2);border-radius:var(--radius);border:1px solid var(--border);font-size:12px;color:var(--text-muted)">
          📝 ${p.notas}
        </div>
      ` : ''}

      <div style="margin-top:24px;padding:16px;background:var(--surface);border-radius:var(--radius);border:1px solid var(--border)">
        <div style="display:flex;flex-direction:column;gap:10px;font-size:12px;color:var(--text-muted)">
          <div>🚚 Envío a todo Colombia · 2-5 días hábiles</div>
          <div>🏪 Recoge en tienda · Medellín · 1-2 días hábiles</div>
          <div>↩️ Cambios y devoluciones en 7 días</div>
          <div>🔒 Pago 100% seguro</div>
        </div>
      </div>
    </div>
  `;

  updateAddCartBtn();
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
    <button class="size-option ${stock === 0 ? 'agotado' : ''} ${_selectedTalla === talla ? 'active' : ''}"
      onclick="${stock > 0 ? `selectTalla('${talla}')` : ''}"
      ${stock === 0 ? 'disabled title="Agotado"' : ''}>
      ${talla}
      ${stock > 0 && stock <= 3 ? `<span style="display:block;font-size:9px;color:var(--accent);line-height:1">¡${stock} par${stock > 1 ? 'es' : ''}!</span>` : ''}
    </button>
  `).join('');
}

function setGalleryImg(url, idx) {
  document.getElementById('gallery-main').innerHTML = `<img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover" />`;
  document.querySelectorAll('.gallery-thumb').forEach((t, i) => t.classList.toggle('active', i === idx));
}

function selectColor(color) {
  _selectedColor = color;
  _selectedTalla = null;
  document.getElementById('color-label').textContent = color;
  document.querySelectorAll('.color-option').forEach(el => {
    el.classList.toggle('active', el.title === color);
  });
  const variantes = _currentProd.producto_variantes.filter(v => v.activo && v.color === color);
  document.getElementById('size-selector').innerHTML = renderTallasHTML(variantes);
  updateAddCartBtn();
}

function selectTalla(talla) {
  _selectedTalla = talla;
  document.getElementById('talla-label').textContent = `Talla ${talla}`;
  document.querySelectorAll('.size-option').forEach(el => {
    el.classList.toggle('active', el.textContent.trim().startsWith(talla));
  });
  updateAddCartBtn();
}

function changeQty(delta) {
  _cantidad = Math.max(1, Math.min(10, _cantidad + delta));
  const el = document.getElementById('qty-val');
  if (el) el.textContent = _cantidad;
}

function updateAddCartBtn() {
  const btn = document.getElementById('add-cart-btn');
  if (!btn) return;
  const variantes  = _currentProd?.producto_variantes || [];
  const listo = variantes.length === 0 || !!_selectedTalla;
  btn.disabled    = !listo;
  btn.textContent = !listo ? 'Selecciona una talla' : '🛒 Agregar al carrito';
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
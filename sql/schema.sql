-- =====================================================
-- RICWER — Schema FINAL v2.2 (ordenado y estable)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── PERFILES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rol TEXT NOT NULL DEFAULT 'cliente' CHECK (rol IN ('admin', 'cliente')),
  nombre TEXT,
  apellido TEXT,
  telefono TEXT,
  avatar_url TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FUNCIÓN ADMIN (DESPUÉS de profiles) ──────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND rol = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ─── FUNCIÓN UPDATED_AT ───────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── TRIGGER profiles ─────────────────────────────────
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── DIRECCIONES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.direcciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  alias TEXT DEFAULT 'Casa',
  destinatario TEXT,
  direccion TEXT NOT NULL,
  ciudad TEXT NOT NULL DEFAULT 'Medellín',
  departamento TEXT NOT NULL DEFAULT 'Antioquia',
  codigo_postal TEXT,
  telefono TEXT,
  es_principal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS one_main_address_per_user
ON public.direcciones(user_id)
WHERE es_principal = TRUE;

-- ─── CATEGORÍAS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icono TEXT,
  descripcion TEXT,
  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT TRUE
);

-- ─── PRODUCTOS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE,
  descripcion TEXT,
  ref TEXT,
  marca TEXT,
  categoria_id UUID,
  categoria TEXT DEFAULT 'Tenis',
  genero TEXT DEFAULT 'Unisex' CHECK (genero IN ('Hombre','Mujer','Niño','Niña','Unisex')),
  costo NUMERIC DEFAULT 0,
  precio NUMERIC DEFAULT 0,
  precio_descuento NUMERIC,
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  stockmin INTEGER DEFAULT 2,
  activo BOOLEAN DEFAULT TRUE,
  destacado BOOLEAN DEFAULT FALSE,
  notas TEXT,
  fecha_creado DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columna si vienes de versión vieja
ALTER TABLE public.productos
ADD COLUMN IF NOT EXISTS categoria_id UUID;

-- FK (se agrega después por compatibilidad)
ALTER TABLE public.productos
DROP CONSTRAINT IF EXISTS productos_categoria_id_fkey;

ALTER TABLE public.productos
ADD CONSTRAINT productos_categoria_id_fkey
FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE SET NULL;

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_productos_updated_at ON public.productos;
CREATE TRIGGER update_productos_updated_at
BEFORE UPDATE ON public.productos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_productos_categoria_id 
ON public.productos(categoria_id);

-- ─── VARIANTES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.producto_variantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  talla TEXT NOT NULL,
  color TEXT,
  color_hex TEXT,
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  sku TEXT UNIQUE,
  precio_extra NUMERIC DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE
);

-- ─── IMÁGENES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.producto_imagenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  orden INTEGER DEFAULT 0,
  es_principal BOOLEAN DEFAULT FALSE
);

-- ─── CARRITO ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.carrito (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  variante_id UUID NOT NULL REFERENCES public.producto_variantes(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, variante_id)
);

DROP TRIGGER IF EXISTS update_carrito_updated_at ON public.carrito;
CREATE TRIGGER update_carrito_updated_at
BEFORE UPDATE ON public.carrito
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── SECUENCIA ÓRDENES ────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS orden_seq;

-- ─── ÓRDENES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ordenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_orden TEXT UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  estado TEXT DEFAULT 'pendiente',
  tipo_entrega TEXT DEFAULT 'recogida',
  direccion_id UUID,
  direccion_texto TEXT,
  subtotal NUMERIC DEFAULT 0,
  descuento NUMERIC DEFAULT 0,
  costo_envio NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  metodo_pago TEXT,
  estado_pago TEXT DEFAULT 'pendiente',
  referencia_pago TEXT,
  notas_cliente TEXT,
  notas_admin TEXT,
  fecha DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_ordenes_updated_at ON public.ordenes;
CREATE TRIGGER update_ordenes_updated_at
BEFORE UPDATE ON public.ordenes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generador seguro
CREATE OR REPLACE FUNCTION public.generar_numero_orden()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero_orden := 'RW-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('orden_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_insert_orden ON public.ordenes;
CREATE TRIGGER before_insert_orden
BEFORE INSERT ON public.ordenes
FOR EACH ROW EXECUTE FUNCTION public.generar_numero_orden();

-- ─── ITEMS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orden_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL REFERENCES public.ordenes(id) ON DELETE CASCADE,
  producto_nombre TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL
);

-- ─── PEDIDOS Y ARREGLOS ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS public.arreglos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- ─── ABONOS (FIX REAL) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.abonos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE,
  arreglo_id UUID REFERENCES public.arreglos(id) ON DELETE CASCADE,
  monto NUMERIC DEFAULT 0,
  pago TEXT,
  nota TEXT,
  fecha DATE DEFAULT CURRENT_DATE,
  CHECK (
    (pedido_id IS NOT NULL AND arreglo_id IS NULL) OR
    (pedido_id IS NULL AND arreglo_id IS NOT NULL)
  )
);

-- =====================================================
-- RICWER — Schema PATCH v2.3 FIXED
-- =====================================================

-- ─── 1. PEDIDOS (FIX desc → descripcion) ──────────────
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS cliente TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tel TEXT,
  ADD COLUMN IF NOT EXISTS descripcion TEXT,
  ADD COLUMN IF NOT EXISTS anticipo NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pago_anticipo TEXT,
  ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS entrega DATE,
  ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'Pendiente',
  ADD COLUMN IF NOT EXISTS notas TEXT,
  ADD COLUMN IF NOT EXISTS fecha DATE DEFAULT CURRENT_DATE;

-- Si existía columna "desc", renombrarla
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='pedidos' AND column_name='desc'
  ) THEN
    ALTER TABLE public.pedidos RENAME COLUMN "desc" TO descripcion;
  END IF;
END $$;

-- ─── 2. ARREGLOS (FIX desc → descripcion) ─────────────
ALTER TABLE public.arreglos
  ADD COLUMN IF NOT EXISTS cliente TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tel TEXT,
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'Media suela',
  ADD COLUMN IF NOT EXISTS descripcion TEXT,
  ADD COLUMN IF NOT EXISTS costo NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS anticipo NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pago_anticipo TEXT,
  ADD COLUMN IF NOT EXISTS entrega DATE,
  ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'Recibido',
  ADD COLUMN IF NOT EXISTS fecha DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0;

-- Renombrar si existía
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='arreglos' AND column_name='desc'
  ) THEN
    ALTER TABLE public.arreglos RENAME COLUMN "desc" TO descripcion;
  END IF;
END $$;

-- ─── 3. ORDEN ITEMS (columnas faltantes) ──────────────
ALTER TABLE public.orden_items
  ADD COLUMN IF NOT EXISTS producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS variante_id UUID REFERENCES public.producto_variantes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS talla TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT;

-- ─── 4. VENTAS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente TEXT,
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  producto_nombre TEXT,
  cantidad INTEGER DEFAULT 1,
  precio NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  pago TEXT,
  fecha DATE DEFAULT CURRENT_DATE,
  notas TEXT
);

-- ─── 5. MENSAJES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  nombre_visitante TEXT,
  email_visitante TEXT,
  tipo TEXT DEFAULT 'soporte',
  asunto TEXT NOT NULL,
  cuerpo TEXT NOT NULL,
  calificacion INTEGER CHECK (calificacion BETWEEN 1 AND 5),
  estado TEXT DEFAULT 'abierto',
  orden_id UUID REFERENCES public.ordenes(id) ON DELETE SET NULL,
  leido_admin BOOLEAN DEFAULT FALSE,
  leido_user BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. RESPUESTAS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mensaje_respuestas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensaje_id UUID REFERENCES public.mensajes(id) ON DELETE CASCADE,
  user_id UUID,
  es_admin BOOLEAN DEFAULT FALSE,
  cuerpo TEXT NOT NULL,
  leido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. NOTIFICACIONES ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  tipo TEXT,
  titulo TEXT,
  cuerpo TEXT,
  url TEXT,
  leida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 8. TRIGGER updated_at mensajes ───────────────────
DROP TRIGGER IF EXISTS update_mensajes_updated_at ON public.mensajes;

CREATE TRIGGER update_mensajes_updated_at
BEFORE UPDATE ON public.mensajes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 9. ÍNDICES ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mensajes_user ON public.mensajes(user_id);
CREATE INDEX IF NOT EXISTS idx_respuestas_msg ON public.mensaje_respuestas(mensaje_id);

-- ─── FIN PATCH FIXED ─────────────────────────────────
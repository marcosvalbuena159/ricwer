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

-- =====================================================
-- RICWER — RLS RESET COMPLETO (ejecutar completo)
-- Paso 1: borra TODAS las políticas existentes
-- Paso 2: las recrea limpias sin duplicados
-- =====================================================

-- ══════════════════════════════════════════════════════
-- PASO 1: ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- ══════════════════════════════════════════════════════

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ══════════════════════════════════════════════════════
-- PASO 2: HABILITAR RLS EN TODAS LAS TABLAS
-- ══════════════════════════════════════════════════════

ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direcciones         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_variantes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_imagenes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrito             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orden_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensaje_respuestas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arreglos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonos              ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════
-- PASO 3: RECREAR is_admin() LIMPIA
-- ══════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'admin'
  );
$$;

-- ══════════════════════════════════════════════════════
-- PASO 4: POLÍTICAS — UNA POR TABLA, SIN DUPLICADOS
-- ══════════════════════════════════════════════════════

-- ─── PROFILES ─────────────────────────────────────────
-- SELECT: propio o admin
CREATE POLICY "profiles_select"
ON public.profiles FOR SELECT
USING (id = auth.uid() OR public.is_admin());

-- INSERT: el propio user (al registrarse) o admin
CREATE POLICY "profiles_insert"
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid() OR public.is_admin());

-- UPDATE: el propio user o admin
CREATE POLICY "profiles_update"
ON public.profiles FOR UPDATE
USING (id = auth.uid() OR public.is_admin())
WITH CHECK (id = auth.uid() OR public.is_admin());

-- DELETE: solo admin
CREATE POLICY "profiles_delete"
ON public.profiles FOR DELETE
USING (public.is_admin());

-- ─── CATEGORÍAS (lectura libre, escritura admin) ───────
CREATE POLICY "categorias_select"
ON public.categorias FOR SELECT
USING (true);

CREATE POLICY "categorias_write"
ON public.categorias FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ─── PRODUCTOS (lectura libre, escritura admin) ────────
CREATE POLICY "productos_select"
ON public.productos FOR SELECT
USING (true);

CREATE POLICY "productos_write"
ON public.productos FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ─── VARIANTES (lectura libre, escritura admin) ────────
CREATE POLICY "variantes_select"
ON public.producto_variantes FOR SELECT
USING (true);

CREATE POLICY "variantes_write"
ON public.producto_variantes FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ─── IMÁGENES (lectura libre, escritura admin) ─────────
CREATE POLICY "imagenes_select"
ON public.producto_imagenes FOR SELECT
USING (true);

CREATE POLICY "imagenes_write"
ON public.producto_imagenes FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ─── CARRITO ───────────────────────────────────────────
CREATE POLICY "carrito_all"
ON public.carrito FOR ALL
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ─── DIRECCIONES ──────────────────────────────────────
CREATE POLICY "direcciones_all"
ON public.direcciones FOR ALL
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ─── ORDENES ──────────────────────────────────────────
CREATE POLICY "ordenes_select"
ON public.ordenes FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "ordenes_insert"
ON public.ordenes FOR INSERT
WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "ordenes_update"
ON public.ordenes FOR UPDATE
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "ordenes_delete"
ON public.ordenes FOR DELETE
USING (public.is_admin());

-- ─── ORDEN ITEMS ──────────────────────────────────────
CREATE POLICY "orden_items_select"
ON public.orden_items FOR SELECT
USING (
  public.is_admin() OR
  EXISTS (
    SELECT 1 FROM public.ordenes o
    WHERE o.id = orden_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "orden_items_write"
ON public.orden_items FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ─── NOTIFICACIONES ───────────────────────────────────
CREATE POLICY "notif_all"
ON public.notificaciones FOR ALL
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ─── MENSAJES ─────────────────────────────────────────
CREATE POLICY "mensajes_select"
ON public.mensajes FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "mensajes_insert"
ON public.mensajes FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (user_id = auth.uid() OR public.is_admin())
);

CREATE POLICY "mensajes_update"
ON public.mensajes FOR UPDATE
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ─── MENSAJE RESPUESTAS ───────────────────────────────
CREATE POLICY "respuestas_select"
ON public.mensaje_respuestas FOR SELECT
USING (
  public.is_admin() OR
  EXISTS (
    SELECT 1 FROM public.mensajes m
    WHERE m.id = mensaje_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "respuestas_insert"
ON public.mensaje_respuestas FOR INSERT
WITH CHECK (
  public.is_admin() OR
  EXISTS (
    SELECT 1 FROM public.mensajes m
    WHERE m.id = mensaje_id AND m.user_id = auth.uid()
  )
);

-- ─── VENTAS / PEDIDOS / ARREGLOS / ABONOS (solo admin) ─
CREATE POLICY "ventas_admin"
ON public.ventas FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "pedidos_admin"
ON public.pedidos FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "arreglos_admin"
ON public.arreglos FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "abonos_admin"
ON public.abonos FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ══════════════════════════════════════════════════════
-- PASO 5: TRIGGER PARA AUTO-CREAR PERFIL AL REGISTRARSE
-- Evita el error 406 cuando profiles no existe aún
-- ══════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, rol, nombre, apellido, telefono)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'rol', 'cliente'),
    COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    COALESCE(NEW.raw_user_meta_data->>'telefono', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ══════════════════════════════════════════════════════
-- PASO 6: CREAR PERFIL PARA USUARIOS EXISTENTES SIN PERFIL
-- Ejecuta esto una sola vez para reparar usuarios actuales
-- ══════════════════════════════════════════════════════

INSERT INTO public.profiles (id, rol, nombre, apellido)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'rol', 'cliente'),
  COALESCE(u.raw_user_meta_data->>'nombre', ''),
  COALESCE(u.raw_user_meta_data->>'apellido', '')
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- ══════════════════════════════════════════════════════
-- VERIFICACIÓN FINAL
-- ══════════════════════════════════════════════════════
-- Ejecuta estas consultas para confirmar:
--
-- 1. Ver todas las políticas creadas:
--    SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname='public' ORDER BY tablename;
--
-- 2. Verificar que todos los usuarios tienen perfil:
--    SELECT u.email, p.id IS NOT NULL as tiene_perfil, p.rol
--    FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id;
--
-- 3. Verificar que is_admin() funciona (como admin):
--    SELECT public.is_admin();  → debe retornar TRUE si eres admin
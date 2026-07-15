-- ============================================================
-- CLEANUP
-- ============================================================

DROP VIEW IF EXISTS inventory;

DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS purchase_items CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS movement_types CASCADE;

DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS movement_type CASCADE;

-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE movement_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(40) NOT NULL UNIQUE,

    name VARCHAR(100) NOT NULL,

    stock_multiplier SMALLINT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_stock_multiplier
        CHECK (stock_multiplier IN (-1, 1))
);

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(30) NOT NULL UNIQUE,

    name VARCHAR(100) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL UNIQUE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES
-- ============================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    parent_category_id UUID REFERENCES categories(id),

    name VARCHAR(100) NOT NULL,

    icon VARCHAR(100),

    color VARCHAR(20),

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(name)
);

-- ============================================================
-- UNITS
-- ============================================================

CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(50) NOT NULL,

    symbol VARCHAR(10) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(symbol)
);

-- ============================================================
-- STORES
-- ============================================================

CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(120) NOT NULL,

    address TEXT,

    city VARCHAR(100),

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(name)
);

-- ============================================================
-- PRODUCTS
-- ============================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    category_id UUID NOT NULL REFERENCES categories(id),

    unit_id UUID NOT NULL REFERENCES units(id),

    name VARCHAR(200) NOT NULL,

    brand_id UUID REFERENCES brands(id),

    presentation_quantity NUMERIC(10,2),

    barcode VARCHAR(100),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()

);

CREATE INDEX idx_products_category
ON products(category_id);

CREATE INDEX idx_products_name
ON products(name);


-- ============================================================
-- PURCHASES
-- ============================================================

CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    store_id UUID REFERENCES stores(id),

    purchase_date DATE NOT NULL,

    payment_method_id UUID REFERENCES payment_methods(id),

    total NUMERIC(12,2),

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchase_date
ON purchases(purchase_date);

-- ============================================================
-- PURCHASE ITEMS
-- ============================================================

CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,

    product_id UUID NOT NULL REFERENCES products(id),

    quantity NUMERIC(12,3) NOT NULL,

    unit_price NUMERIC(12,2) NOT NULL,

    discount NUMERIC(12,2) DEFAULT 0,

    expiration_date DATE,

    lot VARCHAR(100),

    total_price NUMERIC(12,2) GENERATED ALWAYS AS
    (
        quantity * unit_price - discount
    ) STORED
);

CREATE INDEX idx_purchase_items_product
ON purchase_items(product_id);

-- ============================================================
-- INVENTORY MOVEMENTS
-- ============================================================

CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL REFERENCES products(id),

    purchase_item_id UUID REFERENCES purchase_items(id),

    movement_type_id UUID NOT NULL REFERENCES movement_types(id),

    quantity NUMERIC(12,3) NOT NULL,

    movement_date TIMESTAMP NOT NULL DEFAULT NOW(),

    notes TEXT
);

CREATE INDEX idx_inventory_product
ON inventory_movements(product_id);

CREATE INDEX idx_inventory_date
ON inventory_movements(movement_date);

-- ============================================================
-- INVENTORY VIEW
-- ============================================================

CREATE OR REPLACE VIEW inventory AS
SELECT
    p.id,
    p.name,
    b.name AS brand,

    COALESCE(
        SUM(im.quantity * mt.stock_multiplier),
        0
    ) AS current_stock

FROM products p

LEFT JOIN brands b
    ON p.brand_id = b.id

LEFT JOIN inventory_movements im
    ON p.id = im.product_id

LEFT JOIN movement_types mt
    ON mt.id = im.movement_type_id

GROUP BY
    p.id,
    p.name,
    b.name;

INSERT INTO movement_types (code, name, stock_multiplier) VALUES
('INITIAL_STOCK', 'Inventario inicial', 1),
('PURCHASE', 'Compra', 1),
('CONSUMPTION', 'Consumo', -1),
('LOSS', 'Pérdida', -1),
('DONATION', 'Donación', -1),
('EXPIRED', 'Producto vencido', -1),
('ADJUSTMENT_IN', 'Ajuste de inventario (+)', 1),
('ADJUSTMENT_OUT', 'Ajuste de inventario (-)', -1);

INSERT INTO payment_methods (code, name) VALUES
('CASH', 'Efectivo'),
('DEBIT_CARD', 'Tarjeta débito'),
('CREDIT_CARD', 'Tarjeta crédito'),
('TRANSFER', 'Transferencia'),
('DIGITAL_WALLET', 'Billetera digital'),
('OTHER', 'Otro');

INSERT INTO units (name, symbol) VALUES
('Unidad', 'und'),
('Gramo', 'g'),
('Kilogramo', 'kg'),
('Mililitro', 'ml'),
('Litro', 'L'),
('Paquete', 'paq'),
('Caja', 'caja'),
('Bolsa', 'bolsa'),
('Botella', 'bot'),
('Lata', 'lata'),
('Frasco', 'frasco'),
('Tubo', 'tubo'),
('Rollo', 'rollo'),
('Par', 'par');

INSERT INTO categories (name, icon, color) VALUES
('Alimentos', 'utensils', '#22C55E'),
('Bebidas', 'glass-water', '#3B82F6'),
('Limpieza del hogar', 'spray-can', '#06B6D4'),
('Lavandería', 'shirt', '#0EA5E9'),
('Cuidado personal', 'heart-pulse', '#EC4899'),
('Salud', 'cross', '#EF4444'),
('Bebés', 'baby', '#F59E0B'),
('Mascotas', 'paw-print', '#A855F7'),
('Cocina', 'chef-hat', '#F97316'),
('Productos de papel', 'file-text', '#64748B'),
('Hogar', 'house', '#10B981'),
('Electrónica', 'plug', '#6366F1'),
('Oficina', 'briefcase', '#8B5CF6'),
('Otros', 'package', '#6B7280'); 
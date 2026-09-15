-- ============================================================
-- CLEANUP
-- ============================================================

DROP FUNCTION IF EXISTS trg_inventory_insert() CASCADE;
DROP FUNCTION IF EXISTS trg_inventory_delete() CASCADE;
DROP FUNCTION IF EXISTS trg_inventory_update() CASCADE;
DROP FUNCTION IF EXISTS apply_inventory_balance(UUID, NUMERIC, SMALLINT, DATE) CASCADE;
DROP FUNCTION IF EXISTS apply_inventory_balance(UUID, NUMERIC, SMALLINT) CASCADE;
DROP FUNCTION IF EXISTS trg_product_inventory_config() CASCADE;
DROP FUNCTION IF EXISTS recompute_inventory_balance() CASCADE;
DROP FUNCTION IF EXISTS hash_user_password() CASCADE;

DROP VIEW IF EXISTS inventory;

DROP TABLE IF EXISTS inventory_balance CASCADE;
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

DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP FUNCTION IF EXISTS hash_user_password() CASCADE;

DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS movement_type CASCADE;

-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- AUTH MODULE
-- ============================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION hash_user_password()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Solo hashear cuando la contraseña cambie
    IF TG_OP = 'INSERT'
       OR NEW.password_hash IS DISTINCT FROM OLD.password_hash THEN

        -- Evitar volver a hashear un hash bcrypt existente
        IF NEW.password_hash !~ '^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$' THEN
            NEW.password_hash := crypt(
                NEW.password_hash,
                gen_salt('bf', 12)
            );
        END IF;

    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_hash_password
BEFORE INSERT OR UPDATE OF password_hash
ON users
FOR EACH ROW
EXECUTE FUNCTION hash_user_password();

INSERT INTO roles (code, name, description) VALUES
('ADMIN', 'Administrador', 'Acceso completo al sistema.'),
('USER', 'Usuario', 'Usuario estándar del hogar.');

INSERT INTO users (
    role_id,
    username,
    password_hash,
    first_name,
    last_name
)
SELECT
    id,
    'admin',
    'admin123',
    'Administrador',
    'Sistema'
FROM roles
WHERE code = 'ADMIN';

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_brand_id UUID REFERENCES brands(id),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(100),
    color VARCHAR(20),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE NULLS NOT DISTINCT(parent_brand_id, name)
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_category_id UUID REFERENCES categories(id),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(100),
    color VARCHAR(20),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(name)
);

CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_unit_id UUID REFERENCES units(id),
    parent_multiplier NUMERIC(10,4) DEFAULT 1
        CHECK (parent_multiplier > 0),
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(symbol)
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id),
    brand_id UUID REFERENCES brands(id),
    name VARCHAR(200) NOT NULL,
    unit_id UUID NOT NULL REFERENCES units(id),
    presentation_quantity NUMERIC(10,2)
        CHECK (
            presentation_quantity IS NULL
            OR presentation_quantity > 0
        ),
    min_stock NUMERIC(10,2) NOT NULL DEFAULT 1,
        CHECK (min_stock >= 0),
    min_days NUMERIC(10,2) NOT NULL DEFAULT 7,
        CHECK (min_days >= 0),
    barcode VARCHAR(100) UNIQUE,
    stock_quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
        CHECK (stock_quantity > 0),
    parent_product_id UUID REFERENCES products(id) DEFAULT NULL,
    notificate BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_product_not_its_own_parent
    CHECK (
        parent_product_id IS NULL
        OR parent_product_id <> id
    )
);

CREATE INDEX idx_products_category
ON products(category_id);

CREATE INDEX idx_products_name
ON products(name);

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_products_name_trgm
ON products USING GIN (name gin_trgm_ops);

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE NULLS NOT DISTINCT (name, city, address)
);

CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id),
    purchase_date DATE NOT NULL,
    payment_method_id UUID REFERENCES payment_methods(id),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchase_date
ON purchases(purchase_date);

CREATE TABLE movement_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    stock_multiplier SMALLINT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_stock_multiplier
        CHECK (stock_multiplier IN (-1, 1))
);

CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_type_id UUID NOT NULL REFERENCES movement_types(id),
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    temporal_product_name VARCHAR(200),
    temporal_barcode VARCHAR(100),
    CONSTRAINT chk_product_or_temporal
        CHECK (
            (product_id IS NOT NULL
                AND temporal_product_name IS NULL
                AND temporal_barcode IS NULL)
            OR
            (product_id IS NULL
                AND (
                    temporal_product_name IS NOT NULL
                    OR temporal_barcode IS NOT NULL
                ))
        ),
    expiration_date DATE,
    lot VARCHAR(100),
    quantity NUMERIC(12,3) NOT NULL
        CHECK (quantity > 0),
    unit_price NUMERIC(12,2)
        CHECK (unit_price >= 0),
    discount NUMERIC(12,2) DEFAULT 0
        CHECK (discount >= 0),
    movement_date TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_product
ON inventory_movements(product_id);

CREATE INDEX idx_inventory_date
ON inventory_movements(movement_date);

CREATE INDEX idx_inventory_movements_purchase
ON inventory_movements(purchase_id);

CREATE INDEX idx_inventory_movements_expiration
ON inventory_movements(product_id, expiration_date);

CREATE TABLE inventory_balance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL
        REFERENCES products(id) ON DELETE RESTRICT,
    expiration_date DATE,
    lot VARCHAR(100),
    current_stock NUMERIC(12,3) NOT NULL DEFAULT 0
        CHECK (current_stock >= 0),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE NULLS NOT DISTINCT (product_id, expiration_date, lot)
);

-- ============================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION apply_inventory_balance(
    p_product_id UUID,
    p_quantity NUMERIC,
    p_stock_multiplier SMALLINT,
    p_expiration_date DATE DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_parent_product UUID;
    v_stock_quantity NUMERIC;
    v_expiration_date DATE := COALESCE(p_expiration_date, DATE '9999-12-31');
    v_balance_product UUID;
BEGIN

    SELECT
        parent_product_id,
        stock_quantity
    INTO
        v_parent_product,
        v_stock_quantity
    FROM products
    WHERE id = p_product_id;

    v_balance_product := COALESCE(v_parent_product, p_product_id);

    UPDATE inventory_balance
    SET
        current_stock = current_stock + p_quantity * COALESCE(v_stock_quantity, 1) * p_stock_multiplier,
        updated_at = NOW()
    WHERE
        product_id = v_balance_product
        AND expiration_date = v_expiration_date;

    IF NOT FOUND THEN
        INSERT INTO inventory_balance (
            product_id,
            expiration_date,
            current_stock
        )
        VALUES (
            v_balance_product,
            v_expiration_date,
            p_quantity * COALESCE(v_stock_quantity, 1) * p_stock_multiplier
        );
    END IF;

END;
$$;


CREATE OR REPLACE FUNCTION trg_inventory_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_multiplier SMALLINT;
BEGIN

    -- Los movimientos provisionales no afectan el inventario
    IF NEW.product_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT stock_multiplier
    INTO v_multiplier
    FROM movement_types
    WHERE id = NEW.movement_type_id;

    PERFORM apply_inventory_balance(
        NEW.product_id,
        NEW.quantity,
        v_multiplier,
        NEW.expiration_date
    );

    RETURN NEW;

END;
$$;

CREATE TRIGGER trg_inventory_insert
AFTER INSERT
ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION trg_inventory_insert();


CREATE OR REPLACE FUNCTION trg_inventory_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_multiplier SMALLINT;
BEGIN

    -- Si era provisional, nunca afectó inventory_balance
    IF OLD.product_id IS NULL THEN
        RETURN OLD;
    END IF;

    SELECT stock_multiplier
    INTO v_multiplier
    FROM movement_types
    WHERE id = OLD.movement_type_id;

    PERFORM apply_inventory_balance(
        OLD.product_id,
        OLD.quantity,
        -v_multiplier,
        OLD.expiration_date
    );

    RETURN OLD;

END;
$$;

CREATE TRIGGER trg_inventory_delete
AFTER DELETE
ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION trg_inventory_delete();


CREATE OR REPLACE FUNCTION trg_inventory_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_old_multiplier SMALLINT;
    v_new_multiplier SMALLINT;
BEGIN

    /*
     * Revertir el movimiento anterior solamente
     * si tenía un producto real asociado.
     */
    IF OLD.product_id IS NOT NULL THEN

        SELECT stock_multiplier
        INTO v_old_multiplier
        FROM movement_types
        WHERE id = OLD.movement_type_id;

        PERFORM apply_inventory_balance(
            OLD.product_id,
            OLD.quantity,
            -v_old_multiplier,
            OLD.expiration_date
        );

    END IF;


    /*
     * Aplicar el nuevo movimiento solamente
     * si tiene un producto real asociado.
     */
    IF NEW.product_id IS NOT NULL THEN

        SELECT stock_multiplier
        INTO v_new_multiplier
        FROM movement_types
        WHERE id = NEW.movement_type_id;

        PERFORM apply_inventory_balance(
            NEW.product_id,
            NEW.quantity,
            v_new_multiplier,
            NEW.expiration_date
        );

    END IF;

    RETURN NEW;

END;
$$;

CREATE TRIGGER trg_inventory_update
AFTER UPDATE OF
    movement_type_id,
    product_id,
    quantity,
    expiration_date
ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION trg_inventory_update();

CREATE OR REPLACE FUNCTION recompute_inventory_balance()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    TRUNCATE inventory_balance;

    INSERT INTO inventory_balance (
        product_id,
        expiration_date,
        current_stock
    )
    SELECT
        COALESCE(p.parent_product_id, im.product_id) AS product_id,
        COALESCE(im.expiration_date, DATE '9999-12-31') AS expiration_date,
        SUM(
            im.quantity *
            mt.stock_multiplier *
            CASE
                WHEN p.parent_product_id IS NULL THEN 1
                ELSE p.stock_quantity
            END
        ) AS current_stock
    FROM inventory_movements im
    JOIN movement_types mt ON mt.id = im.movement_type_id
    JOIN products p ON p.id = im.product_id
    GROUP BY
        COALESCE(p.parent_product_id, im.product_id),
        COALESCE(im.expiration_date, DATE '9999-12-31');
END;
$$;


CREATE OR REPLACE FUNCTION trg_product_inventory_config()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM recompute_inventory_balance();
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_product_inventory_config
AFTER UPDATE OF
    stock_quantity,
    parent_product_id
ON products
FOR EACH STATEMENT
EXECUTE FUNCTION trg_product_inventory_config();

-- ============================================================
-- PREDEFINED DATA
-- ============================================================
 
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

INSERT INTO units (name, symbol, parent_unit_id, parent_multiplier) VALUES
('Kilogramo', 'kg', (SELECT id FROM units WHERE symbol = 'g'), 1000),
('Mililitro', 'ml', (SELECT id FROM units WHERE symbol = 'L'), 0.001);

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
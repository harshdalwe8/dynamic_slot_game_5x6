-- Migration for all required tables for the Dynamic Multi-Theme Slot Game System
-- This matches the Prisma schema and requirements

CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    status VARCHAR(32) DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS "Wallet" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES "User"(id),
    balance INTEGER NOT NULL,
    currency VARCHAR(16) DEFAULT 'COINS',
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Transaction" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "User"(id),
    amount INTEGER NOT NULL,
    type VARCHAR(32) NOT NULL,
    balance_after INTEGER NOT NULL,
    reference VARCHAR(255),
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    admin_id UUID REFERENCES "User"(id)
);

CREATE TABLE IF NOT EXISTS "Theme" (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL,
    status VARCHAR(32) NOT NULL,
    json_schema JSONB NOT NULL,
    asset_manifest JSONB NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ThemeVersion" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id VARCHAR(64) NOT NULL REFERENCES "Theme"(id),
    version INTEGER NOT NULL,
    json JSONB NOT NULL,
    assets JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS "Spin" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "User"(id),
    theme_id VARCHAR(64) NOT NULL REFERENCES "Theme"(id),
    bet_amount INTEGER NOT NULL,
    result_matrix JSONB NOT NULL,
    win_amount INTEGER NOT NULL,
    seed VARCHAR(255) NOT NULL,
    rtp_applied FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Payline" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id VARCHAR(64) NOT NULL REFERENCES "Theme"(id),
    definition JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS "AdminLog" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES "User"(id),
    action VARCHAR(255) NOT NULL,
    object_type VARCHAR(64) NOT NULL,
    object_id VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    ip VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS "RTPSnapshot" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id VARCHAR(64) NOT NULL REFERENCES "Theme"(id),
    calculated_rtp FLOAT NOT NULL,
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "Session" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "User"(id),
    refresh_token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_spin_user_id ON "Spin"(user_id);
CREATE INDEX IF NOT EXISTS idx_spin_theme_id ON "Spin"(theme_id);
CREATE INDEX IF NOT EXISTS idx_spin_created_at ON "Spin"(created_at);
CREATE INDEX IF NOT EXISTS idx_theme_status ON "Theme"(status);
CREATE INDEX IF NOT EXISTS idx_transaction_user_id ON "Transaction"(user_id);
CREATE INDEX IF NOT EXISTS idx_adminlog_admin_id ON "AdminLog"(admin_id);
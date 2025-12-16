-- Migration for Security Modules 3, 4, 5
-- This adds DigitalSignature and SecurityAnomaly models with required enums

-- Add enums for digital signatures
DO $$ BEGIN
    CREATE TYPE signature_status AS ENUM ('PENDING', 'SIGNED', 'REJECTED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE anomaly_type AS ENUM ('FAILED_LOGIN', 'MULTIPLE_FAILED_LOGINS', 'SUSPICIOUS_LOCATION', 'UNUSUAL_ACCESS_TIME', 'API_ABUSE', 'BRUTE_FORCE', 'RATE_LIMIT_EXCEEDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE anomaly_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create digital_signatures table
CREATE TABLE IF NOT EXISTS digital_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id VARCHAR NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    signature_hash VARCHAR(64) UNIQUE NOT NULL,
    nonce VARCHAR NOT NULL,
    status signature_status DEFAULT 'PENDING',
    ip_address VARCHAR,
    user_agent VARCHAR,
    signed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Create indexes for digital_signatures
CREATE INDEX IF NOT EXISTS idx_digital_signatures_document_status ON digital_signatures(document_id, status);
CREATE INDEX IF NOT EXISTS idx_digital_signatures_user ON digital_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_signatures_created ON digital_signatures(created_at);

-- Create security_anomalies table
CREATE TABLE IF NOT EXISTS security_anomalies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type anomaly_type NOT NULL,
    severity anomaly_severity DEFAULT 'MEDIUM',
    description VARCHAR NOT NULL,
    ip_address VARCHAR,
    user_agent VARCHAR,
    metadata JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for security_anomalies
CREATE INDEX IF NOT EXISTS idx_security_anomalies_type_severity ON security_anomalies(type, severity);
CREATE INDEX IF NOT EXISTS idx_security_anomalies_resolved ON security_anomalies(resolved);
CREATE INDEX IF NOT EXISTS idx_security_anomalies_created ON security_anomalies(created_at);

-- Add constraint to rental_agreements if not exists
DO $$ BEGIN
    ALTER TABLE rental_agreements ADD COLUMN IF NOT EXISTS digital_signature VARCHAR(64);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE rental_agreements ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add foreign key constraint for digital_signatures to rental_agreements
DO $$ BEGIN
    ALTER TABLE digital_signatures ADD CONSTRAINT fk_digital_signatures_agreement 
    FOREIGN KEY (document_id) REFERENCES rental_agreements(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
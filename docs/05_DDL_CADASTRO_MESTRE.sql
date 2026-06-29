-- ========================================================================================
-- PROJETO AURA - INSTITUTO SER MELHOR
-- DATA MODEL SCRIPT (POSTGRESQL 16+)
-- MÓDULO: CADASTRO MESTRE DE BENEFICIÁRIOS E CONTROLE DE ACESSOS (SSOT)
-- ========================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------
-- 1. IDENTIDADE E CONTROLE DE ACESSO (PORTAIS SEPARADOS)
-- ---------------------------------------------------------
CREATE TYPE portal_access_type AS ENUM ('ADMIN', 'CLINIC', 'BOTH');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Argon2id
    full_name VARCHAR(255) NOT NULL,
    document_cpf VARCHAR(11) UNIQUE NOT NULL,
    portal_access portal_access_type NOT NULL, -- Define em qual portal o usuário pode logar
    mfa_enabled BOOLEAN DEFAULT TRUE,
    mfa_secret VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    portal_used portal_access_type NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 2. CADASTRO MESTRE DE BENEFICIÁRIOS (SINGLE SOURCE OF TRUTH)
-- ---------------------------------------------------------
CREATE TABLE beneficiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Dados Pessoais
    full_name VARCHAR(255) NOT NULL,
    social_name VARCHAR(255),
    document_cpf VARCHAR(11) UNIQUE,
    document_rg VARCHAR(20),
    rg_issuer VARCHAR(20),
    rg_issue_date DATE,
    cnh VARCHAR(20),
    passport VARCHAR(50),
    nationality VARCHAR(100) DEFAULT 'Brasileira',
    place_of_birth VARCHAR(100),
    gender_identity VARCHAR(50),
    sex_assigned_at_birth VARCHAR(20),
    marital_status VARCHAR(50),
    profession VARCHAR(150),
    education_level VARCHAR(100),
    photo_url VARCHAR(512),
    digital_signature_hash VARCHAR(512), -- Hash da assinatura eletrônica
    
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.1 Endereço e Geolocalização
CREATE TABLE beneficiary_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_id UUID NOT NULL UNIQUE REFERENCES beneficiaries(id) ON DELETE CASCADE,
    zip_code VARCHAR(10),
    street VARCHAR(255) NOT NULL,
    number VARCHAR(20) NOT NULL,
    complement VARCHAR(255),
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    country VARCHAR(50) DEFAULT 'Brasil',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.2 Contatos
CREATE TABLE beneficiary_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_id UUID NOT NULL UNIQUE REFERENCES beneficiaries(id) ON DELETE CASCADE,
    primary_phone VARCHAR(20) NOT NULL,
    secondary_phone VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    emergency_contact_name VARCHAR(255),
    emergency_contact_kinship VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.3 Família e Rede de Apoio
CREATE TABLE beneficiary_family (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_id UUID NOT NULL UNIQUE REFERENCES beneficiaries(id) ON DELETE CASCADE,
    father_name VARCHAR(255),
    mother_name VARCHAR(255),
    legal_guardian_name VARCHAR(255),
    number_of_children INT DEFAULT 0,
    number_of_dependents INT DEFAULT 0,
    family_composition_details JSONB, -- Estrutura familiar detalhada
    support_network_details TEXT, -- Descreve a rede de apoio (vizinhos, comunidade)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.4 Informações Sociais
CREATE TABLE beneficiary_social_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_id UUID NOT NULL UNIQUE REFERENCES beneficiaries(id) ON DELETE CASCADE,
    family_income DECIMAL(10, 2),
    housing_situation VARCHAR(100), -- OWNED, RENTED, SHELTER, HOMELESS
    vulnerability_status VARCHAR(100), -- HIGH_RISK, FOOD_INSECURITY, DOMESTIC_VIOLENCE
    social_benefits JSONB, -- Bolsa Família, BPC, etc.
    employment_status VARCHAR(100),
    government_programs JSONB,
    social_observations TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.5 Consentimentos e LGPD
CREATE TABLE beneficiary_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL, -- DATA_PROCESSING, IMAGE_USE, TELEHEALTH, WHATSAPP_MESSAGES
    is_accepted BOOLEAN NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    digital_signature_hash VARCHAR(512),
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- 2.6 Documentos e Uploads
CREATE TABLE beneficiary_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- IDENTIFICATION, PROOF_OF_ADDRESS, LEGAL_ORDER, MEDICAL_REPORT
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(512) NOT NULL, -- S3 URL
    mime_type VARCHAR(100),
    file_size_bytes BIGINT,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_confidential BOOLEAN DEFAULT FALSE -- Se TRUE, requer nível ABAC elevado para acessar
);

-- ---------------------------------------------------------
-- 3. AUDITORIA ESTENDIDA (LGPD / HIPAA COMPLIANT)
-- ---------------------------------------------------------
CREATE TABLE strict_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL, -- Quem executou a ação
    portal_origin portal_access_type NOT NULL, -- Em qual portal a ação ocorreu
    action_type VARCHAR(100) NOT NULL, -- CREATE, READ_SENSITIVE, UPDATE, DELETE, EXPORT, BREAK_GLASS
    target_entity VARCHAR(100) NOT NULL, -- BENEFICIARY, MEDICAL_RECORD, CONSENT
    target_entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    justification TEXT, -- Obrigatório para acessos "Break-Glass" (Super Admin acessando prontuário)
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices Críticos
CREATE INDEX idx_beneficiaries_cpf ON beneficiaries(document_cpf);
CREATE INDEX idx_audit_logs_target ON strict_audit_logs(target_entity, target_entity_id);
CREATE INDEX idx_audit_logs_actor ON strict_audit_logs(actor_id);

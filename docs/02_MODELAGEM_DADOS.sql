-- ========================================================================================
-- PROJETO AURA - INSTITUTO SER MELHOR (CUIDADO SOCIAL E SAÚDE MENTAL)
-- DATA MODEL SCRIPT (POSTGRESQL 16+)
-- FASE 1: BENEFICIÁRIOS, VOLUNTÁRIOS, CASOS, ATENDIMENTO, PROJETOS E DOAÇÕES
-- ========================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------
-- 1. IAM & CORE CONFIGURATIONS
-- ---------------------------------------------------------
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    document_cnpj VARCHAR(14) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE, -- ADMIN, VOLUNTEER, BENEFICIARY, SOCIAL_WORKER
    description TEXT
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ---------------------------------------------------------
-- 2. DOMÍNIO SOCIAL: BENEFICIÁRIOS E REDE DE PROTEÇÃO
-- ---------------------------------------------------------
CREATE TABLE beneficiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id), -- Acesso ao portal do beneficiário (opcional)
    full_name VARCHAR(255) NOT NULL,
    social_name VARCHAR(255),
    date_of_birth DATE NOT NULL,
    document_cpf VARCHAR(11) UNIQUE,
    vulnerability_status VARCHAR(100), -- HIGH_RISK, STABLE, TEMPORARY_SHELTER, etc.
    family_composition JSONB,
    address JSONB,
    lgpd_consent_status BOOLEAN DEFAULT FALSE,
    lgpd_consent_date TIMESTAMP WITH TIME ZONE,
    protective_measures TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE external_referrals ( -- Rede de proteção (CRAS, CREAS, Conselho Tutelar)
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id),
    institution_type VARCHAR(100) NOT NULL, -- CRAS, CREAS, HOSPITAL, DELEGACY, SCHOOL
    institution_name VARCHAR(255),
    reason TEXT NOT NULL,
    referral_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, CONCLUDED
    feedback_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 3. DOMÍNIO PROFISSIONAL: VOLUNTÁRIOS
-- ---------------------------------------------------------
CREATE TABLE volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    profession VARCHAR(100) NOT NULL, -- PSYCHOLOGIST, PSYCHIATRIST, LAWYER, SOCIAL_WORKER, EDUCATOR
    license_number VARCHAR(50), -- CRP, CRM, OAB, etc.
    license_state VARCHAR(2),
    availability_hours INT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    certifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 4. DOMÍNIO CLÍNICO & MULTIDISCIPLINAR: CASOS E PRONTUÁRIOS
-- ---------------------------------------------------------
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, CLOSED, ON_HOLD
    care_plan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE case_volunteers (
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    access_level VARCHAR(50) DEFAULT 'FULL', -- FULL, RESTRICTED_CLINICAL, SOCIAL_ONLY
    PRIMARY KEY (case_id, volunteer_id)
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id),
    volunteer_id UUID NOT NULL REFERENCES volunteers(id),
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    modality VARCHAR(50) NOT NULL, -- ONLINE, IN_PERSON
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE records_entries ( -- Prontuários unificados e registros sociais
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id),
    volunteer_id UUID NOT NULL REFERENCES volunteers(id),
    appointment_id UUID REFERENCES appointments(id),
    entry_type VARCHAR(50) NOT NULL, -- PSYCHO_EVOLUTION, SOCIAL_REPORT, LEGAL_ADVICE, TRIAGE
    
    -- Sigilo Absoluto: Dados clínicos criptografados a nível de aplicação (Application-Level Encryption)
    content_encrypted TEXT NOT NULL, 
    
    visibility_scope VARCHAR(50) DEFAULT 'RESTRICTED', -- RESTRICTED (only author/patient), SHARED_TEAM, GLOBAL_INSTITUTION
    
    is_signed BOOLEAN DEFAULT FALSE,
    signature_metadata JSONB, -- Metadados ICP-Brasil quando aplicável
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 5. DOMÍNIO INSTITUCIONAL: PROJETOS, EAD E CAPTAÇÃO
-- ---------------------------------------------------------
CREATE TABLE social_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_beneficiaries (
    project_id UUID NOT NULL REFERENCES social_projects(id),
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    PRIMARY KEY (project_id, beneficiary_id)
);

CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_name VARCHAR(255),
    donor_document VARCHAR(20),
    amount DECIMAL(12,2) NOT NULL,
    donation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    project_id UUID REFERENCES social_projects(id), -- Vínculo opcional se doação for direcionada
    status VARCHAR(50) DEFAULT 'COMPLETED',
    payment_method VARCHAR(50)
);

-- ---------------------------------------------------------
-- 6. AUDIT & COMPLIANCE (APPEND-ONLY)
-- ---------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL, -- BENEFICIARY, CASE, MEDICAL_RECORD, VOLUNTEER
    entity_id UUID NOT NULL,
    ip_address INET,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_cases_beneficiary ON cases(beneficiary_id);
CREATE INDEX idx_appointments_schedule ON appointments(volunteer_id, scheduled_start);

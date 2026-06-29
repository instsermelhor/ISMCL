-- ========================================================================================
-- PROJETO AURA - INSTITUTO SER MELHOR
-- DATA MODEL SCRIPT (POSTGRESQL 16+)
-- MÓDULO: PRONTUÁRIO ELETRÔNICO (EMR) E CLÍNICA
-- ========================================================================================

-- Nota Arquitetural: O módulo EMR herda as entidades do Cadastro Mestre 
-- (`beneficiaries`, `volunteers`, `cases`).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------
-- 1. ANAMNESE E AVALIAÇÃO INICIAL (Acolhimento)
-- ---------------------------------------------------------
CREATE TABLE emr_anamnesis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES volunteers(id), -- Quem preencheu
    
    -- Formulário Estruturado (JSONB permite flexibilidade de templates)
    chief_complaint TEXT NOT NULL, -- Queixa principal
    personal_history TEXT,
    family_history TEXT,
    structured_data JSONB, -- Ex: Rastreios (PHQ-9, GAD-7, Inventários)
    
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, FINALIZED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finalized_at TIMESTAMP WITH TIME ZONE
);

-- ---------------------------------------------------------
-- 2. EVOLUÇÃO CLÍNICA (SESSÕES E NOTAS) - NÚCLEO DO SIGILO
-- ---------------------------------------------------------
CREATE TYPE evolution_status AS ENUM ('DRAFT', 'SIGNED', 'AMENDED');
CREATE TYPE visibility_scope AS ENUM ('PRIVATE_TO_AUTHOR', 'SHARED_WITH_CASE_TEAM', 'GLOBAL_CLINICAL');

CREATE TABLE emr_evolutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES volunteers(id), -- Autor da nota
    appointment_id UUID REFERENCES appointments(id), -- Vínculo opcional com a agenda
    
    clinical_date TIMESTAMP WITH TIME ZONE NOT NULL, -- Data real do atendimento
    
    -- SIGILO: Este campo nunca será texto limpo. O ORM/Backend fará criptografia AES-256 (KMS)
    content_encrypted TEXT NOT NULL, 
    
    format_type VARCHAR(50) DEFAULT 'FREE_TEXT', -- FREE_TEXT, SOAP
    visibility visibility_scope DEFAULT 'PRIVATE_TO_AUTHOR',
    
    status evolution_status DEFAULT 'DRAFT',
    
    -- Segurança e Integridade Imutável
    digital_signature_hash VARCHAR(512), 
    signed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 3. VERSIONAMENTO (ERRATAS / AMENDMENTS)
-- ---------------------------------------------------------
-- Cumpre a exigência dos conselhos: evoluções assinadas não podem ser alteradas. 
-- Uma correção gera uma entrada apendicular nesta tabela.
CREATE TABLE emr_evolution_erratas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evolution_id UUID NOT NULL REFERENCES emr_evolutions(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES volunteers(id),
    
    correction_text_encrypted TEXT NOT NULL,
    justification_for_correction TEXT NOT NULL,
    
    digital_signature_hash VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 4. DIAGNÓSTICOS E CONDIÇÕES
-- ---------------------------------------------------------
CREATE TABLE emr_diagnoses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES volunteers(id),
    
    classification_system VARCHAR(20) NOT NULL, -- CID-10, CID-11, DSM-5
    code VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    
    diagnostic_status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, RESOLVED, RULED_OUT
    clinical_notes TEXT, -- Observações do diagnóstico
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- ---------------------------------------------------------
-- 5. ANEXOS MÉDICOS E LAUDOS
-- ---------------------------------------------------------
CREATE TABLE emr_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES volunteers(id),
    
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL, -- EXAM_RESULT, EXTERNAL_REPORT, PATIENT_ART (Psicologia)
    file_s3_key VARCHAR(512) NOT NULL,
    mime_type VARCHAR(100),
    
    visibility visibility_scope DEFAULT 'PRIVATE_TO_AUTHOR',
    
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices Críticos de Performance
CREATE INDEX idx_emr_evolutions_case ON emr_evolutions(case_id, clinical_date DESC);
CREATE INDEX idx_emr_evolutions_beneficiary ON emr_evolutions(beneficiary_id);
CREATE INDEX idx_emr_diagnoses_beneficiary ON emr_diagnoses(beneficiary_id, diagnostic_status);

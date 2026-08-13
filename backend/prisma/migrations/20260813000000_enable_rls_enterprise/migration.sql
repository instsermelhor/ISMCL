-- ==============================================================================
-- AURA PLATFORM — ENTERPRISE DATABASE ZERO-TRUST & ROW LEVEL SECURITY (RLS)
-- Migration: 20260813000000_enable_rls_enterprise
-- Normas: AURA-DBS-001, NIST SP 800-53, LGPD Art. 46
-- ==============================================================================

-- 1. Funções Auxiliares de Sessão Segura (SECURITY DEFINER + search_path fixo)
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION current_user_id() RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_id', true), '');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION current_user_role() RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_role', true), 'ANONYMOUS');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_super_user() RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_user_role() = 'SUPER_USER_UNIVERSAL';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 2. Habilitação de RLS e Criação de Políticas nas Tabelas Tenant-Scoped

-- Tabela: DataConsent
ALTER TABLE IF EXISTS "DataConsent" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_consent_tenant_isolation" ON "DataConsent";
CREATE POLICY "p_consent_tenant_isolation" ON "DataConsent"
  FOR ALL
  USING (is_super_user() OR "tenantId" = current_tenant_id())
  WITH CHECK (is_super_user() OR "tenantId" = current_tenant_id());

-- Tabela: DataSubjectRequest
ALTER TABLE IF EXISTS "DataSubjectRequest" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_dsar_tenant_isolation" ON "DataSubjectRequest";
CREATE POLICY "p_dsar_tenant_isolation" ON "DataSubjectRequest"
  FOR ALL
  USING (is_super_user() OR "tenantId" = current_tenant_id())
  WITH CHECK (is_super_user() OR "tenantId" = current_tenant_id());

-- Tabela: DataProcessingLog (ROPA)
ALTER TABLE IF EXISTS "DataProcessingLog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_ropa_tenant_isolation" ON "DataProcessingLog";
CREATE POLICY "p_ropa_tenant_isolation" ON "DataProcessingLog"
  FOR SELECT
  USING (is_super_user() OR "tenantId" = current_tenant_id());

-- Tabela: AnonymizationRecord
ALTER TABLE IF EXISTS "AnonymizationRecord" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_anon_tenant_isolation" ON "AnonymizationRecord";
CREATE POLICY "p_anon_tenant_isolation" ON "AnonymizationRecord"
  FOR ALL
  USING (is_super_user() OR "tenantId" = current_tenant_id())
  WITH CHECK (is_super_user() OR "tenantId" = current_tenant_id());

-- Tabela: OfflineSyncBatch
ALTER TABLE IF EXISTS "OfflineSyncBatch" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_offline_tenant_isolation" ON "OfflineSyncBatch";
CREATE POLICY "p_offline_tenant_isolation" ON "OfflineSyncBatch"
  FOR ALL
  USING (is_super_user() OR "tenantId" = current_tenant_id())
  WITH CHECK (is_super_user() OR "tenantId" = current_tenant_id());

-- Tabela: BreakGlassSession
ALTER TABLE IF EXISTS "BreakGlassSession" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_breakglass_tenant_isolation" ON "BreakGlassSession";
CREATE POLICY "p_breakglass_tenant_isolation" ON "BreakGlassSession"
  FOR ALL
  USING (is_super_user() OR "tenantId" = current_tenant_id())
  WITH CHECK (is_super_user() OR "tenantId" = current_tenant_id());

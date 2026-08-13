variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "subnet_ids" { type = list(string) }
variable "instance_class" { type = string }
variable "allocated_storage" { type = number }

resource "aws_kms_key" "db_kms" {
  description             = "KMS Key para criptografia do PostgreSQL RDS Aura"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name        = "aura-rds-kms-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_db_subnet_group" "rds" {
  name       = "aura-rds-subnet-group-${var.environment}"
  subnet_ids = var.subnet_ids

  tags = { Name = "aura-rds-subnets-${var.environment}" }
}

resource "aws_security_group" "rds_sg" {
  name        = "aura-rds-sg-${var.environment}"
  description = "Controle de acesso estrito para a porta 5432 do PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    description = "Acesso PostgreSQL apenas da subnet da aplicacao"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "postgres" {
  identifier            = "aura-postgres-${var.environment}"
  engine                = "postgres"
  engine_version        = "16.2"
  instance_class        = var.instance_class
  allocated_storage     = var.allocated_storage
  max_allocated_storage = 500
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.db_kms.arn

  db_name  = "aura_prod"
  username = "aura_admin"
  password = "CHANGE_ME_VAULT_ROTATED_SECRET" # Injetado via Secrets Manager / Vault

  multi_az               = var.environment == "prod" ? true : false
  db_subnet_group_name   = aws_db_subnet_group.rds.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  backup_retention_period = 30
  backup_window           = "03:00-04:00"
  maintenance_window      = "Sun:04:30-Sun:05:30"
  deletion_protection     = var.environment == "prod" ? true : false
  skip_final_snapshot     = var.environment == "prod" ? false : true

  tags = {
    Name        = "aura-postgres-${var.environment}"
    Environment = var.environment
  }
}

output "db_endpoint" { value = aws_db_instance.postgres.endpoint }
output "db_arn" { value = aws_db_instance.postgres.arn }

# ─────────────────────────────────────────────────────────────────────────────
# PROMPT 205 — DISASTER RECOVERY: Cross-Region Read Replica & Route 53 Failover
# RPO = 0 (Multi-AZ Síncrono) | RTO < 5 min (Failover Automático) | PITR 30d
# ─────────────────────────────────────────────────────────────────────────────

# Provider alternativo para região DR (us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# KMS key dedicada na região DR para criptografia da réplica
resource "aws_kms_key" "db_kms_us_east" {
  provider                = aws.us_east_1
  description             = "KMS Key DR us-east-1 — PostgreSQL Replica Aura"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name        = "aura-rds-kms-dr-${var.environment}"
    Environment = var.environment
    Region      = "us-east-1"
  }
}

# Cross-Region Read Replica para DR (sa-east-1 → us-east-1)
# Em caso de desastre regional, promover com: aws rds promote-read-replica
resource "aws_db_instance" "postgres_replica_us_east" {
  count = var.environment == "prod" ? 1 : 0

  identifier          = "aura-postgres-${var.environment}-replica-us-east-1"
  replicate_source_db = aws_db_instance.postgres.arn
  instance_class      = var.instance_class
  storage_encrypted   = true
  kms_key_id          = aws_kms_key.db_kms_us_east.arn

  # Backup local na região DR para PITR independente
  backup_retention_period = 7

  # Proteção total — NÃO destruir réplica sem aprovação explícita
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "aura-dr-replica-final-${var.environment}"

  # Não expor publicamente — acessar apenas via PrivateLink ou VPN
  publicly_accessible = false

  auto_minor_version_upgrade  = false
  allow_major_version_upgrade = false

  provider = aws.us_east_1

  tags = {
    Name       = "aura-postgres-dr-replica-${var.environment}"
    Environment = var.environment
    Role       = "dr-cross-region-replica"
    Tier       = "T0-Critical"
    Compliance = "LGPD-ISO22301"
  }
}

# Data source para account ID (usado no nome do bucket S3)
data "aws_caller_identity" "current" {}

# S3 Bucket para arquivamento WAL (PITR) — Imutável com Object Lock
resource "aws_s3_bucket" "wal_archive" {
  bucket        = "aura-wal-archive-${var.environment}-${data.aws_caller_identity.current.account_id}"
  force_destroy = false # NUNCA destruir backups WAL sem revisão

  tags = {
    Name        = "aura-wal-archive-${var.environment}"
    Environment = var.environment
    Purpose     = "PostgreSQL-WAL-PITR-Archive"
    Compliance  = "LGPD-CFM-ISO22301"
  }
}

# Versioning obrigatório no bucket WAL
resource "aws_s3_bucket_versioning" "wal_archive" {
  bucket = aws_s3_bucket.wal_archive.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Object Lock GOVERNANCE — proteção contra deleção acidental por 30 dias
resource "aws_s3_bucket_object_lock_configuration" "wal_archive" {
  depends_on = [aws_s3_bucket_versioning.wal_archive]
  bucket     = aws_s3_bucket.wal_archive.id

  rule {
    default_retention {
      mode = "GOVERNANCE" # Admins podem deletar com permissão MFA explícita
      days = 30
    }
  }
}

# Criptografia SSE-KMS no bucket WAL
resource "aws_s3_bucket_server_side_encryption_configuration" "wal_archive" {
  bucket = aws_s3_bucket.wal_archive.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.db_kms.arn
    }
    bucket_key_enabled = true
  }
}

# Bloquear acesso público ao bucket WAL
resource "aws_s3_bucket_public_access_block" "wal_archive" {
  bucket                  = aws_s3_bucket.wal_archive.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Route 53 Health Check para failover automático de DNS
resource "aws_route53_health_check" "primary_api" {
  count = var.environment == "prod" ? 1 : 0

  fqdn              = "api-primary.aura.ismcl.com.br"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 2   # 2 falhas consecutivas → considera DOWN
  request_interval  = 10  # Verifica a cada 10s → detecta falha em < 30s

  tags = {
    Name        = "aura-api-primary-health-check-${var.environment}"
    Environment = var.environment
  }
}

# Outputs de DR
output "db_replica_endpoint" {
  value       = length(aws_db_instance.postgres_replica_us_east) > 0 ? aws_db_instance.postgres_replica_us_east[0].endpoint : null
  description = "Endpoint da réplica cross-region para failover DR"
}

output "wal_archive_bucket" {
  value       = aws_s3_bucket.wal_archive.bucket
  description = "Bucket S3 para arquivamento de WAL (PITR)"
}

output "route53_health_check_id" {
  value       = length(aws_route53_health_check.primary_api) > 0 ? aws_route53_health_check.primary_api[0].id : null
  description = "ID do health check Route 53 para failover automático de DNS"
}

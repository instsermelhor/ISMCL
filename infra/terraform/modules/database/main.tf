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

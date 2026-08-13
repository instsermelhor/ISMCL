provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Aura Platform"
      Environment = var.environment
      Institution = "Instituto Ser Melhor"
      Compliance  = "LGPD-ISO27001"
      ManagedBy   = "Terraform"
    }
  }
}

# 1. Módulo de Rede e Conectividade
module "vpc" {
  source             = "./modules/vpc"
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

# 2. Módulo de Armazenamento Seguro
module "storage" {
  source      = "./modules/storage"
  environment = var.environment
}

# 3. Módulo de Banco de Dados Gerenciado (PostgreSQL RDS Multi-AZ)
module "database" {
  source            = "./modules/database"
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_db_subnet_ids
  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage
}

# 4. Módulo de Cache Distribuído (Redis ElastiCache)
module "cache" {
  source      = "./modules/cache"
  environment = var.environment
  vpc_id      = module.vpc.vpc_id
  subnet_ids  = module.vpc.private_app_subnet_ids
}

# 5. Módulo de Orquestração de Containers (Kubernetes EKS)
module "k8s_cluster" {
  source              = "./modules/k8s_cluster"
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_app_subnet_ids
  node_instance_types = var.k8s_node_instance_types
  min_nodes           = var.k8s_min_nodes
  max_nodes           = var.k8s_max_nodes
}

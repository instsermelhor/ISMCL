output "vpc_id" {
  description = "ID da VPC criada"
  value       = module.vpc.vpc_id
}

output "eks_cluster_endpoint" {
  description = "Endpoint do servidor de API do Kubernetes EKS"
  value       = module.k8s_cluster.cluster_endpoint
}

output "eks_cluster_name" {
  description = "Nome do cluster EKS provisionado"
  value       = module.k8s_cluster.cluster_name
}

output "database_endpoint" {
  description = "Endpoint de conexao do PostgreSQL RDS"
  value       = module.database.db_endpoint
  sensitive   = true
}

output "redis_primary_endpoint" {
  description = "Endpoint primario do cluster Redis ElastiCache"
  value       = module.cache.redis_endpoint
}

output "storage_bucket_name" {
  description = "Nome do bucket S3 de armazenamento de anexos clinicos"
  value       = module.storage.bucket_name
}

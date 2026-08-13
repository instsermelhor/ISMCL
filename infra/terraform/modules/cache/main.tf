variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "subnet_ids" { type = list(string) }

resource "aws_elasticache_subnet_group" "redis" {
  name       = "aura-redis-subnet-group-${var.environment}"
  subnet_ids = var.subnet_ids
}

resource "aws_security_group" "redis_sg" {
  name        = "aura-redis-sg-${var.environment}"
  description = "Acesso seguro ao Redis Cluster porta 6379"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "aura-redis-${var.environment}"
  description          = "Redis Cluster para WebRTC Signaling, Rate Limiting e Cache de Sessao"
  engine               = "redis"
  engine_version       = "7.1"
  node_type            = "cache.t4g.medium"
  num_cache_clusters   = var.environment == "prod" ? 3 : 1
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis_sg.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  automatic_failover_enabled = var.environment == "prod" ? true : false

  tags = {
    Name        = "aura-redis-${var.environment}"
    Environment = var.environment
  }
}

output "redis_endpoint" {
  value = aws_elasticache_replication_group.redis.primary_endpoint_address
}

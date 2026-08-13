variable "environment" {
  description = "Ambiente de deploy (prod, staging, dev)"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "Região AWS de deploy"
  type        = string
  default     = "sa-east-1" # São Paulo para menor latência e conformidade LGPD
}

variable "vpc_cidr" {
  description = "CIDR block principal da VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Zonas de disponibilidade para alta disponibilidade (Multi-AZ)"
  type        = list(string)
  default     = ["sa-east-1a", "sa-east-1b", "sa-east-1c"]
}

variable "db_instance_class" {
  description = "Classe de instância do banco de dados PostgreSQL"
  type        = string
  default     = "db.r6g.xlarge"
}

variable "db_allocated_storage" {
  description = "Armazenamento alocado para o banco de dados em GB"
  type        = number
  default     = 100
}

variable "k8s_node_instance_types" {
  description = "Tipos de instância para os nós do Kubernetes EKS"
  type        = list(string)
  default     = ["m6i.xlarge", "m6a.xlarge"]
}

variable "k8s_min_nodes" {
  description = "Número mínimo de nós no cluster EKS"
  type        = number
  default     = 3
}

variable "k8s_max_nodes" {
  description = "Número máximo de nós no cluster EKS (Auto-scaling)"
  type        = number
  default     = 15
}

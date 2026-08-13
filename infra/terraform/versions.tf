terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Configuração de Backend Remoto (S3 + DynamoDB State Locking)
  # backend "s3" {
  #   bucket         = "aura-terraform-state-prod"
  #   key            = "platform/prod/terraform.tfstate"
  #   region         = "sa-east-1"
  #   encrypt        = true
  #   dynamodb_table = "aura-terraform-locks"
  # }
}

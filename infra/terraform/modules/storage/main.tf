variable "environment" { type = string }

resource "aws_kms_key" "storage_kms" {
  description             = "KMS Key para criptografia de anexos clinicos e logs LGPD"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_s3_bucket" "clinical_storage" {
  bucket = "aura-clinical-attachments-${var.environment}"

  tags = {
    Name        = "aura-clinical-attachments-${var.environment}"
    Environment = var.environment
    Compliance  = "LGPD-Art46"
  }
}

resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.clinical_storage.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "encryption" {
  bucket = aws_s3_bucket.clinical_storage.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.storage_kms.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "block_public" {
  bucket = aws_s3_bucket.clinical_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

output "bucket_name" { value = aws_s3_bucket.clinical_storage.id }
output "bucket_arn" { value = aws_s3_bucket.clinical_storage.arn }

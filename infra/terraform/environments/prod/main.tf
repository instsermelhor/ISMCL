module "aura_production" {
  source = "../../"

  environment        = "prod"
  aws_region         = "sa-east-1" # Região Brasil para soberania de dados LGPD
  vpc_cidr           = "10.100.0.0/16"
  availability_zones = ["sa-east-1a", "sa-east-1b", "sa-east-1c"]

  db_instance_class    = "db.r6g.2xlarge"
  db_allocated_storage = 250

  k8s_node_instance_types = ["m6i.2xlarge", "m6a.2xlarge"]
  k8s_min_nodes           = 3
  k8s_max_nodes           = 20
}

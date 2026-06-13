# Terraform stubs — TSC Platform
#
# Placeholder for future IaC. Not required for initial multi-repo cutover.
# Prefer Railway + Vercel dashboards until infra complexity warrants Terraform.

# Planned modules:
# - cloudflare_dns (theshakticollective.in records)
# - cloudflare_r2 (media buckets)
# - typesense_cloud (search cluster)

# terraform {
#   required_version = ">= 1.6"
#   required_providers {
#     cloudflare = {
#       source  = "cloudflare/cloudflare"
#       version = "~> 4.0"
#     }
#   }
# }

output "api_url" {
  description = "The API's address; the Function URL is only the CloudFront origin"
  value       = "https://${local.api_domain}/"
}

output "cname_target" {
  description = "Point a DNS-only CNAME for freal-api in Cloudflare at this hostname"
  value       = module.front.cname_target
}

output "site_url" {
  description = "The dashboard's address"
  value       = "https://${local.site_domain}/"
}

output "site_cname_target" {
  description = "Point a DNS-only CNAME for freal in Cloudflare at this hostname"
  value       = module.site.cname_target
}

output "site_distribution_id" {
  description = "Set this as distribution-id in the deploy workflow so each deploy invalidates the cache"
  value       = module.site.distribution_id
}

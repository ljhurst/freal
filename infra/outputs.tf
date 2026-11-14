output "api_url" {
  description = "The API's address; the Function URL is only the CloudFront origin"
  value       = "https://${local.api_domain}/"
}

output "cname_target" {
  description = "Point a DNS-only CNAME for freal-api in Cloudflare at this hostname"
  value       = module.front.cname_target
}

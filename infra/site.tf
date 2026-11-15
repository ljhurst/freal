locals {
  site_domain = "freal.bylukehurst.com"
}

module "site" {
  source = "git::https://github.com/ljhurst/stych.git//infra/modules/static-site?ref=v1.12.0"

  bucket_name  = "lj-freal"
  domain_name  = local.site_domain
  spa_fallback = true

  # The app ships no inline scripts or styles and uses no eval, so nothing here needs unsafe-*.
  content_security_policy = join("; ", [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self' https://${local.api_domain} ${trimsuffix(var.lasso_issuer_url, "/")}",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ])
}

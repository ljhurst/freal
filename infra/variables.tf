variable "aws_region" {
  description = "AWS region; stych's wildcard certificate and CloudFront front require us-east-1"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., prod)"
  type        = string
}

variable "project_name" {
  description = "Project name; stych's CI roles manage CloudFront only for resources tagged Project=<name>"
  type        = string
}

variable "lambda_package_path" {
  description = "Path to the zipped API package. Run `scripts/build_lambda.sh`"
  type        = string
}

variable "lasso_issuer_url" {
  description = "Lasso's OIDC issuer URL, the authorization server freal verifies access tokens against"
  type        = string
}

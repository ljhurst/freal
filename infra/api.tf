data "aws_caller_identity" "current" {}

locals {
  api_domain    = "freal-api.bylukehurst.com"
  function_name = "lj-freal-api"

  account_id         = data.aws_caller_identity.current.account_id
  ssm_parameter_arns = "arn:aws:ssm:${var.aws_region}:${local.account_id}:parameter"
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "api" {
  name                 = "${var.project_name}-lambda"
  assume_role_policy   = data.aws_iam_policy_document.lambda_assume_role.json
  permissions_boundary = "arn:aws:iam::${local.account_id}:policy/stych/${var.project_name}-boundary"
}

data "aws_iam_policy_document" "api_permissions" {
  statement {
    sid       = "ReadParameters"
    actions   = ["ssm:GetParameter", "ssm:GetParameters"]
    resources = ["${local.ssm_parameter_arns}/${var.project_name}/*"]
  }

  statement {
    sid       = "WriteEspnCredentials"
    actions   = ["ssm:PutParameter"]
    resources = ["${local.ssm_parameter_arns}/${var.project_name}/espn/*"]
  }

  statement {
    sid       = "WriteLogs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.api.arn}:*"]
  }
}

resource "aws_iam_role_policy" "api" {
  name   = "${var.project_name}-lambda-permissions"
  role   = aws_iam_role.api.id
  policy = data.aws_iam_policy_document.api_permissions.json
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${local.function_name}"
  retention_in_days = 30
}

resource "aws_lambda_function" "api" {
  function_name = local.function_name
  role          = aws_iam_role.api.arn

  filename         = var.lambda_package_path
  source_code_hash = filebase64sha256(var.lambda_package_path)

  handler       = "freal.operations.lambda_handler.handler"
  runtime       = "python3.13"
  architectures = ["arm64"]

  memory_size = 512
  timeout     = 60

  # Caps how hard the public endpoint can drive ESPN and the account's concurrency.
  reserved_concurrent_executions = 5

  logging_config {
    log_format = "Text"
    log_group  = aws_cloudwatch_log_group.api.name
  }

  environment {
    variables = {
      LASSO_ISSUER_URL   = var.lasso_issuer_url
      FREAL_RESOURCE_URL = "https://${local.api_domain}/"
    }
  }

  depends_on = [aws_iam_role_policy.api]
}

resource "aws_lambda_function_url" "api" {
  function_name      = aws_lambda_function.api.function_name
  authorization_type = "NONE"
  invoke_mode        = "BUFFERED"
}

module "front" {
  source = "git::https://github.com/ljhurst/stych.git//infra/modules/function-url-site?ref=v1.11.0"

  domain_name    = local.api_domain
  function_url   = aws_lambda_function_url.api.function_url
  origin_timeout = aws_lambda_function.api.timeout
}

# Cadastra as chaves do Pagar.me na Vercel (Production e Preview).
#
# Uso (na raiz do projeto):
#   npm run payments:setup
#   ou: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup-pagarme-env.ps1
#
# As chaves são digitadas em modo oculto (Read-Host -AsSecureString) e enviadas
# direto para a Vercel via CLI. Nenhum segredo é gravado em arquivo, log ou
# histórico do PowerShell.
#
# Antes de rodar, confirme que o projeto está linkado (existe a pasta .vercel)
# e que você está autenticado: npx vercel whoami

$ErrorActionPreference = "Stop"

Set-Location (Split-Path $PSScriptRoot -Parent)

function Read-SecretValue {
  param([string]$Prompt)

  $secure = Read-Host -Prompt $Prompt -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $value = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
  return $value.Trim()
}

function Add-VercelEnv {
  param(
    [string]$Name,
    [string]$Value,
    [string]$Environment,
    [bool]$Sensitive
  )

  $common = @(
    "vercel", "env", "add", $Name, $Environment,
    "--force", "--yes", "--value", $Value
  )

  if ($Sensitive) {
    $output = & npx.cmd @common "--sensitive" 2>&1
    if ($LASTEXITCODE -ne 0) {
      Write-Warning "Nao foi possivel marcar $Name como sensivel. Tentando sem essa opcao."
      $output = & npx.cmd @common 2>&1
    }
  } else {
    $output = & npx.cmd @common 2>&1
  }

  if ($LASTEXITCODE -ne 0) {
    Write-Host ($output | Out-String) -ForegroundColor DarkGray
    throw "Falha ao cadastrar $Name no ambiente $Environment."
  }

  Write-Host "  OK: $Name ($Environment)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Configuracao do Pagar.me na Vercel - projeto agenedix" -ForegroundColor Cyan
Write-Host "Use as chaves do MESMO ambiente: todas de teste ou todas de producao." -ForegroundColor DarkGray
Write-Host ""

$secretKey = Read-SecretValue "PAGARME_SECRET_KEY (sk_...)"
if (-not $secretKey) { throw "A chave secreta nao pode ficar vazia." }
if (-not $secretKey.StartsWith("sk_")) {
  Write-Warning "A chave secreta normalmente comeca com sk_. Confira o valor digitado."
}

$publicKey = Read-SecretValue "NEXT_PUBLIC_PAGARME_PUBLIC_KEY (pk_...)"
if (-not $publicKey) { throw "A chave publica nao pode ficar vazia." }
if (-not $publicKey.StartsWith("pk_")) {
  Write-Warning "A chave publica normalmente comeca com pk_. Confira o valor digitado."
}

$secretIsTest = $secretKey.StartsWith("sk_test_") -or $secretKey.StartsWith("sk_test")
$publicIsTest = $publicKey.StartsWith("pk_test_") -or $publicKey.StartsWith("pk_test")
if ($secretIsTest -ne $publicIsTest) {
  throw "As chaves parecem ser de ambientes diferentes (teste x producao). Use as duas do mesmo ambiente."
}

$webhookKey = Read-SecretValue "PAGARME_WEBHOOK_SECRET (Enter para usar a propria chave secreta)"
if (-not $webhookKey) {
  Write-Host "  Usando PAGARME_SECRET_KEY como segredo do webhook." -ForegroundColor DarkGray
  $webhookKey = $secretKey
}

$mode = if ($secretIsTest) { "TESTE" } else { "PRODUCAO" }
Write-Host ""
Write-Host "Ambiente detectado: $mode" -ForegroundColor Yellow

# Valida a chave secreta direto na API do Pagar.me antes de gravar na Vercel.
$basic = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("${secretKey}:"))
try {
  Invoke-RestMethod -Method Get `
    -Uri "https://api.pagar.me/core/v5/customers?size=1" `
    -Headers @{ Authorization = "Basic $basic" } `
    -TimeoutSec 20 | Out-Null
  Write-Host "Chave secreta aceita pelo Pagar.me." -ForegroundColor Green
} catch {
  $status = $null
  if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
  if ($status -eq 401 -or $status -eq 403) {
    throw "O Pagar.me recusou a chave secreta (HTTP $status). Confira o valor e o ambiente."
  }
  Write-Warning "Nao foi possivel validar a chave agora (HTTP $status). Seguindo mesmo assim."
}

Write-Host "Cadastrando em Production e Preview..." -ForegroundColor Cyan

$targets = @("production", "preview")

foreach ($target in $targets) {
  Add-VercelEnv -Name "PAGARME_SECRET_KEY" -Value $secretKey -Environment $target -Sensitive $true
  Add-VercelEnv -Name "NEXT_PUBLIC_PAGARME_PUBLIC_KEY" -Value $publicKey -Environment $target -Sensitive $false
  Add-VercelEnv -Name "PAGARME_WEBHOOK_SECRET" -Value $webhookKey -Environment $target -Sensitive $true
}

Write-Host ""
Write-Host "Variaveis cadastradas." -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "  1. Cadastre o webhook no painel do Pagar.me:"
Write-Host "     https://agenedix.vercel.app/api/webhooks/pagarme"
Write-Host "     Eventos: order.paid, order.payment_failed, charge.paid,"
Write-Host "     charge.payment_failed, charge.refunded, subscription.canceled"
Write-Host "  2. Faca um novo deploy para a chave publica entrar no build:"
Write-Host "     npx vercel --prod"
Write-Host ""

$deploy = Read-Host "Fazer o deploy de producao agora? (s/N)"
if ($deploy -match "^[sSyY]") {
  & npx.cmd vercel --prod --yes
  if ($LASTEXITCODE -ne 0) { throw "O deploy falhou." }
  Write-Host "Deploy concluido." -ForegroundColor Green
}

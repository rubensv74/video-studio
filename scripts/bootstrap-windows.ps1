$ErrorActionPreference = "Stop"

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$Command
    )

    Write-Host ""
    Write-Host "==> $Name"
    & $Command

    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE"
    }
}

Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

Invoke-Step "Environment check" { node scripts/check-env.mjs }

if (Test-Path "package-lock.json") {
    Invoke-Step "Install dependencies from lockfile" { npm ci --no-audit --no-fund }
}
else {
    Invoke-Step "Initial dependency install" { npm install --no-audit --no-fund }
}

Invoke-Step "Foundation checks" { npm run check }
Invoke-Step "Render demo" { npm run render -- projects/demo-product/project.json }
Invoke-Step "Verify rendered media" { npm run verify:render -- projects/demo-product/project.json }

if (-not (Test-Path "package-lock.json")) {
    throw "package-lock.json was not generated"
}

Write-Host ""
Write-Host "PASS VS-G02 local bootstrap"
Write-Host "Output: output/remotion-demo.mp4"
Write-Host "Lockfile: package-lock.json"

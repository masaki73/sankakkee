[CmdletBinding()]
param(
    [string]$AssetRoot = $env:AI_SHORT_ASSETS_ROOT,
    [switch]$SkipHash
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$manifestPath = Join-Path $projectRoot 'asset_manifest.json'

if ([string]::IsNullOrWhiteSpace($AssetRoot)) {
    throw 'AI_SHORT_ASSETS_ROOT is not set. Example: $env:AI_SHORT_ASSETS_ROOT = ''D:\ai-short-assets'''
}
if (-not (Test-Path -LiteralPath $AssetRoot)) {
    throw "Asset root does not exist: $AssetRoot"
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$failed = $false

foreach ($asset in $manifest.external_assets) {
    $path = Join-Path $AssetRoot $asset.filename
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        Write-Host "MISSING  $($asset.filename)" -ForegroundColor Red
        $failed = $true
        continue
    }

    $file = Get-Item -LiteralPath $path
    if ($file.Length -ne [int64]$asset.bytes) {
        Write-Host "BAD SIZE $($asset.filename) expected=$($asset.bytes) actual=$($file.Length)" -ForegroundColor Red
        $failed = $true
        continue
    }

    if (-not $SkipHash) {
        $actualHash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($actualHash -ne $asset.sha256.ToLowerInvariant()) {
            Write-Host "BAD HASH $($asset.filename)" -ForegroundColor Red
            $failed = $true
            continue
        }
    }

    Write-Host "OK       $($asset.filename)" -ForegroundColor Green
}

if ($failed) {
    throw 'Asset verification failed. Re-copy the files marked above.'
}

Write-Host 'All external assets verified.' -ForegroundColor Green


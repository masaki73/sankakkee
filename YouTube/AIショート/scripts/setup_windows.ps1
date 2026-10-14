[CmdletBinding()]
param(
    [string]$AssetRoot = $env:AI_SHORT_ASSETS_ROOT,
    [string]$ToolsRoot = 'C:\ai-tools',
    [switch]$PrepareDirectories,
    [switch]$CloneTools
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent

if ([string]::IsNullOrWhiteSpace($AssetRoot)) {
    if (Test-Path 'D:\') {
        $AssetRoot = 'D:\ai-short-assets'
    } else {
        $AssetRoot = 'C:\ai-short-assets'
    }
    Write-Host "AI_SHORT_ASSETS_ROOT was not set; proposed path: $AssetRoot" -ForegroundColor Yellow
}

& (Join-Path $PSScriptRoot 'check_windows.ps1') -AssetRoot $AssetRoot

if ($PrepareDirectories) {
    foreach ($path in @($AssetRoot, $ToolsRoot, (Join-Path $projectRoot 'outputs'))) {
        if (-not (Test-Path -LiteralPath $path)) {
            New-Item -ItemType Directory -Path $path | Out-Null
            Write-Host "Created: $path" -ForegroundColor Green
        } else {
            Write-Host "Exists:  $path"
        }
    }
}

if ($CloneTools) {
    if ($null -eq (Get-Command git -ErrorAction SilentlyContinue)) {
        throw 'Git is required before -CloneTools can be used.'
    }
    if (-not (Test-Path -LiteralPath $ToolsRoot)) {
        throw "Tools root does not exist. Re-run with -PrepareDirectories: $ToolsRoot"
    }

    $repositories = @(
        @{ Name = 'GPT-SoVITS'; Url = 'https://github.com/RVC-Boss/GPT-SoVITS.git' },
        @{ Name = 'MuseTalk'; Url = 'https://github.com/TMElyralab/MuseTalk.git' },
        @{ Name = 'SadTalker'; Url = 'https://github.com/OpenTalker/SadTalker.git' }
    )

    foreach ($repository in $repositories) {
        $destination = Join-Path $ToolsRoot $repository.Name
        if (Test-Path -LiteralPath $destination) {
            Write-Host "Skipped existing folder: $destination" -ForegroundColor Yellow
            continue
        }
        & git clone --depth 1 $repository.Url $destination
        if ($LASTEXITCODE -ne 0) {
            throw "git clone failed: $($repository.Name)"
        }
    }
}

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Set: `$env:AI_SHORT_ASSETS_ROOT = '$AssetRoot'"
Write-Host '2. Run scripts\verify_assets.ps1'
Write-Host '3. Record the GPU/VRAM result before installing CUDA-specific packages.'
Write-Host '4. Follow HANDOFF_WINDOWS.md for GPT-SoVITS and MuseTalk setup.'


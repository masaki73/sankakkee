[CmdletBinding()]
param(
    [string]$AssetRoot = $env:AI_SHORT_ASSETS_ROOT
)

$ErrorActionPreference = 'Stop'

function Find-Command {
    param([string]$Name)
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($null -eq $command) {
        return 'NOT FOUND'
    }
    return $command.Source
}

Write-Host '=== AI Short Windows readiness check ===' -ForegroundColor Cyan
Write-Host "PowerShell: $($PSVersionTable.PSVersion)"
Write-Host "Windows: $([Environment]::OSVersion.VersionString)"

$computer = Get-CimInstance Win32_ComputerSystem
$os = Get-CimInstance Win32_OperatingSystem
$memoryGb = [Math]::Round($computer.TotalPhysicalMemory / 1GB, 1)
Write-Host "CPU: $($computer.SystemType) / logical processors $($computer.NumberOfLogicalProcessors)"
Write-Host "RAM: $memoryGb GB"
Write-Host "OS architecture: $($os.OSArchitecture)"

Write-Host "Git: $(Find-Command 'git')"
Write-Host "Conda: $(Find-Command 'conda')"
Write-Host "Python: $(Find-Command 'python')"
Write-Host "FFmpeg: $(Find-Command 'ffmpeg')"
Write-Host "FFprobe: $(Find-Command 'ffprobe')"

Write-Host "`nGPU:" -ForegroundColor Cyan
$videoControllers = Get-CimInstance Win32_VideoController
$videoControllers | ForEach-Object {
    $reportedVram = if ($_.AdapterRAM) { [Math]::Round($_.AdapterRAM / 1GB, 1) } else { 'unknown' }
    Write-Host "- $($_.Name) / reported VRAM: $reportedVram GB / driver: $($_.DriverVersion)"
}

$nvidiaSmi = Get-Command nvidia-smi -ErrorAction SilentlyContinue
if ($null -ne $nvidiaSmi) {
    Write-Host "`nNVIDIA SMI:" -ForegroundColor Cyan
    & $nvidiaSmi.Source --query-gpu=name,memory.total,driver_version --format=csv,noheader
} else {
    Write-Host "`nnvidia-smi: NOT FOUND" -ForegroundColor Yellow
}

if ([string]::IsNullOrWhiteSpace($AssetRoot)) {
    Write-Host "`nAI_SHORT_ASSETS_ROOT is not set." -ForegroundColor Yellow
} elseif (-not (Test-Path -LiteralPath $AssetRoot)) {
    Write-Host "`nAsset root does not exist: $AssetRoot" -ForegroundColor Yellow
} else {
    $resolvedAssetRoot = (Resolve-Path -LiteralPath $AssetRoot).Path
    $qualifier = Split-Path -Qualifier $resolvedAssetRoot
    $drive = Get-PSDrive -Name $qualifier.TrimEnd(':') -ErrorAction SilentlyContinue
    Write-Host "`nAsset root: $resolvedAssetRoot"
    if ($null -ne $drive) {
        Write-Host "Asset drive free: $([Math]::Round($drive.Free / 1GB, 1)) GB"
    }
}

Write-Host "`nRecommendation:" -ForegroundColor Cyan
if ($null -ne $nvidiaSmi) {
    $memoryText = & $nvidiaSmi.Source --query-gpu=memory.total --format=csv,noheader,nounits | Select-Object -First 1
    $memoryMb = 0
    [void][int]::TryParse(($memoryText -replace '[^0-9]', ''), [ref]$memoryMb)
    if ($memoryMb -ge 8192) {
        Write-Host 'GPT-SoVITS + MuseTalk 1.5 is the primary path.' -ForegroundColor Green
    } elseif ($memoryMb -ge 4096) {
        Write-Host 'Use GPT-SoVITS and test MuseTalk with fp16 on an 8-second clip first.' -ForegroundColor Yellow
    } else {
        Write-Host 'Use CPU/lightweight fallback; MuseTalk may not be practical.' -ForegroundColor Yellow
    }
} else {
    Write-Host 'No NVIDIA CLI detected. Use GPT-SoVITS CPU and compare SadTalker or a cloud fallback.' -ForegroundColor Yellow
}


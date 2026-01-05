#!/usr/bin/env pwsh
# RMS 系統自動備份腳本

param(
    [string]$BackupDir = "C:\RMS-Backups",
    [int]$RetentionDays = 30
)

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupPath = Join-Path $BackupDir $Timestamp

# 建立備份目錄
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null

Write-Host "🔄 開始備份 RMS 系統..." -ForegroundColor Cyan

# 1. 備份 SQLite 資料庫
Write-Host "📦 備份資料庫..."
docker cp rms-application:/app/data/rms.db "$BackupPath\rms.db"

# 2. 備份上傳檔案
Write-Host "📁 備份上傳檔案..."
docker cp rms-application:/app/public/uploads "$BackupPath\uploads"

# 3. 壓縮備份
Write-Host "🗜️ 壓縮備份檔案..."
$ZipPath = "$BackupPath.zip"
Compress-Archive -Path $BackupPath -DestinationPath $ZipPath
Remove-Item -Recurse -Force $BackupPath

# 4. 清理過期備份
Write-Host "🧹 清理過期備份..."
Get-ChildItem -Path $BackupDir -Filter "*.zip" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) } |
    Remove-Item -Force

# 5. 記錄備份完成
$BackupSize = (Get-Item $ZipPath).Length / 1MB
Write-Host "✅ 備份完成: $ZipPath ($([math]::Round($BackupSize, 2)) MB)" -ForegroundColor Green

# 輸出備份資訊
@{
    Timestamp = $Timestamp
    Path = $ZipPath
    SizeMB = [math]::Round($BackupSize, 2)
} | ConvertTo-Json | Out-File "$BackupDir\latest_backup.json"

#!/usr/bin/env pwsh
# RMS 系統還原腳本

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

Write-Host "⚠️ 即將從備份還原系統，當前資料將被覆蓋！" -ForegroundColor Yellow
$Confirm = Read-Host "確定要繼續嗎？(輸入 'YES' 確認)"

if ($Confirm -ne "YES") {
    Write-Host "已取消還原操作" -ForegroundColor Red
    exit
}

# 1. 停止服務
Write-Host "🛑 停止服務..."
docker compose down

# 2. 解壓備份
$RestoreDir = "C:\RMS-Restore-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Host "📦 解壓備份至 $RestoreDir..."
Expand-Archive -Path $BackupFile -DestinationPath $RestoreDir

# 3. 還原資料庫
Write-Host "🔄 還原資料庫..."
docker run --rm -v rms-data:/data -v "${RestoreDir}:/backup" alpine sh -c "rm -f /data/rms.db && cp /backup/rms.db /data/"

# 4. 還原上傳檔案
Write-Host "📁 還原上傳檔案..."
docker run --rm -v rms-uploads:/uploads -v "${RestoreDir}/uploads:/backup" alpine sh -c "rm -rf /uploads/* && cp -r /backup/* /uploads/"

# 5. 重新啟動服務
Write-Host "🚀 啟動服務..."
docker compose up -d

# 6. 健康檢查
Start-Sleep -Seconds 10
try {
    $Health = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -ErrorAction Stop
    if ($Health.status -eq "ok") {
        Write-Host "✅ 系統還原成功！" -ForegroundColor Green
    } else {
        throw "Health check failed"
    }
} catch {
    Write-Host "❌ 系統啟動異常，請檢查日誌" -ForegroundColor Red
    docker logs rms-application --tail 50
}

# 清理
Remove-Item -Recurse -Force $RestoreDir

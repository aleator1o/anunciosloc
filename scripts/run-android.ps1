#!/usr/bin/env pwsh

# Script para Windows PowerShell: pré-build, instalar dependências, build Android e instalar APK
param()

function Run-Command($cmd, $errorMessage) {
  Write-Host "\n> $cmd" -ForegroundColor Cyan
  $cwd = (Get-Location).ProviderPath
  $log = Join-Path $cwd "build.log"
  if (Test-Path $log) { Remove-Item $log -ErrorAction SilentlyContinue }

  # Run via cmd.exe and capture output to log; then show last lines and on failure print full log
  & cmd.exe /c $cmd 1> $log 2>&1
  $exitCode = $LASTEXITCODE

  # Show last 200 lines for quick feedback
  if (Test-Path $log) {
    Write-Host "--- Log (last 200 lines) ---" -ForegroundColor Yellow
    Get-Content $log -Tail 200 | ForEach-Object { Write-Host $_ }
  }

  if ($exitCode -ne 0) {
    Write-Host "--- Full log ---" -ForegroundColor Red
    if (Test-Path $log) { Get-Content $log | ForEach-Object { Write-Host $_ } }
    Write-Error $errorMessage
    exit $exitCode
  }
}

Write-Host "Starting native Android build flow..." -ForegroundColor Green

# 1) Prebuild (gera pastas nativas)
Run-Command "npx expo prebuild" "expo prebuild falhou"

# 2) Instalar dependências Node
Run-Command "npm install" "npm install falhou"

# 3) Limpar e buildar no Android
if (-Not (Test-Path "android")) {
  Write-Error "Pasta android/ não encontrada. Certifique-se de que 'npx expo prebuild' rodou com sucesso."
  exit 1
}

Push-Location android

# Usar gradlew.bat no Windows
if (-Not (Test-Path ".\gradlew.bat")) {
  Write-Error "gradlew.bat não encontrado em android/. Verifique o prebuild ou a instalação do Gradle wrapper."
  Pop-Location
  exit 1
}

Run-Command ".\gradlew.bat clean" "Gradle clean falhou"
Run-Command ".\gradlew.bat assembleDebug" "Gradle assembleDebug falhou"

Pop-Location

# 4) Instalar APK no dispositivo conectado (se existir)
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
  Run-Command "adb install -r $apkPath" "adb install falhou. Verifique se o dispositivo está conectado e com depuração USB ativada."
  Write-Host "APK instalado com sucesso." -ForegroundColor Green
} else {
  Write-Warning "APK não encontrado em $apkPath. Você pode usar 'npx expo run:android' para instalar automaticamente ou checar o caminho do APK." 
}

Write-Host "Fluxo concluído." -ForegroundColor Green

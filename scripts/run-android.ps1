#!/usr/bin/env pwsh

# Script para Windows PowerShell: pré-build, instalar dependências, build Android e instalar APK
param()

function Run-Command($cmd, $errorMessage) {
  Write-Host "\n> $cmd" -ForegroundColor Cyan
  $proc = Start-Process -FilePath pwsh -ArgumentList "-NoProfile","-NoLogo","-Command","& { $cmd }" -NoNewWindow -Wait -PassThru
  if ($proc.ExitCode -ne 0) {
    Write-Error $errorMessage
    exit $proc.ExitCode
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

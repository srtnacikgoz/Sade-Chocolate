#!/bin/bash

# Claude'dan onay gerekli bildirimler için
# Hem sesli hem görsel bildirim

# JSON input'u al
INPUT=$(cat)

# Bildirim mesajını çıkar
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "Unknown Tool"')
MESSAGE=$(echo "$INPUT" | jq -r '.message // "Claude onay bekliyor"')

# Sesli bildirim (Windows PowerShell ile)
powershell -c '[console]::beep(1000,300); Start-Sleep -Milliseconds 100; [console]::beep(1000,300)' 2>/dev/null &

# Görsel bildirim (renkli terminal çıktısı)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔔 CLAUDE ONAY İSTİYOR!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Tool: $TOOL_NAME"
echo "Mesaj: $MESSAGE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit 0

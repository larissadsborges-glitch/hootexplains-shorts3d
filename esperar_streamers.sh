#!/usr/bin/env bash
# Waits for the big English streamers to go live (owner 16 Nov: "see when the famous streamers are online and then
# remind me, so you can start collecting again"). Checks every 5 min; when 4+ of the big list are live (or 2+ after
# 23:30) it writes canais_agora.txt (up to 8, biggest first) and exits. Gives up at 04:00.
# Usage (Git Bash):  bash esperar_streamers.sh
PY=/c/Users/borge/.hoottools/venv/Scripts/python.exe
CL=/c/Users/borge/hoot/tools/clipper
BIG="https://www.twitch.tv/kaicenat https://kick.com/xqc https://www.twitch.tv/xqc https://www.twitch.tv/caseoh_ https://www.twitch.tv/jynxzi
https://www.youtube.com/@IShowSpeed/live https://www.twitch.tv/hasanabi https://www.twitch.tv/zackrawrr https://www.twitch.tv/theburntpeanut
https://www.twitch.tv/stableronaldo https://www.twitch.tv/summit1g https://www.twitch.tv/sodapoppin https://www.twitch.tv/caedrel
https://www.twitch.tv/lacy https://www.twitch.tv/jasontheween https://www.twitch.tv/plaqueboymax https://www.twitch.tv/fanum
https://www.twitch.tv/duke_dennis https://www.twitch.tv/agent00 https://www.twitch.tv/tarik https://www.twitch.tv/shroud
https://www.twitch.tv/timthetatman https://www.twitch.tv/nickmercs https://kick.com/adinross https://www.twitch.tv/ludwig
https://www.twitch.tv/emiru https://www.twitch.tv/moistcr1tikal https://www.twitch.tv/rakai https://kick.com/n3on"
end=$(date -d "tomorrow 04:00" +%s); [ $(date +%H) -lt 4 ] && end=$(date -d "04:00" +%s)
while [ $(date +%s) -lt $end ]; do
  tmp=$(mktemp)
  for u in $BIG; do ( timeout 50 $PY -m yt_dlp -q --no-warnings --simulate --print is_live "$u" 2>/dev/null | grep -q True && echo "$u" >> "$tmp" ) & done; wait
  live=$(for u in $BIG; do grep -qx "$u" "$tmp" && echo "$u"; done); n=$(echo "$live" | grep -c .); rm -f "$tmp"
  echo "$(date +%H:%M) live: $n  $(echo $live | sed 's#https://[^/]*/##g')"
  need=4; [ $(date +%H%M) -ge 2330 -o $(date +%H) -lt 4 ] && need=2
  if [ $n -ge $need ]; then
    echo "$live" | head -8 | sed 's/$/ | en |/' > $CL/canais_agora.txt
    echo "== GO $(date +%H:%M)"; cat $CL/canais_agora.txt; exit 0
  fi
  sleep 300
done
echo "== nobody big came online before 04:00"; exit 1

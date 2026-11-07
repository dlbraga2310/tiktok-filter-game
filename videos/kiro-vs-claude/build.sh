#!/bin/sh
# Constroi kiro-vs-claude.mp4 (1080x1920, 24 fps). Requer lemo-opuscar instalado (LIB) e ffmpeg 7+.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../../../lemo-opuscar" && pwd)}
export LIB
cd "$LIB"
[ -f "$HERE/voice/dur.json" ] || "$LIB/.venv/bin/python" core/tts/tts_zh.py "$HERE/lines.json" "$HERE/voice"
python3 "$HERE/plan.py"
node core/render/events.mjs "$HERE" --size 1080x1920
node core/render/video.mjs "$HERE" --size 1080x1920 --fps 24 --workers 3 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/kiro-vs-claude.mp4" 24 0

#!/usr/bin/env bash
# Assemble the HYRISE explainer video from scene PNGs + voiceover.
set -e
cd "$(dirname "$0")/.."
SCENES=public/marketing/scenes
VO=public/marketing/voiceover.mp3
OUT=public/marketing/hyrise-explainer.mp4
TMP="public/marketing/.tmp_render"
rm -rf "$TMP"; mkdir -p "$TMP"
FONT="/c/Windows/Fonts/arial.ttf"

# Per-scene durations (seconds) — must sum to ~32.76 (voiceover length)
DUR=(7.0 7.0 7.0 7.0 7.76)

# 1) Make each scene a video clip at its duration (replace any prior audio)
i=0
for s in scene1_hero scene2_ats scene3_interview scene4_india scene5_cta; do
  ffmpeg -y -hide_banner -loglevel error \
    -loop 1 -i "$SCENES/$s.png" \
    -t ${DUR[$i]} -r 30 -pix_fmt yuv420p \
    -vf "scale=1920:1080" \
    "$TMP/$s.mp4"
  i=$((i+1))
done

# 2) Concatenate with 0.6s crossfades between clips
# Build a filter that crossfades consecutive clips.
F=""
INPUTS=""
n=${#DUR[@]}
# accumulate offsets
prev_end=0
# We'll use the standard crossfade chain
fc=""
for ((j=0;j<n;j++)); do
  INPUTS="$INPUTS -i $TMP/scene$((j+1))_*.mp4"
done
# simpler: use concat with xfade via filter_complex
# Generate xfade chain
xf=""
# offsets: clip duration minus fade
fade=0.6
offset=0
chain="[0:v]"
for ((j=1;j<n;j++)); do
  offset=$(awk "BEGIN{print $offset + ${DUR[$((j-1))]} - $fade}")
  xf="${xf}${chain}[$j:v]xfade=transition=fade:duration=$fade:offset=$offset[v$j];"
  chain="[v$j]"
done
# final chain tag
last="v$((n-1))"

ffmpeg -y -hide_banner -loglevel error \
  -i $TMP/scene1_hero.mp4 -i $TMP/scene2_ats.mp4 -i $TMP/scene3_interview.mp4 -i $TMP/scene4_india.mp4 -i $TMP/scene5_cta.mp4 \
  -filter_complex "${xf%?}" -map "[$last]" -r 30 -pix_fmt yuv420p \
  -c:v libx264 -preset medium -crf 23 "$TMP/visual.mp4"

# 3) Mux audio
ffmpeg -y -hide_banner -loglevel error \
  -i "$TMP/visual.mp4" -i "$VO" \
  -c:v copy -c:a aac -b:a 192k -shortest \
  -movflags +faststart "$OUT"

rm -rf "$TMP"
echo "✅ Built $OUT"
ffprobe -hide_banner -v error -show_entries format=duration,format_name -of default=noprint_wrappers=1 "$OUT"
ls -la "$OUT"

#!/bin/bash
# プロジェクトディレクトリをスキャンしてmanifest.jsonを生成する
# 各プロジェクトのmeta.jsonから情報を取得

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST_FILE="$ROOT_DIR/manifest.json"

echo "Scanning projects in: $ROOT_DIR"

# JSON配列の開始
echo "[" > "$MANIFEST_FILE"

first=true

for dir in "$ROOT_DIR"/*/; do
  dirname=$(basename "$dir")

  # 除外ディレクトリ（先頭が _ または . のもの、assets）
  if [[ "$dirname" == _* ]] || [[ "$dirname" == .* ]] || [[ "$dirname" == "assets" ]]; then
    continue
  fi

  # index.htmlが存在するディレクトリのみ対象
  if [[ ! -f "$dir/index.html" ]]; then
    continue
  fi

  # meta.jsonがあれば読み込み、なければデフォルト値
  if [[ -f "$dir/meta.json" ]]; then
    title=$(jq -r '.title // "'"$dirname"'"' "$dir/meta.json")
    description=$(jq -r '.description // ""' "$dir/meta.json")
    tags=$(jq -c '.tags // []' "$dir/meta.json")
    date=$(jq -r '.date // ""' "$dir/meta.json")
    thumbnail=$(jq -r '.thumbnail // ""' "$dir/meta.json")
    type=$(jq -r '.type // "static"' "$dir/meta.json")
  else
    title="$dirname"
    description=""
    tags="[]"
    date=""
    thumbnail=""
    type="static"
  fi

  # dateが空の場合、gitのコミット日時を使用（なければ現在日時）
  if [[ -z "$date" ]]; then
    if git log -1 --format="%ai" -- "$dir" > /dev/null 2>&1; then
      date=$(git log -1 --format="%Y-%m-%d" -- "$dir" 2>/dev/null || date +%Y-%m-%d)
    else
      date=$(date +%Y-%m-%d)
    fi
  fi

  if [ "$first" = true ]; then
    first=false
  else
    echo "," >> "$MANIFEST_FILE"
  fi

  # JSON出力
  cat >> "$MANIFEST_FILE" <<EOF
  {
    "slug": "$dirname",
    "title": $(echo "$title" | jq -R .),
    "description": $(echo "$description" | jq -R .),
    "tags": $tags,
    "date": "$date",
    "thumbnail": "$thumbnail",
    "type": "$type"
  }
EOF

  echo "  Found: $dirname ($title)"
done

echo "]" >> "$MANIFEST_FILE"

echo "Manifest generated: $MANIFEST_FILE"

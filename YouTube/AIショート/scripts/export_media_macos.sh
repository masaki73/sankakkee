#!/bin/bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /Volumes/EXTERNAL_DRIVE/ai-short-assets" >&2
  exit 2
fi

script_dir="$(cd "$(dirname "$0")" && pwd)"
project_root="$(cd "$script_dir/.." && pwd)"
destination="$1"
manifest="$project_root/asset_manifest.json"

if [[ "$destination" == "/" || "$destination" == "$project_root" ]]; then
  echo "Refusing unsafe destination: $destination" >&2
  exit 2
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to read asset_manifest.json" >&2
  exit 1
fi

mkdir -p "$destination"

while IFS=$'\t' read -r filename expected_hash; do
  source_path="$project_root/$filename"
  destination_path="$destination/$filename"

  if [[ ! -f "$source_path" ]]; then
    echo "MISSING SOURCE: $source_path" >&2
    exit 1
  fi

  if [[ -f "$destination_path" ]]; then
    existing_hash="$(shasum -a 256 "$destination_path" | awk '{print $1}')"
    if [[ "$existing_hash" == "$expected_hash" ]]; then
      echo "SKIP verified: $filename"
      continue
    fi
    echo "REFUSING TO OVERWRITE mismatched file: $destination_path" >&2
    exit 1
  fi

  echo "COPY: $filename"
  cp -p "$source_path" "$destination_path"
  copied_hash="$(shasum -a 256 "$destination_path" | awk '{print $1}')"
  if [[ "$copied_hash" != "$expected_hash" ]]; then
    echo "HASH FAILED after copy: $filename" >&2
    exit 1
  fi
  echo "OK: $filename"
done < <(jq -r '.external_assets[] | [.filename, .sha256] | @tsv' "$manifest")

cp -p "$manifest" "$destination/asset_manifest.json"
echo "Transfer bundle ready: $destination"


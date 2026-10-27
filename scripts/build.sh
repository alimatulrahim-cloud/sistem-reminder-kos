#!/usr/bin/env bash
# Kumpulkan file statis ke public/ untuk di-deploy Worker (root repo tetap dipakai GitHub Pages).
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf public && mkdir -p public
cp index.html aplikasi.html public/
cp -r docs public/docs

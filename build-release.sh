#!/usr/bin/env bash
# 生成可部署的干净源码包。
# 用法： ./build-release.sh [输出目录]      默认输出到上级目录
set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="${1:-$(dirname "$SRC_DIR")}"
STAMP="$(date +%Y%m%d-%H%M)"
PKG_NAME="ctf-platform-${STAMP}"
TARBALL="${OUT_DIR}/${PKG_NAME}.tar.gz"

echo "==> 源码目录: $SRC_DIR"
echo "==> 输出文件: $TARBALL"

# ── 1. 打包前先验证前端能编译，避免出一个构建不过的包 ──────────────
if command -v pnpm >/dev/null 2>&1 && [ -d "$SRC_DIR/src/GZCTF/ClientApp/node_modules" ]; then
  echo "==> 校验前端类型..."
  (cd "$SRC_DIR/src/GZCTF/ClientApp" && npx tsc --noEmit -p tsconfig.json)
  echo "    类型检查通过"
else
  echo "==> 跳过前端校验（未安装依赖）；服务器上 Docker 构建时会重新编译"
fi

# ── 2. 暂存到临时目录（顺便把顶层目录名规范成包名），再打包 ──────────
# 用 rsync 暂存而不是 tar --transform：后者在 macOS 自带的 bsdtar 上不可用
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

echo "==> 暂存文件..."
rsync -a \
  --exclude='src/GZCTF/ClientApp/node_modules/' \
  --exclude='src/GZCTF/ClientApp/build/' \
  --exclude='src/GZCTF/ClientApp/.vite/' \
  --exclude='data/db/' \
  --exclude='data/files/' \
  --exclude='.git/' \
  --exclude='.env' \
  --exclude='docs/screenshots/' \
  --exclude='bin/' \
  --exclude='obj/' \
  --exclude='.DS_Store' \
  --exclude='._*' \
  "$SRC_DIR/" "$STAGE/$PKG_NAME/"

# 数据目录留空壳，保证解压后 compose 的挂载路径存在
mkdir -p "$STAGE/$PKG_NAME/data/files" "$STAGE/$PKG_NAME/data/db"

echo "==> 打包中..."
tar -czf "$TARBALL" -C "$STAGE" "$PKG_NAME"

SIZE="$(du -h "$TARBALL" | cut -f1)"
COUNT="$(tar -tzf "$TARBALL" | wc -l | tr -d ' ')"

echo
echo "==> 完成"
echo "    文件: $TARBALL"
echo "    大小: $SIZE"
echo "    条目: $COUNT"
echo
echo "    注意: 包内不含 .env（含本地密钥）。服务器上执行 cp .env.example .env 后按文档填写。"

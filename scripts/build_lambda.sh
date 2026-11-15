#!/usr/bin/env bash
# Builds dist/freal.zip: third-party dependencies resolved for Lambda's linux/arm64
# runtime with uv (no Docker), plus the first-party source. boto3 is left out because
# the Lambda runtime provides it.
#
# Bytecode is precompiled so cold starts don't recompile every dependency, and every
# mtime is normalized so the zip's hash only changes when its contents do; otherwise
# Terraform sees a new package on every build.
set -euo pipefail

cd "$(dirname "$0")/.."

zip_path="dist/freal.zip"
rm -rf build "$zip_path"
mkdir -p build/app build/package dist

uv export -q --frozen --no-dev --no-editable --no-emit-project -o build/requirements.txt

uv pip install -q \
  --no-installer-metadata \
  --no-compile-bytecode \
  --python-platform aarch64-manylinux2014 \
  --python 3.13 \
  --target build/package \
  -r build/requirements.txt

# Console scripts start with the build machine's Python path, and RECORD files list their hashes,
# so the package would differ per machine and per Python patch release. Lambda runs neither.
rm -rf build/package/bin
find build/package -name RECORD -delete

rsync -a --exclude='*.pyc' --exclude='__pycache__' src/freal build/app/

for tree in build/package build/app; do
  uv run -q --no-project --python 3.13 python -m compileall -q -j 0 \
    --invalidation-mode unchecked-hash \
    -s "$tree" -p /var/task \
    "$tree"
done

find build -exec touch -t 202001010000.00 {} +

# Files are added in sorted order because zip otherwise records them in the order the
# filesystem lists them, which differs between machines and changes the hash.
(cd build/app && find freal -type f | LC_ALL=C sort | zip -Xq "../../${zip_path}" -@)
(cd build/package && find . -type f | LC_ALL=C sort | zip -Xq "../../${zip_path}" -@)

rm -rf build

echo "Built $(pwd)/${zip_path}"

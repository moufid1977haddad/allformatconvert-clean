#!/usr/bin/env bash
# Builds public/wasm/libraw.wasm + app/lib/libraw/libraw.mjs from the official LibRaw sources (P22, 02/10).
#   Single-threaded (LIBRAW_NOTHREADS, no pthreads): no cross-origin isolation needed, nothing for Turbopack to
#   bundle but one plain ES module. Exceptions: native WebAssembly ones, legacy encoding (Safari 15.2+).
# Sigma X3F (Foveon) is left out on purpose (no USE_X3FTOOLS): measured on 02/10, LibRaw's Foveon development gives
# wrong colours next to the camera's own JPEG (green leaves brown, red tulips pink); app/lib/rawDecode.js refuses X3F.
# Usage: scripts/libraw-wasm/build.sh <dir with LibRaw-0.22.2.tar.gz>   (emsdk activated: emcc on PATH)
# Source check: libraw.org publishes no checksum or signature, so the tarball is checked against the SHA-256 below,
# recorded on 02/10 after comparing it file by file with GitHub's tag 0.22.2 (commit b93f6e45): every source and
# header identical; only autotools files differ (README.md).
set -euo pipefail
VERSION=0.22.2
SHA256=de86b035655accff8d4010f1a221fdf50d353cb7b1422ba26f14a0db92612cfa
WORK=${1:?folder holding LibRaw-$VERSION.tar.gz}
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../.." && pwd)
cd "$WORK"
echo "$SHA256  LibRaw-$VERSION.tar.gz" | sha256sum -c -
rm -rf "LibRaw-$VERSION" obj && tar xzf "LibRaw-$VERSION.tar.gz" && mkdir -p obj
SRC="$WORK/LibRaw-$VERSION"
FLAGS="-O3 -w -I$SRC -DLIBRAW_NOTHREADS -DUSE_ZLIB -DUSE_JPEG -sUSE_ZLIB=1 -sUSE_LIBJPEG=1 -fwasm-exceptions -sWASM_LEGACY_EXCEPTIONS=1"
# The object list of LibRaw's own Makefile.dist (LIB_OBJECTS), each built from the source of the same name.
OBJS=$(sed -n '/^LIB_OBJECTS=/,/^$/p' "$SRC/Makefile.dist" | grep -o 'object/[a-z0-9_]*\.o' | sed 's|object/||; s|\.o$||')
for o in $OBJS; do f=$(find "$SRC/src" -name "$o.cpp"); [ -n "$f" ] || { echo "missing source for $o"; exit 1; }; echo "$f"; done \
  | xargs -P 8 -I{} sh -c 'em++ '"$FLAGS"' -c "{}" -o "obj/$(basename "{}" .cpp).o"'
em++ $FLAGS -c "$HERE/glue.cpp" -o obj/glue.o
mkdir -p "$ROOT/app/lib/libraw" "$ROOT/public/wasm"
em++ $FLAGS obj/*.o -o "$ROOT/app/lib/libraw/libraw.mjs" \
  -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=worker -sINCOMING_MODULE_JS_API=wasmBinary -sFILESYSTEM=0 \
  -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=64MB -sMAXIMUM_MEMORY=4GB -sMIN_SAFARI_VERSION=160400 \
  -sEXPORTED_FUNCTIONS=_lr_open,_lr_info,_lr_make_model,_lr_strerror,_lr_process,_lr_pixels,_lr_close,_malloc,_free \
  -sEXPORTED_RUNTIME_METHODS=HEAPU8,HEAP32,UTF8ToString
mv "$ROOT/app/lib/libraw/libraw.wasm" "$ROOT/public/wasm/libraw.wasm"
# The page always hands the module its bytes (wasmBinary, fetched from /wasm/): drop the glue's fallback reference to a
# libraw.wasm next to it, which a bundler would otherwise try to resolve as an asset.
# Same for the script directory (only used to locate that file): Turbopack would try to resolve "." as a module.
sed -i 's|new URL("libraw.wasm",import.meta.url).href|"libraw.wasm"|g; s|new URL("libraw.wasm",import.meta.url)|"libraw.wasm"|g; s|new URL(".",_scriptName).href|""|g' "$ROOT/app/lib/libraw/libraw.mjs"
! grep -q 'new URL(' "$ROOT/app/lib/libraw/libraw.mjs" || { echo "glue still holds a new URL(...) a bundler would resolve"; exit 1; }
ls -l "$ROOT/public/wasm/libraw.wasm" "$ROOT/app/lib/libraw/libraw.mjs"
gzip -9 -c "$ROOT/public/wasm/libraw.wasm" | wc -c | sed 's/^/gzip bytes: /'

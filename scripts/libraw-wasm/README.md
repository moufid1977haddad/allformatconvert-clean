# LibRaw → WebAssembly (P22, 02/10)

Builds `public/wasm/libraw.wasm` and its loader `app/lib/libraw/libraw.mjs` (used by `app/lib/rawDecode.js`).

- **LibRaw 0.22.2** (latest stable, 16/07/2026), official tarball `https://www.libraw.org/data/LibRaw-0.22.2.tar.gz`,
  SHA-256 `de86b035655accff8d4010f1a221fdf50d353cb7b1422ba26f14a0db92612cfa`. libraw.org publishes no checksum or
  signature, and the GitHub tag `0.22.2` (commit `b93f6e45`) is unsigned: the tarball was compared file by file with
  GitHub's tag archive — every source and header identical; only autotools files (configure, m4, …) and maintainer
  scripts differ. `build.sh` refuses any other tarball.
- **Emscripten 6.0.10**, `-O3`, single-threaded (`LIBRAW_NOTHREADS`, no pthreads): no cross-origin isolation, one
  plain ES module for Turbopack. Native WebAssembly exceptions, legacy encoding (Safari 15.2+). zlib (deflate DNG)
  and libjpeg 9f (lossy DNG) from Emscripten's ports, which check their own hashes.
- Not built: Sigma X3F (wrong colours, measured), DNG SDK (JPEG-XL DNG), RawSpeed, GoPro SDK.
- `glue.cpp` (ours): fixed development (camera white balance, camera matrix, sRGB primaries + sRGB tone curve, AHD,
  file orientation, full size, 8 bit) and the damaged-file guard (reads past the end of the file + 0x00/0xFF
  re-decode). LibRaw itself is unmodified.

Licence: LibRaw is used under the **CDDL-1.0** (one of its two licences, the other being LGPL-2.1). Its sources
are offered at `/wasm/libraw-LICENSE.txt`.

```
source ~/tools/emsdk/emsdk_env.sh      # emsdk 6.0.10
scripts/libraw-wasm/build.sh <folder holding LibRaw-0.22.2.tar.gz>
```

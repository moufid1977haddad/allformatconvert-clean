// OnlineConverTools glue around LibRaw (P22, 02/10). Compiled with LibRaw by build.sh into public/wasm/libraw.wasm.
// This file is ours (not part of LibRaw); LibRaw itself is used unmodified, under the CDDL-1.0.
//
// One RAW file at a time, single-threaded, no file system: the page hands the file's bytes, gets 8-bit sRGB pixels.
// Processing = what CloudConvert / dcraw_emu do by default, plus the camera's own white balance:
//   camera white balance (as shot), camera colour matrix, sRGB primaries and the sRGB tone curve, AHD demosaic,
//   orientation from the file applied, full resolution (no half size, no crop).
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include "libraw/libraw.h"

static LibRaw *lr = 0;
static libraw_processed_image_t *img = 0;
// info[]: width, height (as shown, orientation applied), raw width, raw height, flip, colors, and after lr_process
// the number of reads that went past the end of the file while decoding and the bytes they missed.
static int info[8];
static char make_model[160];

// LibRaw reports a read past the end of the file (a truncated or damaged file) through this callback and carries on
// with what it has: the image would come out partly wrong without a word. Any such report fails the file.
static int data_error = 0;
static void on_data_error(void *, const char *, const INT64) { data_error = 1; }
static void ignore_data_error(void *, const char *, const INT64) {}
static const unsigned char *src = 0;
static int src_size = 0;

// Most decoders do not report a short read at all: they decode zeros or stale bytes in place of the missing data
// (measured 02/10: ARW, ORF, RW2, 3FR, SRW, CR3 cut short all came out as an image). Some decoders also read ahead
// past the end of a COMPLETE file (Olympus 21 KB, Nikon D850 1 byte), so a read past the end proves nothing alone.
// Hence: the stream counts reads past the end while the RAW data is decoded; when there are any, the RAW data is
// decoded twice more with the missing bytes served as 0x00, then as 0xFF. Same result both times: the image does not
// depend on bytes that are not in the file (read-ahead). Different: the file is cut short or damaged.
class GuardedStream : public LibRaw_buffer_datastream {
public:
  GuardedStream(const void *b, size_t n) : LibRaw_buffer_datastream(b, n), total(n) {}
  int armed = 0;
  int fill = -1; // -1: a read past the end returns what is there (LibRaw's behaviour); 0..255: the rest is this byte
  long long past_calls = 0, past_bytes = 0;
  virtual int read(void *ptr, size_t sz, size_t nmemb) {
    size_t want = sz * nmemb, pos = (size_t)tell(), have = pos < total ? (want < total - pos ? want : total - pos) : 0;
    if (armed && have < want) {
      past_calls++; past_bytes += (long long)(want - have);
      if (fill >= 0) {
        if (have) LibRaw_buffer_datastream::read(ptr, 1, have);
        memset((char *)ptr + have, fill, want - have);
        return (int)nmemb;
      }
    }
    return LibRaw_buffer_datastream::read(ptr, sz, nmemb);
  }
  virtual int get_char() {
    if (armed && (size_t)tell() >= total) { past_calls++; past_bytes++; if (fill >= 0) return fill; }
    return LibRaw_buffer_datastream::get_char();
  }
private:
  size_t total;
};
static GuardedStream *stream = 0;

static void release() {
  if (img) { LibRaw::dcraw_clear_mem(img); img = 0; }
  if (lr) { delete lr; lr = 0; }
  if (stream) { delete stream; stream = 0; }
}

// The RAW data decoded with the bytes past the end of the file served as `fill`; 0 when that fails.
static unsigned long long raw_hash(int fill) {
  LibRaw *t = new LibRaw(0);
  GuardedStream *g = new GuardedStream(src, (size_t)src_size);
  g->fill = fill;
  t->set_dataerror_handler(ignore_data_error, 0);
  unsigned long long h = 0;
  if (t->open_datastream(g) == LIBRAW_SUCCESS) {
    g->armed = 1;
    if (t->unpack() == LIBRAW_SUCCESS && t->imgdata.rawdata.raw_alloc) {
      const unsigned char *p = (const unsigned char *)t->imgdata.rawdata.raw_alloc;
      size_t n = (size_t)t->imgdata.sizes.raw_pitch * t->imgdata.sizes.raw_height;
      h = 1469598103934665603ULL;
      for (size_t i = 0; i < n; i++) { h ^= p[i]; h *= 1099511628211ULL; }
      if (!h) h = 1;
    }
  }
  delete t; delete g;
  return h;
}

extern "C" {

// Opens the file and reads its header only (cheap): sizes are known before any decoding.
// Returns 0 or a LibRaw error code (negative).
int lr_open(const unsigned char *data, int size) {
  release();
  lr = new LibRaw(0);
  if (!lr) return LIBRAW_UNSUFFICIENT_MEMORY;
  data_error = 0;
  lr->set_dataerror_handler(on_data_error, 0);
  libraw_output_params_t &p = lr->imgdata.params;
  p.use_camera_wb = 1;     // white balance recorded by the camera
  p.use_camera_matrix = 1; // camera's own colour matrix when the file has one (DNG, ...)
  p.output_color = 1;      // sRGB
  p.output_bps = 8;
  p.gamm[0] = 1 / 2.4;     // the sRGB tone curve (dcraw's default is the BT.709 one, darker in the shadows on screen)
  p.gamm[1] = 12.92;
  p.half_size = 0;         // full resolution
  p.user_qual = 3;         // AHD
  p.user_flip = -1;        // orientation from the file
  src = data; src_size = size;
  stream = new GuardedStream(data, (size_t)size);
  int r = lr->open_datastream(stream);
  if (r != LIBRAW_SUCCESS) return r;
  if (data_error) return LIBRAW_DATA_ERROR;
  libraw_image_sizes_t &s = lr->imgdata.sizes;
  int swap = s.flip & 4;
  info[0] = swap ? s.height : s.width;
  info[1] = swap ? s.width : s.height;
  info[2] = s.raw_width;
  info[3] = s.raw_height;
  info[4] = s.flip;
  info[5] = lr->imgdata.idata.colors;
  info[6] = 0;
  info[7] = 0;
  snprintf(make_model, sizeof make_model, "%s %s", lr->imgdata.idata.make, lr->imgdata.idata.model);
  return 0;
}

int *lr_info() { return info; }
const char *lr_make_model() { return make_model; }
const char *lr_strerror(int code) { return libraw_strerror(code); }

// Decodes and develops the opened file. Returns 0 or a LibRaw error code.
// On success lr_pixels() points to width*height*3 bytes (RGB, 8 bit, orientation applied).
int lr_process() {
  if (!lr) return LIBRAW_OUT_OF_ORDER_CALL;
  stream->armed = 1;
  int r = lr->unpack();
  stream->armed = 0;
  info[6] = (int)(stream->past_calls > 2147483647LL ? 2147483647LL : stream->past_calls);
  info[7] = (int)(stream->past_bytes > 2147483647LL ? 2147483647LL : stream->past_bytes);
  if (r != LIBRAW_SUCCESS) return r;
  if (data_error) return LIBRAW_DATA_ERROR;
  if (stream->past_calls > 0) {
    unsigned long long a = raw_hash(0x00), b = raw_hash(0xFF);
    if (!a || a != b) return LIBRAW_DATA_ERROR;
  }
  r = lr->dcraw_process();
  if (r != LIBRAW_SUCCESS) return r;
  if (data_error) return LIBRAW_DATA_ERROR;
  int err = 0;
  img = lr->dcraw_make_mem_image(&err);
  if (!img) return err ? err : LIBRAW_UNSUFFICIENT_MEMORY;
  lr->recycle(); // the 16-bit working image is no longer needed: frees most of the memory before the copy
  if (img->type != LIBRAW_IMAGE_BITMAP || img->bits != 8 || (img->colors != 3 && img->colors != 1)) return LIBRAW_DATA_ERROR;
  info[0] = img->width;
  info[1] = img->height;
  info[5] = img->colors;
  return 0;
}

unsigned char *lr_pixels() { return img ? img->data : 0; }
void lr_close() { release(); }

}

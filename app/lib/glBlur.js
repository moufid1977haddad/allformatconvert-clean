// P17: Image Blur on the graphics processor, for browsers without ctx.filter (Safari, iPhone). The reference image
// editors blur on the GPU (Photopea, Pixlr: WebGL); the CPU version (canvasFilters.js) took 44 s at 12 MP on the
// owner's Mac. Same blur as the CPU one -- three box passes each way, premultiplied alpha, edges clamped -- in
// floating-point textures, so the two agree to within a colour level (scripts/browser-tests/blur-gpu.mjs).
// Strips of about two million pixels, each with gaussianBlurSupport() rows of real image above and below: the kept
// rows are those of the whole image, and GPU memory stays small (iPhone). Works in place (no second full-size copy). Returns false when the GPU path is not
// available (no WebGL2, no renderable float texture, image wider than the GPU allows, context lost): the caller
// then computes on the CPU -- same result, only slower.
import { boxSizes, gaussianBlurSupport } from './canvasFilters';

const STRIP_PIXELS = 2_000_000;
const VS = `#version 300 es
in vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;
// mode 0: premultiply the source bytes; 1: box pass on float texels; 2: box pass + un-premultiply for the output
const FS = `#version 300 es
precision highp float; precision highp int;
uniform highp sampler2D src; uniform int r; uniform ivec2 dir; uniform ivec2 size; uniform int mode;
out vec4 o;
vec4 texel(ivec2 q) { return texelFetch(src, clamp(q, ivec2(0), size - 1), 0); }
void main() {
  ivec2 q = ivec2(gl_FragCoord.xy);
  if (mode == 0) { vec4 c = texel(q); o = vec4(c.rgb * c.a, c.a); return; }
  vec4 s = vec4(0.0);
  for (int k = -r; k <= r; k++) s += texel(q + dir * k);
  s /= float(2 * r + 1);
  if (mode == 2) o = s.a > 0.0 ? vec4(s.rgb / s.a, s.a) : vec4(0.0); else o = s;
}`;

function setup(width) {
  const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(1, 1) : Object.assign(document.createElement('canvas'), { width: 1, height: 1 });
  const gl = canvas.getContext('webgl2', { antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
  if (!gl) return null;
  if (!gl.getExtension('EXT_color_buffer_float') && !gl.getExtension('EXT_color_buffer_half_float')) return null;
  if (width > gl.getParameter(gl.MAX_TEXTURE_SIZE)) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('blur shader: ' + gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('blur program: ' + gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(prog, n);
  return { gl, canvas, u: { src: u('src'), r: u('r'), dir: u('dir'), size: u('size'), mode: u('mode') } };
}

function texture(gl, internal, w, h, format, type, data) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, data || null);
  return t;
}

/** Blurs imageData in place on the GPU. @returns {boolean} false if the GPU path is not available here. */
export function applyGaussianBlurGL(imageData, sigma) {
  if (!(sigma > 0)) return true;
  const { width: w, height: h, data } = imageData;
  let ctx;
  try { ctx = setup(w); } catch { return false; }
  if (!ctx) return false;
  const { gl, u } = ctx;
  const radii = boxSizes(sigma).map((size) => (size - 1) / 2);
  const M = gaussianBlurSupport(sigma);
  const rowsPer = Math.max(1, Math.floor(STRIP_PIXELS / w), 4 * M);
  const maxRows = Math.min(h, rowsPer + 2 * M);
  // In place: before a strip's result is written, its last M original rows are kept -- the next strip's top margin.
  let saved = null;
  const pixelRows = new Uint8Array(w * rowsPer * 4);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1); gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  // float work textures (ping-pong) and the byte output, sized for the tallest strip
  const f = [texture(gl, gl.RGBA16F, w, maxRows, gl.RGBA, gl.HALF_FLOAT), texture(gl, gl.RGBA16F, w, maxRows, gl.RGBA, gl.HALF_FLOAT)];
  const outTex = texture(gl, gl.RGBA8, w, maxRows, gl.RGBA, gl.UNSIGNED_BYTE);
  const fbs = [...f, outTex].map((t) => { const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return fb; });
  for (const fb of fbs) { gl.bindFramebuffer(gl.FRAMEBUFFER, fb); if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return cleanup(false); }
  const srcTex = texture(gl, gl.RGBA8, w, maxRows, gl.RGBA, gl.UNSIGNED_BYTE);
  gl.activeTexture(gl.TEXTURE0); gl.uniform1i(u.src, 0);
  const draw = (tex, fb, rows, mode, r, dir) => {
    gl.bindTexture(gl.TEXTURE_2D, tex); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, w, rows);
    gl.uniform1i(u.mode, mode); gl.uniform1i(u.r, r); gl.uniform2i(u.dir, dir[0], dir[1]); gl.uniform2i(u.size, w, rows);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  function cleanup(ok) {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  }
  for (let y0 = 0; y0 < h; y0 += rowsPer) {
    const y1 = Math.min(h, y0 + rowsPer), top = Math.max(0, y0 - M), bottom = Math.min(h, y1 + M), rows = bottom - top;
    gl.bindTexture(gl.TEXTURE_2D, srcTex);
    const above = y0 - top; // original rows above the strip: already overwritten in data, kept in `saved`
    if (above) gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, above, gl.RGBA, gl.UNSIGNED_BYTE, saved.subarray(saved.length - above * w * 4));
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, above, w, rows - above, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(data.buffer, data.byteOffset + y0 * w * 4, (rows - above) * w * 4));
    draw(srcTex, fbs[0], rows, 0, 0, [0, 0]);
    let cur = 0;
    const passes = [...radii.map((r) => [r, [1, 0]]), ...radii.map((r) => [r, [0, 1]])];
    passes.forEach(([r, dir], i) => {
      const last = i === passes.length - 1;
      draw(f[cur], last ? fbs[2] : fbs[1 - cur], rows, last ? 2 : 1, r, dir);
      cur = 1 - cur;
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbs[2]);
    const keep = y1 - y0;
    gl.readPixels(0, y0 - top, w, keep, gl.RGBA, gl.UNSIGNED_BYTE, pixelRows.subarray(0, keep * w * 4));
    if (gl.isContextLost() || gl.getError() !== gl.NO_ERROR) {
      // Nothing written yet: the CPU can still do it all. Otherwise part of the image is already blurred in place:
      // say so rather than hand a half-done image to the CPU path.
      if (y0 === 0) return cleanup(false);
      cleanup(false);
      throw new Error('The graphics processor stopped during the blur. Please try again.');
    }
    if (y1 < h) saved = new Uint8Array(data.buffer, data.byteOffset + Math.max(y0, y1 - M) * w * 4, (y1 - Math.max(y0, y1 - M)) * w * 4).slice();
    data.set(pixelRows.subarray(0, keep * w * 4), y0 * w * 4);
  }
  return cleanup(true);
}

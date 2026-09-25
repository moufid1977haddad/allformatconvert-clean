# Second, independent objective measure for the native-Opus question (RAPPORT-licence-et-ameliorations.md §3c):
# Zimtohrli (Google, Apache-2.0; pip zimtohrli), a psychoacoustic model unrelated to ViSQOL's spectrogram
# similarity. Lower distance = closer to the source; MOS is its mapping to a 1-5 opinion score.
# Inputs: <dir> with refA.wav/refB.wav and the decoded outputs <ref>-native-<kb>.dec.wav / <ref>-libeq-<kb>.dec.wav
# (libeq = libopus at the same file size +-0.5 %), 48 kHz 16-bit stereo, as produced for the ViSQOL run.
# Usage: python opus-zimtohrli.py <dir>
import sys, wave, os
import numpy as np
import zimtohrli

def load(path):
    with wave.open(path, 'rb') as w:
        assert w.getframerate() == 48000 and w.getsampwidth() == 2, path
        x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float32) / 32768.0
        return x.reshape(-1, w.getnchannels())

z = zimtohrli.Pyohrli()
d = sys.argv[1]
print(f"{'clip':6} {'kb/s':>5} {'native dist':>12} {'libopus dist':>13} {'native MOS':>11} {'libopus MOS':>12}  closer to source")
for ref in ['refA', 'refB']:
    src = load(os.path.join(d, ref + '.wav'))
    for kb in ['64', '96', '128']:
        row = []
        for enc in ['native', 'libeq']:
            out = load(os.path.join(d, f'{ref}-{enc}-{kb}.dec.wav'))
            n = min(len(src), len(out))
            dist = float(np.mean([z.distance(src[:n, c], out[:n, c]) for c in range(src.shape[1])]))
            row.append((dist, zimtohrli.mos_from_zimtohrli(dist)))
        better = 'native' if row[0][0] < row[1][0] else 'libopus'
        print(f"{ref:6} {kb:>5} {row[0][0]:12.5f} {row[1][0]:13.5f} {row[0][1]:11.3f} {row[1][1]:12.3f}  {better}")

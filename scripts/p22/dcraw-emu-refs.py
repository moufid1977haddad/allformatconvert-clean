# P22 (02/10): reference images from LibRaw's own dcraw_emu 0.22.2 (official Win64 build, LibRaw-0.22.2-Win64.zip from
# libraw.org) with the site's development: camera white balance (-w), sRGB (-o 1), sRGB curve (-g 2.4 12.92), AHD (-q 3).
# Run inside a folder holding files/ (the RAW files), win64/ (the unzipped binaries) and emu/ (output).
import subprocess, os, shutil
E = os.path.abspath('win64/LibRaw-0.22.2/bin/dcraw_emu.exe')
for f in sorted(os.listdir('files')):
    if os.path.exists('emu/' + f + '.ppm'): continue
    shutil.copy('files/' + f, 'emu/' + f)
    r = subprocess.run([E, '-w', '-o', '1', '-g', '2.4', '12.92', '-q', '3', 'emu/' + f], capture_output=True, text=True)
    os.remove('emu/' + f)
    print(f, 'ok' if os.path.exists('emu/' + f + '.ppm') else 'EMU FAIL ' + (r.stdout + r.stderr)[-150:].replace('\n', ' '), flush=True)

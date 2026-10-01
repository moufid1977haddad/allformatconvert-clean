// P22 (02/10): the real camera RAW files of the RAW bench, from raw.pixls.us (public domain, CC0), one or more per
// make / format. Downloaded on demand into a cache folder, checked against the SHA-256 recorded in raw-reference.json.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const RAW_FILES = [
  'Canon/EOS 5D Mark III/5G4A9396.CR2',
  'Canon/EOS R6/Canon_EOS_R6_RAW_ISO_100_nocrop_nodual.CR3',
  'Canon/EOS R6/Canon_EOS_R6_CRAW_ISO_100_nocrop_nodual.CR3',
  'Canon/EOS 10D/CRW_7673.CRW',
  'Nikon/D750/lossless_compressed_14_bit.NEF',
  'Nikon/D850/Nikon-D850-14bit-compressed.NEF',
  'Nikon/Coolpix P7800/DSCN2039.NRW',
  'Sony/ILCE-7M3/_DSC0009.ARW',
  'Sony/DSC-R1/_DSC1477.SR2',
  'Sony/DSC-F828/DSC06227.SRF',
  'Fujifilm/X-T30 II/compressed_X-T30II.RAF',
  'Olympus/E-M1MarkII/Olympus_EM1mk2_Standard_20MP.ORF',
  'Panasonic/DMC-GH4/P1010607.RW2',
  'Leica/D-LUX 4/L1010119.RWL',
  'Pentax/K-70/IMGP6854.PEF',
  'Pentax/K-3 II/IMGP0668.DNG',
  'Samsung/NX500/SAM_2927.SRW',
  'Apple/iPhone 12 Pro/IMG_1361.DNG',
  'Apple/iPhone 8/RAW_2018_11_07_14_43_14_820_noflash.dng',
  'Hasselblad/CFV/RAW_HASSELBLAD_CFV.3FR',
  'Phase One/P20+/CF051545.IIQ',
  'Leaf/Aptus 22/L_003172.mos',
  'Mamiya/ZD/RAW_MAMIYA_ZD.MEF',
  'Epson/R-D1/_EPS0672.ERF',
  'Kodak/P880/100_3710.KDC',
  'Kodak/DCS Pro 14nx/D7465857.DCR',
  'Minolta/DiMAGE A2/PICT0881.MRW',
  'Sigma/SIGMA SD15/_SDI5651.X3F',
];

export const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

/** Path of the cached file (downloaded if missing). expectedSha: checked when given. */
export async function rawFile(rel, dir, expectedSha) {
  const out = path.join(dir, path.basename(rel));
  if (!fs.existsSync(out)) {
    fs.mkdirSync(dir, { recursive: true });
    const url = 'https://raw.pixls.us/data/' + rel.split('/').map(encodeURIComponent).join('/');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`download failed ${res.status} ${url}`);
    fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  }
  if (expectedSha && sha256(fs.readFileSync(out)) !== expectedSha) throw new Error(`${out}: not the file of the reference (SHA-256 differs)`);
  return out;
}

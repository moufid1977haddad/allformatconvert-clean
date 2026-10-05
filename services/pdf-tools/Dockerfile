# PDF Tools service: /v1/repair (qpdf + Ghostscript) and /v1/pdfa
# (Ghostscript + veraPDF validation). No PDF library does the real work here
# -- these are the actual CLI tools, invoked as child processes.
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      ghostscript \
      qpdf \
      poppler-utils \
      openjdk-17-jre-headless \
      curl \
      unzip \
      ca-certificates \
      python3 \
      python3-venv \
      fonts-urw-base35 \
    && rm -rf /var/lib/apt/lists/* \
    && pdftotext -v \
    && pdfunite -v \
    && pdftoppm -v \
    && pdfinfo -v \
    && prlimit --version

# P32: /v1/render-page draws pages with Poppler's pdftoppm (poppler-utils above). A PDF that does not embed its fonts
# (Helvetica, Times… the 14 standard fonts, as in the iPhone kit's pdf-avec-images.pdf) is drawn with the URW base-35
# metric clones (fonts-urw-base35, already Ghostscript's own fonts), found by fontconfig under the standard names.

# /v1/ocr-page (P33): Tesseract (Debian's tesseract-ocr 5.3, Apache-2.0) and one model per language PDF OCR offers
# (lib/ocrLanguageCodes.js -- 102 codes; Debian's tesseract-lang 4.1.0 models, Apache-2.0). Kept equal to the
# site's list by scripts/p33/ocr-languages.test.mjs; the service also reports what is installed on /health.
RUN apt-get update && apt-get install -y --no-install-recommends tesseract-ocr \
      tesseract-ocr-afr tesseract-ocr-sqi tesseract-ocr-amh tesseract-ocr-ara tesseract-ocr-asm \
      tesseract-ocr-aze tesseract-ocr-aze-cyrl tesseract-ocr-eus tesseract-ocr-bel tesseract-ocr-ben \
      tesseract-ocr-bos tesseract-ocr-bul tesseract-ocr-mya tesseract-ocr-cat tesseract-ocr-ceb \
      tesseract-ocr-khm tesseract-ocr-chr tesseract-ocr-chi-sim tesseract-ocr-chi-tra tesseract-ocr-hrv \
      tesseract-ocr-ces tesseract-ocr-dan tesseract-ocr-nld tesseract-ocr-dzo tesseract-ocr-eng \
      tesseract-ocr-enm tesseract-ocr-epo tesseract-ocr-est tesseract-ocr-fin tesseract-ocr-fra \
      tesseract-ocr-frm tesseract-ocr-glg tesseract-ocr-kat tesseract-ocr-kat-old tesseract-ocr-deu \
      tesseract-ocr-frk tesseract-ocr-grc tesseract-ocr-ell tesseract-ocr-guj tesseract-ocr-hat \
      tesseract-ocr-heb tesseract-ocr-hin tesseract-ocr-hun tesseract-ocr-isl tesseract-ocr-ind \
      tesseract-ocr-iku tesseract-ocr-gle tesseract-ocr-ita tesseract-ocr-ita-old tesseract-ocr-jpn \
      tesseract-ocr-jav tesseract-ocr-kan tesseract-ocr-kaz tesseract-ocr-kir tesseract-ocr-kor \
      tesseract-ocr-kmr tesseract-ocr-lao tesseract-ocr-lat tesseract-ocr-lav tesseract-ocr-lit \
      tesseract-ocr-mkd tesseract-ocr-msa tesseract-ocr-mal tesseract-ocr-mlt tesseract-ocr-mar \
      tesseract-ocr-nep tesseract-ocr-nor tesseract-ocr-ori tesseract-ocr-pan tesseract-ocr-fas \
      tesseract-ocr-pol tesseract-ocr-por tesseract-ocr-pus tesseract-ocr-ron tesseract-ocr-rus \
      tesseract-ocr-san tesseract-ocr-srp tesseract-ocr-srp-latn tesseract-ocr-sin tesseract-ocr-slk \
      tesseract-ocr-slv tesseract-ocr-spa tesseract-ocr-spa-old tesseract-ocr-swa tesseract-ocr-swe \
      tesseract-ocr-syr tesseract-ocr-fil tesseract-ocr-tgk tesseract-ocr-tam tesseract-ocr-tel \
      tesseract-ocr-tha tesseract-ocr-bod tesseract-ocr-tir tesseract-ocr-tur tesseract-ocr-uig \
      tesseract-ocr-ukr tesseract-ocr-urd tesseract-ocr-uzb tesseract-ocr-uzb-cyrl tesseract-ocr-vie \
      tesseract-ocr-cym tesseract-ocr-yid \
    && rm -rf /var/lib/apt/lists/* \
    && tesseract --version \
    && test "$(tesseract --list-langs 2>/dev/null | grep -vc -e '^List of' -e '^osd$')" -ge 102

# /v1/docx-to-doc (P26, E1): LibreOffice Writer without its GUI, Debian's own package (MPL-2.0), started per
# request by src/docConvert.js -- it writes the Word 97-2003 .doc that ConvertAPI cannot. From Debian's official
# backports (25.2, security-supported), not bookworm's 7.4: measured on a real ConvertAPI document, 7.4 wrote a
# section heading that LibreOffice then laid over the text, where 25-26 keep it in place. Only this package is taken
# from backports; Ghostscript, qpdf and the rest stay bookworm's.
RUN echo "deb http://deb.debian.org/debian bookworm-backports main" > /etc/apt/sources.list.d/bookworm-backports.list \
    && apt-get update && apt-get install -y --no-install-recommends -t bookworm-backports libreoffice-writer-nogui \
    && rm -rf /var/lib/apt/lists/* \
    && soffice --version

# /v1/compress: pikepdf + Adobe's tx (py/compress.py). Own virtualenv, pinned
# versions, prebuilt wheels only (no compiler in the image).
COPY py/requirements.txt /opt/pdfpy/requirements.txt
RUN python3 -m venv /opt/pdfpy \
    && /opt/pdfpy/bin/pip install --no-cache-dir --only-binary=:all: -r /opt/pdfpy/requirements.txt \
    && /opt/pdfpy/bin/tx -v

# veraPDF has no Debian package -- it ships as an IzPack installer jar from
# verapdf.org. Installed non-interactively with our pinned
# verapdf-auto-install.xml (installs only the CLI pack, to /opt/verapdf),
# per https://docs.verapdf.org/install/.
COPY verapdf-auto-install.xml /tmp/verapdf-auto-install.xml
RUN curl -fsSL -o /tmp/verapdf-installer.zip https://software.verapdf.org/releases/verapdf-installer.zip \
    && unzip -q /tmp/verapdf-installer.zip -d /tmp \
    && cd /tmp/verapdf-greenfield-* \
    && chmod +x verapdf-install \
    && ./verapdf-install /tmp/verapdf-auto-install.xml \
    && ln -s /opt/verapdf/verapdf /usr/local/bin/verapdf \
    && rm -rf /tmp/verapdf-installer.zip /tmp/verapdf-greenfield-*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY src ./src
COPY assets ./assets
COPY py ./py

ENV GS_BIN=gs
ENV QPDF_BIN=qpdf
ENV VERAPDF_BIN=verapdf
ENV PDFPY_BIN=/opt/pdfpy/bin/python
ENV SOFFICE_BIN=soffice
# P27: PDF/A text check (src/pdfa.js); poppler-utils above (GPL-2, used unmodified as a separate program)
ENV PDFTOTEXT_BIN=pdftotext
# tx must be found by py/compress.py (shutil.which)
ENV PATH=/opt/pdfpy/bin:$PATH
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080
CMD ["node", "src/server.js"]

# PDF Tools service: /v1/repair (qpdf + Ghostscript) and /v1/pdfa
# (Ghostscript + veraPDF validation). No PDF library does the real work here
# -- these are the actual CLI tools, invoked as child processes.
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      ghostscript \
      qpdf \
      openjdk-17-jre-headless \
      curl \
      unzip \
      ca-certificates \
      python3 \
      python3-venv \
    && rm -rf /var/lib/apt/lists/*

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
# tx must be found by py/compress.py (shutil.which)
ENV PATH=/opt/pdfpy/bin:$PATH
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080
CMD ["node", "src/server.js"]

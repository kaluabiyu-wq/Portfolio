#!/usr/bin/env sh
# Regenerates public/cv-preview.webp (the CV thumbnail shown in the CV section) from the PDF.
# Run it whenever you replace public/Kalu_Abiyu_CV1.pdf. Needs poppler-utils (pdftoppm) and ImageMagick or Python Pillow.
set -e
cd "$(dirname "$0")/.."
pdftoppm -r 130 -png -singlefile public/Kalu_Abiyu_CV_FullStack.pdf /tmp/cvprev
python3 -c "from PIL import Image; Image.open('/tmp/cvprev.png').convert('RGB').save('public/cv-preview.webp','WEBP',quality=88,method=6)"
echo "Wrote public/cv-preview.webp"

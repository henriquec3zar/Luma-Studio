# -*- coding: utf-8 -*-
"""Corrige encoding e scripts do frontend/index.html."""
import pathlib
import re

p = pathlib.Path(__file__).resolve().parents[2] / "frontend" / "index.html"
text = p.read_text(encoding="utf-8")

# Corrige padrões corrompidos de acentuação
text = re.sub(r"HOR.?.?RIO", "HORÁRIO", text)
text = re.sub(r"CAT.?.?LOGO", "CATÁLOGO", text)
text = text.replace("BASE DE CLIENTS", "BASE DE CLIENTES")

# Remove scripts antigos e injeta api.js + app.js
text = re.sub(
    r'<script[^>]*src=["\'][^"\']*app\.js["\'][^>]*>\s*</script>\s*',
    "",
    text,
    flags=re.I,
)
if "js/api.js" not in text:
    text = text.replace(
        "</body>",
        '    <script src="./js/api.js"></script>\n'
        '    <script src="./js/app.js"></script>\n'
        "  </body>",
    )

# Garante meta charset UTF-8
if 'charset="UTF-8"' not in text and "charset=UTF-8" not in text:
    text = text.replace("<head>", '<head>\n    <meta charset="UTF-8" />', 1)

p.write_text(text, encoding="utf-8", newline="\n")
print("OK:", p)
print("Has api.js:", "js/api.js" in text)
print("Has HORÁRIO:", "HORÁRIO" in text)
print("Has CATÁLOGO:", "CATÁLOGO" in text)

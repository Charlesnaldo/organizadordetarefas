# -*- coding: utf-8 -*-
from pathlib import Path
path = Path('src/components/ProtectedAppShell.tsx')
text = path.read_text()
old = 'label="InÃƒÆ’Ã†â€™Ãƒâ€\xa0Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­cio"'
if old not in text:
    raise SystemExit('pattern missing')
text = text.replace(old, 'label="Início"', 1)
text = text.replace('JÃ¡', 'Já')
path.write_text(text, encoding='utf-8')

# -*- coding: utf-8 -*-
from pathlib import Path
text = Path('src/components/ProtectedAppShell.tsx').read_text()
start = text.index('label="')
print(repr(text[start:start+30]))

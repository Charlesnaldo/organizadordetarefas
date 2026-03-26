# -*- coding: utf-8 -*-
from pathlib import Path
text = Path('src/components/ProtectedAppShell.tsx').read_text()
pos = text.index('label="')
print(repr(text[pos:pos+40]))

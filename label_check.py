# -*- coding: utf-8 -*-
from pathlib import Path
text = Path('src/components/ProtectedAppShell.tsx').read_text()
print('Início' in text)
print('label="Início"' in text)

# -*- coding: utf-8 -*-
from pathlib import Path
text = Path('src/components/ProtectedAppShell.tsx').read_text()
start = text.index('label="')
end = text.index('"', start + 7)
print(repr(text[start:end+1]))

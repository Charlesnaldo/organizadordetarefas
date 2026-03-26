from pathlib import Path
text = Path('src/components/ProtectedAppShell.tsx').read_text()
pos = text.index('NavLink href="/"')
print(text[pos:pos+60])

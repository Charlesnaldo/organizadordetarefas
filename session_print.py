from pathlib import Path
text = Path('src/components/ProtectedAppShell.tsx').read_text()
start = text.index('function SessionBadge')
end = text.index('\n}', start)
print(text[start:end+2])

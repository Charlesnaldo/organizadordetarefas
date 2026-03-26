from pathlib import Path
text = Path('src/components/ProtectedAppShell.tsx').read_text()
start = text.index('<section className="relative mx-auto flex flex-col gap-6"')
print('START SNIPPET:', repr(text[start:start+200]))
end = text.index('      </section>', start)
print('END SNIPPET:', repr(text[end-40:end+40]))
PY

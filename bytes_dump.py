from pathlib import Path
print(Path('src/components/ProtectedAppShell.tsx').read_bytes()[:4])

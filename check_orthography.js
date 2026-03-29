const fs = require('fs');
const path = require('path');

const checks = [
  {
    file: 'src/components/ProtectedAppShell.tsx',
    strings: ['variáveis públicas', 'Sessão', 'Início', 'Já tenho conta', 'sites úteis', 'único lugar']
  },
  {
    file: 'src/app/api/tasks/route.ts',
    strings: ['Quadro não encontrado.']
  },
  {
    file: 'README.md',
    strings: ['Autenticação', 'Múltiplos', 'usuário', 'Exclusão', 'Configuração']
  }
];

let hasError = false;

checks.forEach(check => {
  const filePath = path.join(process.cwd(), check.file);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${check.file}`);
    hasError = true;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  check.strings.forEach(str => {
    if (!content.includes(str)) {
      console.error(`[FAIL] ${check.file}: String "${str}" not found.`);
      hasError = true;
    } else {
      console.log(`[PASS] ${check.file}: String "${str}" found.`);
    }
  });
});

if (hasError) {
  process.exit(1);
} else {
  console.log('All orthography checks passed!');
}

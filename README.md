# Tudlist

Kanban com `Next.js`, `Tailwind CSS` e `Supabase`.

## Recursos

- Autenticação com Supabase Auth
- Múltiplos boards por usuário
- Cards com drag and drop
- Modal para criar e editar cards
- Upload de anexos
- Checklist e comentários por card
- Exclusão de card com ícone de lixeira

## Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- Supabase

## Configuração

1. Instale as dependências:

```bash
npm install
```

2. Crie o arquivo `.env.local` com base em `.env.example`:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

3. Execute o SQL em [`supabase/schema.sql`](./supabase/schema.sql) no Supabase.

4. Rode o projeto:

```bash
npm run dev
```

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

## Estrutura

- `src/app/page.tsx`: interface principal
- `src/app/api/boards`: API de boards
- `src/app/api/tasks`: API de tarefas
- `src/app/api/uploads`: upload local de arquivos
- `src/lib`: tipos, mapeadores e integração com Supabase
- `supabase/schema.sql`: schema do banco

## Publicacao no GitHub

Depois de criar um repositorio vazio no GitHub:

```bash
git add .
git commit -m "Initial Kanban app with Supabase"
git branch -M main
git remote add origin <URL_DO_REPOSITORIO>
git push -u origin main
```

# Diagnóstico Operandis

Scaffold inicial do sistema de diagnóstico de maturidade em Segurança do Trabalho, Saúde Ocupacional, Gestão de Riscos e Fatores Psicossociais.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · TailwindCSS · Supabase (Auth + Postgres + Storage) · React Hook Form · Zod · Recharts · Framer Motion.

## Como rodar

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Banco de dados

Projeto Supabase dedicado já criado e configurado: diagnostico-operandis (schema com RLS, questionário padrão semeado com as 10 categorias).

## O que já está implementado

- Landing page (`/`)
- Formulário de dados da empresa (`/questionario/empresa`)
- Fluxo do questionário por grupos (`/questionario/[diagnosticoId]/grupo/[numero]`)
- Revisão e envio, conclusão
- Login (`/login`) e proteção de `/admin` via middleware do Supabase Auth
- Dashboard, listagem de empresas e detalhe da empresa
- Schema completo do banco com RLS por papel (master/administrador/consultor/visualizador)

## Próximos passos sugeridos

- Painel de administração de perguntas/categorias (CRUD)
- Upload de anexos via Supabase Storage
- Geração de PDF do relatório com `@react-pdf/renderer`
- Gráficos Recharts no dashboard e relatórios
- Fase 2: diagnóstico executivo via IA

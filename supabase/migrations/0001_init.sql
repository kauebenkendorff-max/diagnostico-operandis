-- Diagnóstico Operandis — schema inicial
-- Extensões
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Enums
create type user_role as enum ('master', 'administrador', 'consultor', 'visualizador');
create type diagnostic_status as enum ('pendente', 'em_andamento', 'finalizado');
create type question_type as enum (
  'escolha_unica', 'multipla_escolha', 'escala', 'texto', 'texto_longo',
  'numero', 'data', 'upload', 'sim_nao', 'slider', 'matriz'
);
create type sesmt_status as enum ('sim', 'nao', 'terceirizado');

-- users (perfis; auth real fica em auth.users do Supabase Auth)
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4() references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  tipo user_role not null default 'visualizador',
  created_at timestamptz not null default now()
);

-- companies
create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  razao_social text not null,
  fantasia text,
  cnpj text not null unique,
  responsavel text,
  cargo text,
  telefone text,
  whatsapp text,
  email text,
  funcionarios integer,
  cidade text,
  estado text,
  segmento text,
  cnae text,
  possui_sesmt sesmt_status default 'nao',
  created_at timestamptz not null default now()
);

-- questionnaires
create table if not exists public.questionnaires (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  descricao text,
  status text not null default 'ativo',
  created_at timestamptz not null default now()
);

-- categories (grupos: SST, NR1, Ergonomia, Psicossociais, Saúde, ...)
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  questionnaire_id uuid not null references public.questionnaires(id) on delete cascade,
  nome text not null,
  ordem integer not null default 0
);

-- questions
create table if not exists public.questions (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references public.categories(id) on delete cascade,
  titulo text not null,
  descricao text,
  tipo question_type not null,
  obrigatoria boolean not null default true,
  ordem integer not null default 0
);

-- options (para escolha única / múltipla escolha / matriz)
create table if not exists public.options (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references public.questions(id) on delete cascade,
  texto text not null,
  valor text,
  ordem integer not null default 0
);

-- diagnostics (uma execução do questionário por empresa)
create table if not exists public.diagnostics (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  questionnaire_id uuid references public.questionnaires(id),
  user_id uuid references public.users(id),
  status diagnostic_status not null default 'pendente',
  inicio timestamptz default now(),
  fim timestamptz,
  score numeric(5,2)
);

-- answers
create table if not exists public.answers (
  id uuid primary key default uuid_generate_v4(),
  diagnostic_id uuid not null references public.diagnostics(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  option_id uuid references public.options(id),
  texto text,
  nota numeric(5,2),
  created_at timestamptz not null default now()
);

-- attachments (uploads em Supabase Storage; guarda apenas o path do arquivo)
create table if not exists public.attachments (
  id uuid primary key default uuid_generate_v4(),
  answer_id uuid not null references public.answers(id) on delete cascade,
  arquivo text not null,
  created_at timestamptz not null default now()
);

-- comments (comentários do consultor sobre uma resposta específica do diagnóstico)
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  diagnostic_id uuid not null references public.diagnostics(id) on delete cascade,
  question_id uuid references public.questions(id),
  comentario text not null,
  usuario uuid references public.users(id),
  prioridade text,
  responsavel uuid references public.users(id),
  prazo date,
  created_at timestamptz not null default now()
);

-- índices
create index if not exists idx_categories_questionnaire on public.categories(questionnaire_id);
create index if not exists idx_questions_category on public.questions(category_id);
create index if not exists idx_options_question on public.options(question_id);
create index if not exists idx_diagnostics_company on public.diagnostics(company_id);
create index if not exists idx_answers_diagnostic on public.answers(diagnostic_id);
create index if not exists idx_answers_question on public.answers(question_id);
create index if not exists idx_comments_diagnostic on public.comments(diagnostic_id);

-- Row Level Security
alter table public.users enable row level security;
alter table public.companies enable row level security;
alter table public.questionnaires enable row level security;
alter table public.categories enable row level security;
alter table public.questions enable row level security;
alter table public.options enable row level security;
alter table public.diagnostics enable row level security;
alter table public.answers enable row level security;
alter table public.attachments enable row level security;
alter table public.comments enable row level security;

-- Helper: papel do usuário autenticado
create or replace function public.current_user_role()
returns user_role
language sql stable
security definer
as $$
  select tipo from public.users where id = auth.uid();
$$;

-- Políticas: usuários autenticados internos (master/administrador/consultor/visualizador) leem tudo
create policy "internos leem tudo - companies" on public.companies
  for select using (auth.role() = 'authenticated');
create policy "internos leem tudo - questionnaires" on public.questionnaires
  for select using (auth.role() = 'authenticated');
create policy "internos leem tudo - categories" on public.categories
  for select using (auth.role() = 'authenticated');
create policy "internos leem tudo - questions" on public.questions
  for select using (auth.role() = 'authenticated');
create policy "internos leem tudo - options" on public.options
  for select using (auth.role() = 'authenticated');
create policy "internos leem tudo - diagnostics" on public.diagnostics
  for select using (auth.role() = 'authenticated');
create policy "internos leem tudo - answers" on public.answers
  for select using (auth.role() = 'authenticated');
create policy "internos leem tudo - comments" on public.comments
  for select using (auth.role() = 'authenticated');

-- Escrita restrita a master/administrador/consultor (não visualizador)
create policy "master/admin/consultor escrevem - questionnaires" on public.questionnaires
  for all using (public.current_user_role() in ('master','administrador','consultor'))
  with check (public.current_user_role() in ('master','administrador','consultor'));
create policy "master/admin/consultor escrevem - categories" on public.categories
  for all using (public.current_user_role() in ('master','administrador','consultor'))
  with check (public.current_user_role() in ('master','administrador','consultor'));
create policy "master/admin/consultor escrevem - questions" on public.questions
  for all using (public.current_user_role() in ('master','administrador','consultor'))
  with check (public.current_user_role() in ('master','administrador','consultor'));
create policy "master/admin/consultor escrevem - options" on public.options
  for all using (public.current_user_role() in ('master','administrador','consultor'))
  with check (public.current_user_role() in ('master','administrador','consultor'));
create policy "somente master exclui - questions" on public.questions
  for delete using (public.current_user_role() = 'master');

-- Diagnóstico e respostas: qualquer autenticado (ou anônimo via link público) pode inserir/atualizar o seu
create policy "publico insere companies" on public.companies
  for insert with check (true);
create policy "publico insere diagnostics" on public.diagnostics
  for insert with check (true);
create policy "publico atualiza proprio diagnostico" on public.diagnostics
  for update using (true);
create policy "publico insere answers" on public.answers
  for insert with check (true);
create policy "publico insere attachments" on public.attachments
  for insert with check (true);
create policy "internos leem attachments" on public.attachments
  for select using (auth.role() = 'authenticated');

create policy "internos comentam" on public.comments
  for insert with check (public.current_user_role() in ('master','administrador','consultor'));

-- users: cada um vê o próprio perfil; master vê todos
create policy "usuario ve proprio perfil" on public.users
  for select using (id = auth.uid() or public.current_user_role() = 'master');
create policy "master gerencia usuarios" on public.users
  for all using (public.current_user_role() = 'master')
  with check (public.current_user_role() = 'master');

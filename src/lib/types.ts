export type UserRole = "master" | "administrador" | "consultor" | "visualizador";
export type DiagnosticStatus = "pendente" | "em_andamento" | "finalizado";
export type SesmtStatus = "sim" | "nao" | "terceirizado";

export type QuestionType =
  | "escolha_unica"
  | "multipla_escolha"
  | "escala"
  | "texto"
  | "texto_longo"
  | "numero"
  | "data"
  | "upload"
  | "sim_nao"
  | "slider"
  | "matriz";

export interface Company {
  id: string;
  razao_social: string;
  fantasia: string | null;
  cnpj: string;
  responsavel: string | null;
  cargo: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  funcionarios: number | null;
  cidade: string | null;
  estado: string | null;
  segmento: string | null;
  cnae: string | null;
  possui_sesmt: SesmtStatus;
  created_at: string;
}

export interface Questionnaire {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  created_at: string;
}

export interface Category {
  id: string;
  questionnaire_id: string;
  nome: string;
  ordem: number;
}

export interface Question {
  id: string;
  category_id: string;
  titulo: string;
  descricao: string | null;
  tipo: QuestionType;
  obrigatoria: boolean;
  ordem: number;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  question_id: string;
  texto: string;
  valor: string | null;
  ordem: number;
}

export interface Diagnostic {
  id: string;
  company_id: string;
  questionnaire_id: string | null;
  user_id: string | null;
  status: DiagnosticStatus;
  inicio: string | null;
  fim: string | null;
  score: number | null;
}

export interface Answer {
  id: string;
  diagnostic_id: string;
  question_id: string;
  option_id: string | null;
  texto: string | null;
  nota: number | null;
  created_at: string;
}

export interface Comment {
  id: string;
  diagnostic_id: string;
  question_id: string | null;
  comentario: string;
  usuario: string | null;
  prioridade: string | null;
  responsavel: string | null;
  prazo: string | null;
  created_at: string;
}

// Grupos padrão do questionário (ordem de exibição)
export const QUESTIONNAIRE_GROUPS = [
  "Empresa",
  "SST",
  "NR1",
  "Ergonomia",
  "Psicossociais",
  "Saúde",
  "Treinamentos",
  "Documentação",
  "Cultura",
  "RH",
  "Liderança",
] as const;

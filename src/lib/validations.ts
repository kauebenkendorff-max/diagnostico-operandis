import { z } from "zod";

export const companySchema = z.object({
  razao_social: z.string().min(2, "Informe a razão social"),
  fantasia: z.string().optional(),
  cnpj: z
    .string()
    .min(14, "CNPJ inválido")
    .transform((v) => v.replace(/\D/g, "")),
  responsavel: z.string().min(2, "Informe o responsável"),
  cargo: z.string().optional(),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("Email inválido"),
  funcionarios: z.coerce.number().int().positive().optional(),
  cidade: z.string().min(2, "Informe a cidade"),
  estado: z.string().length(2, "Use a sigla do estado (ex: SP)"),
  segmento: z.string().optional(),
  cnae: z.string().optional(),
  possui_sesmt: z.enum(["sim", "nao", "terceirizado"]).default("nao"),
});

export type CompanyFormValues = z.infer<typeof companySchema>;

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const answerSchema = z.object({
  question_id: z.string().uuid(),
  option_id: z.string().uuid().optional(),
  texto: z.string().optional(),
  nota: z.coerce.number().optional(),
});

export type AnswerFormValues = z.infer<typeof answerSchema>;

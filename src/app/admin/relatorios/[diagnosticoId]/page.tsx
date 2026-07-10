import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Shield,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ClipboardList,
  Scale,
  Users,
  GraduationCap,
  ArrowRight,
  CalendarClock,
  BadgeCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BotaoPdf } from "@/components/botao-pdf";

// ============================================================
// Tipos locais
// ============================================================
type RespostaValor = { option_id: string | null; texto: string | null; nota: number | null };

type PerguntaFlat = {
  id: string;
  titulo: string;
  tipo: string;
  ordem: number;
  categoria: string;
  options: { id: string; texto: string }[];
};

type Polaridade = "positiva" | "risco";
type RegraEixo = { eixo: string; polaridade: Polaridade };

type Alerta = { severidade: "alta" | "media"; titulo: string; detalhe: string };

type PrioridadePorte = {
  tag: "Obrigatório" | "Recomendado";
  titulo: string;
  detalhe: string;
  oferta: string;
};

const EIXOS_ORDEM = [
  "Conformidade e Documentação",
  "Segurança Jurídica e Enquadramento",
  "Prevenção e Cultura de Segurança",
  "Exposição a Passivo Trabalhista",
];

// CSS de impressão (A4), capa e design do relatório. Injetado como estilo global.
const ESTILO_RELATORIO = `
.report-root { color-adjust: exact; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

/* Logo Operandis vetorial (sempre renderiza e sai nítida no PDF) */
.op-logo { display: inline-flex; align-items: center; gap: 12px; }
.op-logo-mark {
  width: 46px; height: 46px; border-radius: 14px;
  background: linear-gradient(140deg, hsl(217 85% 47%), hsl(213 78% 30%));
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 20px hsl(var(--primary) / 0.28);
}
.op-logo-word { font-size: 27px; font-weight: 800; letter-spacing: -0.02em; color: hsl(217 33% 17%); }

/* Capa */
.pdf-cover {
  position: relative; overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 20px;
  padding: 44px 40px 36px;
  background:
    radial-gradient(120% 90% at 90% -10%, hsl(199 89% 48% / 0.10), transparent 60%),
    linear-gradient(180deg, hsl(var(--secondary) / 0.55), transparent 70%);
}
.pdf-cover::before {
  content: ""; position: absolute; left: 0; top: 0; height: 6px; width: 100%;
  background: linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)));
}
.pdf-kicker { font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: hsl(var(--primary)); font-weight: 700; margin-top: 26px; }
.pdf-title { font-size: 32px; font-weight: 800; line-height: 1.12; letter-spacing: -0.02em; margin: 8px 0 6px; color: hsl(217 33% 17%); }
.pdf-subtitle { font-size: 14px; color: hsl(var(--muted-foreground)); max-width: 30rem; }

.pdf-verdict { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 22px; }
.pdf-chip {
  display: flex; align-items: baseline; gap: 8px;
  border: 1px solid hsl(var(--border)); border-radius: 12px;
  padding: 10px 14px; background: hsl(var(--card));
}
.pdf-chip b { font-size: 20px; font-weight: 800; }
.pdf-chip span { font-size: 12px; color: hsl(var(--muted-foreground)); }

.pdf-company { margin-top: 26px; padding-top: 20px; border-top: 1px solid hsl(var(--border)); }
.pdf-company strong { font-size: 18px; color: hsl(217 33% 17%); }
.pdf-cover-footer { margin-top: 20px; font-size: 11px; color: hsl(var(--muted-foreground)); }

/* Seções (padrão editorial de consultoria, sem cara de template) */
.report-section {
  border: 1px solid hsl(var(--border));
  border-radius: 18px;
  background: hsl(var(--card));
  padding: 24px 26px;
}
.section-head { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 18px; }
.section-num {
  flex: none; width: 32px; height: 32px; border-radius: 10px;
  background: hsl(var(--primary)); color: #fff;
  font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center;
}
.section-eyebrow { font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: hsl(var(--muted-foreground)); font-weight: 600; margin-bottom: 2px; }
.section-title { font-size: 19px; font-weight: 700; line-height: 1.2; color: hsl(217 33% 17%); }

/* CTA final */
.cta {
  border-radius: 18px; padding: 30px 28px; color: #fff;
  background:
    radial-gradient(90% 120% at 100% 0%, hsl(199 89% 52% / 0.55), transparent 55%),
    linear-gradient(135deg, hsl(213 78% 32%), hsl(217 60% 22%));
}
.cta h3 { font-size: 22px; font-weight: 800; letter-spacing: -0.01em; }

@media print {
  @page { size: A4; margin: 13mm; }
  .no-print { display: none !important; }
  body { background: #fff; }
  .report-root { max-width: 100% !important; }
  .report-section, .pdf-cover, .cta { break-inside: avoid; page-break-inside: avoid; box-shadow: none !important; }
  .pdf-cover { break-after: page; page-break-after: always; }
}
`;

// ============================================================
// Utilidades
// ============================================================
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function formatarDataHora(data: string | null): string {
  if (!data) return "-";
  const d = new Date(data);
  const dataFormatada = d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const horaFormatada = d.toLocaleTimeString("pt-BR");
  const capitalizado = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
  return `${capitalizado} às ${horaFormatada}`;
}

function classificarPergunta(titulo: string): RegraEixo | null {
  const t = normalizar(titulo);

  if (t.includes("assistencia tecnica") && t.includes("pericia"))
    return { eixo: "Exposição a Passivo Trabalhista", polaridade: "positiva" };
  if (t.includes("processo trabalhista"))
    return { eixo: "Exposição a Passivo Trabalhista", polaridade: "risco" };

  if (t.includes("documentacao"))
    return { eixo: "Conformidade e Documentação", polaridade: "positiva" };
  if (t.includes("notificacao") || t.includes("autuacao") || t.includes("multa"))
    return { eixo: "Conformidade e Documentação", polaridade: "risco" };

  if (t.includes("seguro quanto aos impactos"))
    return { eixo: "Segurança Jurídica e Enquadramento", polaridade: "positiva" };
  if (t.includes("insalubridade e periculosidade"))
    return { eixo: "Segurança Jurídica e Enquadramento", polaridade: "positiva" };
  if (t.includes("insalubridade e atividade especial"))
    return { eixo: "Segurança Jurídica e Enquadramento", polaridade: "positiva" };

  if (t.includes("prevencao de acidentes"))
    return { eixo: "Prevenção e Cultura de Segurança", polaridade: "positiva" };
  if (t.includes("integracao de novos colaboradores"))
    return { eixo: "Prevenção e Cultura de Segurança", polaridade: "positiva" };
  if (t.includes("reduziram acidentes"))
    return { eixo: "Prevenção e Cultura de Segurança", polaridade: "positiva" };
  if (t.includes("lideranca esta treinada"))
    return { eixo: "Prevenção e Cultura de Segurança", polaridade: "positiva" };

  return null;
}

function faixaDoIndice(indice: number): { rotulo: string; cor: string; anel: string } {
  if (indice >= 80) return { rotulo: "Consolidado", cor: "text-emerald-600", anel: "#059669" };
  if (indice >= 60) return { rotulo: "Em evolução", cor: "text-teal-600", anel: "#0d9488" };
  if (indice >= 40) return { rotulo: "Em atenção", cor: "text-amber-600", anel: "#d97706" };
  return { rotulo: "Crítico", cor: "text-rose-600", anel: "#e11d48" };
}

function corBarra(pct: number): string {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 60) return "bg-teal-500";
  if (pct >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

function formatarResposta(
  tipo: string,
  resposta: RespostaValor | undefined,
  opcoesPorId: Map<string, string>
): string | null {
  if (!resposta) return null;
  if (tipo === "escolha_unica" && resposta.option_id) {
    return opcoesPorId.get(resposta.option_id) ?? resposta.option_id;
  }
  if (tipo === "multipla_escolha" && resposta.texto) {
    return resposta.texto
      .split(",")
      .filter(Boolean)
      .map((id) => opcoesPorId.get(id) ?? id)
      .join(", ");
  }
  if ((tipo === "escala" || tipo === "slider") && resposta.nota !== null) {
    return tipo === "slider" ? `${resposta.nota} / 10` : `${resposta.nota} / 5`;
  }
  if (resposta.texto) return resposta.texto;
  return null;
}

// Prioridades obrigatórias e recomendadas conforme o número de colaboradores.
// Base legal de referência: NR-1 (integração e riscos psicossociais), NR-5 (CIPA)
// e NR-4 (SESMT). O dimensionamento exato de CIPA e SESMT também depende do grau
// de risco (CNAE) da atividade.
function prioridadesPorPorte(funcionarios: number | null): {
  porte: string;
  faixa: string;
  itens: PrioridadePorte[];
} {
  const n = funcionarios ?? 0;

  const integracao: PrioridadePorte = {
    tag: "Obrigatório",
    titulo: "Integração e treinamento admissional",
    detalhe:
      "Todo colaborador admitido precisa de integração de segurança e ordem de serviço antes de iniciar as atividades. É o item mais cobrado em fiscalização e o mais fácil de comprovar.",
    oferta: "Treinamento de integração Operandis",
  };
  const palestraNr1: PrioridadePorte = {
    tag: "Recomendado",
    titulo: "Palestra de sensibilização NR-1",
    detalhe:
      "A NR-1 passou a exigir a gestão de riscos psicossociais e saúde mental. Uma palestra alinha a equipe, engaja a liderança e reduz afastamentos.",
    oferta: "Palestra NR-1 e saúde mental",
  };
  const designadoCipa: PrioridadePorte = {
    tag: "Recomendado",
    titulo: "Responsável capacitado pela CIPA",
    detalhe:
      "Empresas com até 19 colaboradores não formam comissão de CIPA, mas devem designar e capacitar um responsável pela pauta de prevenção.",
    oferta: "Capacitação de designado CIPA",
  };
  const dds: PrioridadePorte = {
    tag: "Recomendado",
    titulo: "Rotina de prevenção (DDS)",
    detalhe:
      "Diálogos periódicos de segurança criam cultura de prevenção com baixo custo e sustentam a defesa da empresa em caso de acidente.",
    oferta: "Programa de cultura de segurança",
  };
  const lideranca: PrioridadePorte = {
    tag: "Recomendado",
    titulo: "Treinamento de liderança",
    detalhe:
      "Líderes despreparados são o elo mais frágil da prevenção. Capacitar a liderança reduz acidentes e fortalece a defesa técnica.",
    oferta: "Capacitação de lideranças",
  };
  const cipa: PrioridadePorte = {
    tag: "Obrigatório",
    titulo: "CIPA e treinamento de cipeiros (NR-5)",
    detalhe:
      "A partir de 20 colaboradores, conforme o CNAE, a constituição da CIPA e o treinamento dos membros eleitos passam a ser obrigatórios.",
    oferta: "Treinamento de CIPA",
  };
  const sipat: PrioridadePorte = {
    tag: "Obrigatório",
    titulo: "SIPAT anual",
    detalhe:
      "A Semana Interna de Prevenção de Acidentes é obrigatória onde há CIPA e é uma das ações de maior impacto na cultura de segurança.",
    oferta: "Organização de SIPAT",
  };
  const psicossocial: PrioridadePorte = {
    tag: "Recomendado",
    titulo: "Gestão de riscos psicossociais (NR-1)",
    detalhe:
      "Com o time maior, o mapeamento e o plano de ação para saúde mental deixam de ser opcionais e passam a ser fiscalizáveis.",
    oferta: "Consultoria NR-1",
  };
  const trilha: PrioridadePorte = {
    tag: "Recomendado",
    titulo: "Trilha de treinamentos por função",
    detalhe:
      "Cada função exige NRs específicas. Uma trilha estruturada evita lacunas de treinamento que viram passivo em perícia.",
    oferta: "Trilha de treinamentos de NR",
  };
  const sesmt: PrioridadePorte = {
    tag: "Obrigatório",
    titulo: "Avaliar necessidade de SESMT (NR-4)",
    detalhe:
      "A partir de 50 colaboradores, dependendo do grau de risco, pode ser exigido Serviço Especializado em Segurança e Medicina do Trabalho.",
    oferta: "Estruturação de SESMT",
  };
  const indicadores: PrioridadePorte = {
    tag: "Recomendado",
    titulo: "Indicadores de SST e auditoria interna",
    detalhe:
      "Nesse porte, gerir a segurança por indicadores e auditar a conformidade periodicamente protege a empresa e reduz custo previdenciário.",
    oferta: "Gestão de indicadores e auditoria",
  };

  if (n <= 9) {
    return {
      porte: "Microempresa",
      faixa: "até 9 colaboradores",
      itens: [integracao, designadoCipa, palestraNr1, dds],
    };
  }
  if (n <= 19) {
    return {
      porte: "Empresa de pequeno porte",
      faixa: "10 a 19 colaboradores",
      itens: [integracao, designadoCipa, sipat, lideranca, palestraNr1],
    };
  }
  if (n <= 49) {
    return {
      porte: "Empresa de médio porte",
      faixa: "20 a 49 colaboradores",
      itens: [cipa, sipat, integracao, psicossocial, trilha, lideranca],
    };
  }
  if (n <= 99) {
    return {
      porte: "Empresa de médio-grande porte",
      faixa: "50 a 99 colaboradores",
      itens: [cipa, sesmt, sipat, psicossocial, trilha, indicadores],
    };
  }
  return {
    porte: "Empresa de grande porte",
    faixa: "100 ou mais colaboradores",
    itens: [sesmt, cipa, sipat, indicadores, psicossocial, lideranca],
  };
}

// ============================================================
// Logo Operandis (vetorial)
// ============================================================
function LogoOperandis() {
  return (
    <div className="op-logo">
      <span className="op-logo-mark">
        <Shield className="h-6 w-6 text-white" strokeWidth={2.2} />
      </span>
      <span className="op-logo-word">Operandis</span>
    </div>
  );
}

// ============================================================
// Pagina
// ============================================================
export default async function RelatorioDiagnosticoPage({
  params,
}: {
  params: Promise<{ diagnosticoId: string }>;
}) {
  const { diagnosticoId } = await params;
  const supabase = await createClient();

  const { data: diagnostico } = await supabase
    .from("diagnostics")
    .select(
      "id, status, inicio, fim, score, company:companies(id, razao_social, fantasia, cnpj, cidade, estado, segmento, responsavel, email, telefone, funcionarios)"
    )
    .eq("id", diagnosticoId)
    .single();

  if (!diagnostico) notFound();

  const empresa = Array.isArray(diagnostico.company)
    ? diagnostico.company[0]
    : diagnostico.company;

  const { data: categorias } = await supabase
    .from("categories")
    .select("id, nome, ordem, questions(id, titulo, tipo, ordem, options(id, texto))")
    .order("ordem", { ascending: true });

  const { data: respostas } = await supabase
    .from("answers")
    .select("question_id, option_id, texto, nota")
    .eq("diagnostic_id", diagnosticoId);

  const respostasPorPergunta = new Map<string, RespostaValor>(
    (respostas ?? []).map((r) => [r.question_id, r])
  );

  // ---- Achata perguntas ----
  const perguntasFlat: PerguntaFlat[] = [];
  for (const categoria of categorias ?? []) {
    for (const q of categoria.questions ?? []) {
      perguntasFlat.push({
        id: q.id,
        titulo: q.titulo,
        tipo: q.tipo,
        ordem: q.ordem,
        categoria: categoria.nome,
        options: (q.options ?? []).map((o: { id: string; texto: string }) => ({
          id: o.id,
          texto: o.texto,
        })),
      });
    }
  }

  const acharResposta = (kw: string): string => {
    const p = perguntasFlat.find((x) => normalizar(x.titulo).includes(kw));
    if (!p) return "";
    return (respostasPorPergunta.get(p.id)?.texto ?? "").trim();
  };

  // ---- Calculo do indice e dos eixos ----
  const eixosMapa = new Map<string, { fav: number; desf: number }>();
  let favTotal = 0;
  let desfTotal = 0;

  for (const p of perguntasFlat) {
    if (p.tipo !== "sim_nao") continue;
    const regra = classificarPergunta(p.titulo);
    if (!regra) continue;
    const valor = (respostasPorPergunta.get(p.id)?.texto ?? "").trim();
    if (valor !== "Sim" && valor !== "Não") continue;

    const favoravel =
      (regra.polaridade === "positiva" && valor === "Sim") ||
      (regra.polaridade === "risco" && valor === "Não");

    const atual = eixosMapa.get(regra.eixo) ?? { fav: 0, desf: 0 };
    if (favoravel) {
      atual.fav += 1;
      favTotal += 1;
    } else {
      atual.desf += 1;
      desfTotal += 1;
    }
    eixosMapa.set(regra.eixo, atual);
  }

  const totalAvaliado = favTotal + desfTotal;
  const indice = totalAvaliado > 0 ? Math.round((favTotal / totalAvaliado) * 100) : 0;
  const faixa = faixaDoIndice(indice);

  const eixos = EIXOS_ORDEM.filter((nome) => eixosMapa.has(nome)).map((nome) => {
    const d = eixosMapa.get(nome)!;
    const total = d.fav + d.desf;
    const pct = total > 0 ? Math.round((d.fav / total) * 100) : 0;
    return { nome, pct, fav: d.fav, total };
  });

  // ---- Alertas prioritarios ----
  const alertas: Alerta[] = [];

  if (acharResposta("notificacao") === "Sim") {
    alertas.push({
      severidade: "alta",
      titulo: "Empresa já sofreu notificação, autuação ou multa em SST",
      detalhe:
        "Há histórico de fiscalização com autuação. Isso indica passivo aberto e risco de reincidência sem um plano de regularização documentado.",
    });
  }
  const processo = acharResposta("processo trabalhista");
  const assistencia = acharResposta("assistencia tecnica");
  if (processo === "Sim" && assistencia !== "Sim") {
    alertas.push({
      severidade: "alta",
      titulo: "Passivo trabalhista sem assistência técnica na perícia",
      detalhe:
        "A empresa já respondeu a processo trabalhista e declarou não ter tido assistência técnica pericial. Perícias sem laudo de contraprova costumam elevar o valor das condenações.",
    });
  } else if (processo === "Sim") {
    alertas.push({
      severidade: "media",
      titulo: "Histórico de processo trabalhista",
      detalhe:
        "Existe histórico de ação trabalhista. Mesmo com assistência técnica, vale mapear a causa raiz para evitar recorrência.",
    });
  }
  if (acharResposta("documentacao") === "Não") {
    alertas.push({
      severidade: "alta",
      titulo: "Documentação de Medicina do Trabalho não está comprovadamente em dia",
      detalhe:
        "A documentação de Medicina do Trabalho é a primeira linha de defesa em uma autuação ou ação trabalhista. Documentação vencida ou incompleta é o achado mais comum em fiscalizações.",
    });
  }
  if (acharResposta("seguro quanto aos impactos") === "Não") {
    alertas.push({
      severidade: "media",
      titulo: "Insegurança quanto aos impactos legais da Medicina do Trabalho",
      detalhe:
        "O responsável declarou não se sentir seguro sobre as implicações legais. Isso sinaliza necessidade de orientação técnica próxima e recorrente.",
    });
  }
  if (
    acharResposta("paga insalubridade") === "Sim" &&
    acharResposta("insalubridade e periculosidade") === "Não"
  ) {
    alertas.push({
      severidade: "media",
      titulo: "Paga adicionais sem domínio técnico do enquadramento",
      detalhe:
        "A empresa paga insalubridade ou periculosidade, mas declarou não conhecer a diferença entre os enquadramentos. Pagamento indevido gera custo desnecessário; pagamento a menor gera passivo.",
    });
  }
  if (acharResposta("vulneravel") === "Não") {
    alertas.push({
      severidade: "media",
      titulo: "Possível vulnerabilidade não avaliada em adicionais",
      detalhe:
        "A empresa não paga adicionais e declarou não ter certeza de que está protegida. Sem laudo técnico, a ausência de pagamento pode virar passivo em perícia.",
    });
  }
  if (acharResposta("lideranca esta treinada") === "Não") {
    alertas.push({
      severidade: "media",
      titulo: "Liderança não treinada em Medicina do Trabalho",
      detalhe:
        "Líderes despreparados são o elo mais frágil da prevenção. Treinar a liderança reduz acidentes e fortalece a defesa em eventual ação.",
    });
  }

  const alertasAltos = alertas.filter((a) => a.severidade === "alta").length;
  const nivelRisco =
    alertasAltos > 0 || indice < 40 ? "Alto" : indice < 60 || alertas.length > 0 ? "Médio" : "Baixo";
  const corRisco =
    nivelRisco === "Alto"
      ? "text-rose-600"
      : nivelRisco === "Médio"
      ? "text-amber-600"
      : "text-emerald-600";

  // ---- Resumo executivo automatico ----
  const eixosFortes = eixos.filter((e) => e.pct >= 70).map((e) => e.nome);
  const eixosFracos = eixos.filter((e) => e.pct < 50).map((e) => e.nome);
  const nomeEmpresa = empresa?.fantasia || empresa?.razao_social || "A empresa";

  const partesResumo: string[] = [];
  partesResumo.push(
    `${nomeEmpresa} alcançou um Índice de Maturidade em Medicina do Trabalho de ${indice} de 100, classificado como ${faixa.rotulo.toLowerCase()}.`
  );
  if (eixosFortes.length > 0) {
    partesResumo.push(`Apresenta bom desempenho em ${eixosFortes.join(", ")}.`);
  }
  if (eixosFracos.length > 0) {
    partesResumo.push(
      `Os principais pontos de atenção estão em ${eixosFracos.join(", ")}, que exigem ação estruturada.`
    );
  }
  if (alertasAltos > 0) {
    partesResumo.push(
      `Foram identificados ${alertasAltos} alerta(s) de severidade alta, com potencial de gerar passivo relevante se não tratados.`
    );
  } else if (alertas.length > 0) {
    partesResumo.push(
      `Não há alertas críticos, mas existem ${alertas.length} ponto(s) de atenção a acompanhar.`
    );
  } else {
    partesResumo.push(
      "Não foram identificados alertas relevantes neste ciclo, o que indica uma gestão madura de Medicina do Trabalho."
    );
  }
  const resumoExecutivo = partesResumo.join(" ");

  // ---- Plano de acao ----
  const acoes30: string[] = [];
  const acoes60: string[] = [];
  const acoes90: string[] = [];

  if (acharResposta("documentacao") === "Não") {
    acoes30.push(
      "Levantar toda a documentação de Medicina do Trabalho vigente e listar o que está vencido ou ausente."
    );
    acoes60.push("Regularizar a documentação pendente e definir um calendário de renovação.");
  }
  if (alertasAltos > 0 || processo === "Sim") {
    acoes30.push(
      "Levantar o histórico de autuações e ações trabalhistas e mapear a causa raiz de cada uma."
    );
    acoes90.push(
      "Estruturar defesa técnica com laudos periciais para blindar a empresa em futuras ações."
    );
  }
  if (acharResposta("lideranca esta treinada") === "Não") {
    acoes60.push("Realizar treinamento de liderança em Medicina do Trabalho e responsabilidades legais.");
  }
  if (acharResposta("prevencao de acidentes") === "Não") {
    acoes90.push("Implantar programa contínuo de prevenção de acidentes e doenças ocupacionais.");
  }
  if (acoes30.length === 0)
    acoes30.push("Consolidar o inventário de riscos e validar os controles já existentes.");
  if (acoes60.length === 0)
    acoes60.push("Estruturar a gestão de riscos psicossociais exigida pela NR-1 (saúde mental).");
  if (acoes90.length === 0)
    acoes90.push("Definir indicadores de SST e uma rotina de revisão trimestral com a liderança.");

  // ---- Recomendacoes Operandis ----
  const recomendacoes: string[] = [];
  if (acharResposta("documentacao") === "Não")
    recomendacoes.push("Auditoria da documentação de Medicina do Trabalho com plano de regularização.");
  if (processo === "Sim" || alertasAltos > 0)
    recomendacoes.push("Assessoria técnica pericial e apoio em defesa de ações trabalhistas.");
  if (
    acharResposta("insalubridade e periculosidade") === "Não" ||
    acharResposta("insalubridade e atividade especial") === "Não"
  )
    recomendacoes.push("Revisão de enquadramento de insalubridade e periculosidade por laudo técnico.");
  if (acharResposta("lideranca esta treinada") === "Não")
    recomendacoes.push("Capacitação de lideranças e trilha de treinamentos de NR.");
  recomendacoes.push("Gestão de riscos psicossociais e saúde mental conforme a NR-1.");

  // ---- Prioridades por porte (KPIs) ----
  const porte = prioridadesPorPorte(empresa?.funcionarios ?? null);

  // ---- Pesquisa nacional (fontes: TST, CNJ, Observatorio SST MPT/OIT, 2024) ----
  const panorama = [
    {
      valor: "2,1 mi",
      titulo: "novas ações trabalhistas em 2024",
      detalhe: "Alta de 14,1% sobre 2023 e o maior volume desde a reforma de 2017. Fonte: TST.",
    },
    {
      valor: "R$ 50 bi",
      titulo: "pagos em condenações e acordos em 2024",
      detalhe: "Insalubridade e verbas rescisórias estão entre as causas mais frequentes. Fonte: CNJ.",
    },
    {
      valor: "20,6%",
      titulo: "das novas ações são da indústria",
      detalhe: "A indústria é o 2º setor mais processado do país, à frente do comércio. Fonte: CNJ.",
    },
    {
      valor: "742 mil",
      titulo: "acidentes de trabalho notificados em 2024",
      detalhe: "Uma morte a cada 3,5 horas no trabalho formal. Fonte: Observatório SST (MPT/OIT).",
    },
    {
      valor: "R$ 173 bi",
      titulo: "em benefícios acidentários do INSS desde 2012",
      detalhe: "Custo previdenciário direto de acidentes e doenças ocupacionais. Fonte: Observatório SST.",
    },
    {
      valor: "+134%",
      titulo: "afastamentos por saúde mental (2022 a 2024)",
      detalhe: "A NR-1 passou a exigir a avaliação de riscos psicossociais. Fonte: OIT.",
    },
  ];

  const circ = 2 * Math.PI * 52;
  const dash = (indice / 100) * circ;

  return (
    <div className="report-root space-y-6 max-w-3xl mx-auto pb-16">
      <style dangerouslySetInnerHTML={{ __html: ESTILO_RELATORIO }} />

      {/* Barra de acoes (nao sai no PDF) */}
      <div className="no-print flex items-center justify-between">
        <Link
          href="/admin/relatorios"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Respostas do Diagnóstico
        </Link>
        <BotaoPdf />
      </div>

      {/* Capa (pagina 1 do PDF) */}
      <section className="pdf-cover">
        <LogoOperandis />
        <p className="pdf-kicker">Relatório de Diagnóstico</p>
        <h1 className="pdf-title">Maturidade e Risco em Medicina do Trabalho</h1>
        <p className="pdf-subtitle">
          Uma leitura técnica e independente da sua exposição legal, do seu passivo em potencial e do
          caminho para blindar a empresa. Por Operandis Consultoria em Segurança e Saúde do Trabalho.
        </p>

        <div className="pdf-verdict">
          <div className="pdf-chip">
            <b className={faixa.cor}>{indice}</b>
            <span>
              de 100
              <br />
              Índice de maturidade
            </span>
          </div>
          <div className="pdf-chip">
            <b className={corRisco}>{nivelRisco}</b>
            <span>
              Nível de
              <br />
              risco atual
            </span>
          </div>
          <div className="pdf-chip">
            <b className="text-foreground">{faixa.rotulo}</b>
            <span>
              Estágio da
              <br />
              gestão
            </span>
          </div>
        </div>

        <div className="pdf-company">
          <strong>{empresa?.fantasia || empresa?.razao_social}</strong>
          <div className="text-muted-foreground text-sm mt-1">
            {empresa?.cnpj ? `CNPJ ${empresa.cnpj}` : ""}
            {empresa?.cidade ? ` · ${empresa.cidade}/${empresa.estado}` : ""}
            {empresa?.funcionarios ? ` · ${empresa.funcionarios} colaboradores` : ""}
          </div>
          <div className="text-muted-foreground text-sm">
            {empresa?.responsavel ? `Responsável: ${empresa.responsavel}` : ""}
          </div>
          <div className="text-muted-foreground text-sm mt-1">
            {formatarDataHora(diagnostico.fim ?? diagnostico.inicio)}
          </div>
        </div>
        <p className="pdf-cover-footer">
          Documento confidencial · Uso exclusivo da empresa diagnosticada e da Operandis
        </p>
      </section>

      {/* 01 - Indice geral + KPIs */}
      <section className="report-section">
        <div className="section-head">
          <span className="section-num">01</span>
          <div>
            <p className="section-eyebrow">Resultado geral</p>
            <h2 className="section-title">Índice de Maturidade em Medicina do Trabalho</h2>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <svg width="150" height="150" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="52" fill="none" stroke="#e5e7eb" strokeWidth="14" />
              <circle
                cx="70"
                cy="70"
                r="52"
                fill="none"
                stroke={faixa.anel}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
                transform="rotate(-90 70 70)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${faixa.cor}`}>{indice}</span>
              <span className="text-xs text-muted-foreground">de 100</span>
            </div>
          </div>
          <div className="flex-1 w-full grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-border p-3">
              <p className={`text-lg font-bold ${faixa.cor}`}>{faixa.rotulo}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Classificação</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className={`text-lg font-bold ${corRisco}`}>{nivelRisco}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Nível de risco</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-lg font-bold text-foreground">
                {favTotal}/{totalAvaliado}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Sinais favoráveis</p>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mt-5 border-t border-border pt-4">
          O índice traduz, em uma única nota, o quanto a empresa está protegida hoje. Quanto mais
          baixo, maior a chance de uma autuação ou ação trabalhista encontrar a empresa despreparada.
        </p>
      </section>

      {/* 02 - Resumo executivo */}
      <section className="report-section">
        <div className="section-head">
          <span className="section-num">02</span>
          <div>
            <p className="section-eyebrow">Leitura da consultoria</p>
            <h2 className="section-title">Resumo Executivo</h2>
          </div>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{resumoExecutivo}</p>
      </section>

      {/* 03 - Desempenho por eixo */}
      {eixos.length > 0 && (
        <section className="report-section">
          <div className="section-head">
            <span className="section-num">03</span>
            <div>
              <p className="section-eyebrow">Onde você está forte e frágil</p>
              <h2 className="section-title">Desempenho por Eixo</h2>
            </div>
          </div>
          <div className="space-y-4">
            {eixos.map((e) => (
              <div key={e.nome} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{e.nome}</span>
                  <span className="text-muted-foreground">
                    {e.pct}%{" "}
                    <span className="text-xs">
                      ({e.fav}/{e.total})
                    </span>
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${corBarra(e.pct)}`}
                    style={{ width: `${e.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 04 - Alertas prioritarios */}
      <section className="report-section">
        <div className="section-head">
          <span className="section-num">04</span>
          <div>
            <p className="section-eyebrow">O que não pode esperar</p>
            <h2 className="section-title flex items-center gap-2">
              Alertas e Riscos Prioritários
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </h2>
          </div>
        </div>
        <div className="space-y-3">
          {alertas.length === 0 ? (
            <div className="flex items-start gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Nenhum risco relevante identificado neste ciclo. Manter a rotina de conformidade.
              </span>
            </div>
          ) : (
            alertas.map((a, i) => (
              <div
                key={i}
                className={`rounded-xl border p-3.5 ${
                  a.severidade === "alta"
                    ? "border-rose-200 bg-rose-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      a.severidade === "alta"
                        ? "bg-rose-200 text-rose-800"
                        : "bg-amber-200 text-amber-800"
                    }`}
                  >
                    {a.severidade === "alta" ? "Crítico" : "Atenção"}
                  </span>
                  <p className="text-sm font-semibold text-foreground">{a.titulo}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5">{a.detalhe}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 05 - Prioridades por porte (KPIs) */}
      <section className="report-section">
        <div className="section-head">
          <span className="section-num">05</span>
          <div>
            <p className="section-eyebrow">O que o seu porte exige</p>
            <h2 className="section-title">Prioridades para {porte.porte}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3.5 mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {empresa?.funcionarios ?? 0} colaboradores · {porte.porte}
            </p>
            <p className="text-xs text-muted-foreground">
              Faixa de {porte.faixa}. Este é o pacote de segurança e treinamento que a legislação e a
              boa prática esperam de uma empresa deste tamanho.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {porte.itens.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-border p-3.5 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    item.tag === "Obrigatório"
                      ? "bg-primary/10 text-primary"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {item.tag}
                </span>
                {item.tag === "Obrigatório" ? (
                  <BadgeCheck className="h-4 w-4 text-primary" />
                ) : (
                  <GraduationCap className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <p className="text-sm font-semibold text-foreground">{item.titulo}</p>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">{item.detalhe}</p>
              <div className="flex items-center gap-1.5 text-xs font-medium text-primary pt-1 border-t border-border/70 mt-1">
                <ArrowRight className="h-3.5 w-3.5" />
                {item.oferta}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          O dimensionamento exato de CIPA e SESMT também depende do grau de risco (CNAE) da atividade.
          A Operandis faz esse enquadramento para a sua empresa e monta o cronograma de implantação.
        </p>
      </section>

      {/* 06 - Panorama nacional (pesquisa) */}
      <section className="report-section">
        <div className="section-head">
          <span className="section-num">06</span>
          <div>
            <p className="section-eyebrow">Por que agir agora</p>
            <h2 className="section-title flex items-center gap-2">
              Panorama Nacional
              <Scale className="h-4 w-4 text-primary" />
            </h2>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          O custo de negligenciar a Medicina do Trabalho no Brasil não é hipotético. Os números
          oficiais mostram por que o diagnóstico contínuo deixou de ser opcional.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {panorama.map((p, i) => (
            <div key={i} className="rounded-xl border border-border p-3.5">
              <p className="text-2xl font-extrabold text-primary tracking-tight">{p.valor}</p>
              <p className="text-sm font-semibold text-foreground">{p.titulo}</p>
              <p className="text-xs text-muted-foreground mt-1">{p.detalhe}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 07 - Plano de acao */}
      <section className="report-section">
        <div className="section-head">
          <span className="section-num">07</span>
          <div>
            <p className="section-eyebrow">O caminho, em ordem</p>
            <h2 className="section-title flex items-center gap-2">
              Plano de Ação Recomendado
              <ClipboardList className="h-4 w-4 text-primary" />
            </h2>
          </div>
        </div>
        <div className="space-y-5">
          {[
            { horizonte: "Próximos 30 dias", itens: acoes30 },
            { horizonte: "Próximos 60 dias", itens: acoes60 },
            { horizonte: "Próximos 90 dias", itens: acoes90 },
          ].map((bloco) => (
            <div key={bloco.horizonte} className="pl-4 border-l-2 border-primary/30">
              <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4 text-primary" />
                {bloco.horizonte}
              </p>
              <ul className="space-y-1.5">
                {bloco.itens.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 08 - CTA Operandis */}
      <section className="cta">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
          Próximo passo
        </p>
        <h3 className="mt-1">A Operandis assume esse plano com você</h3>
        <p className="text-sm text-white/85 leading-relaxed mt-3 max-w-2xl">
          Cada dia de documentação vencida, liderança sem treinamento ou adicional mal enquadrado é
          um passivo silencioso que só aparece na autuação ou na perícia, quando já é caro demais.
          Este diagnóstico mostra exatamente onde agir. A Operandis executa com consultoria,
          treinamentos e palestras sob medida para o seu porte.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          {recomendacoes.slice(0, 3).map((r, i) => (
            <div key={i} className="rounded-xl bg-white/10 border border-white/15 p-3">
              <CheckCircle2 className="h-4 w-4 text-white mb-1.5" />
              <p className="text-xs text-white/90 leading-snug">{r}</p>
            </div>
          ))}
        </div>
        <div className="no-print mt-6 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary">
            Falar com um especialista Operandis
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </section>

      {/* Como a Operandis pode ajudar (detalhado) */}
      {recomendacoes.length > 0 && (
        <section className="report-section">
          <div className="section-head">
            <span className="section-num">09</span>
            <div>
              <p className="section-eyebrow">Escopo sugerido</p>
              <h2 className="section-title">Como a Operandis pode ajudar</h2>
            </div>
          </div>
          <ul className="space-y-2">
            {recomendacoes.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Anexo - Respostas detalhadas */}
      {categorias?.map((categoria) => {
        const perguntas = [...(categoria.questions ?? [])].sort((a, b) => a.ordem - b.ordem);
        if (perguntas.length === 0) return null;

        return (
          <section key={categoria.id} className="report-section">
            <div className="section-head">
              <span className="section-num">
                <ClipboardList className="h-4 w-4" />
              </span>
              <div>
                <p className="section-eyebrow">Anexo · Respostas do diagnóstico</p>
                <h2 className="section-title">{categoria.nome}</h2>
              </div>
            </div>
            <div className="space-y-5">
              {perguntas.map((pergunta) => {
                const opcoesPorId = new Map(
                  (pergunta.options ?? []).map((o: { id: string; texto: string }) => [
                    o.id,
                    o.texto,
                  ])
                );
                const resposta = respostasPorPergunta.get(pergunta.id);
                const valorFormatado = formatarResposta(pergunta.tipo, resposta, opcoesPorId);
                const isSimNao = pergunta.tipo === "sim_nao" && valorFormatado;

                return (
                  <div key={pergunta.id} className="space-y-1.5">
                    <p className="text-sm font-medium text-foreground">{pergunta.titulo}</p>
                    {valorFormatado ? (
                      isSimNao && (valorFormatado === "Sim" || valorFormatado === "Não") ? (
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                            valorFormatado === "Sim"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {valorFormatado}
                        </span>
                      ) : (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {valorFormatado}
                        </p>
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Sem resposta</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <p className="text-xs text-muted-foreground text-center pt-2">
        Documento gerado por Operandis · Diagnóstico de Medicina do Trabalho · Confidencial
      </p>
    </div>
  );
}

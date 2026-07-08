import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatarDataHora(data: string | null) {
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

type RespostaValor = { option_id: string | null; texto: string | null; nota: number | null };

function formatarResposta(
  tipo: string,
  resposta: RespostaValor | undefined,
  opcoesPorId: Map<string, string>
) {
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
      "id, status, inicio, fim, score, company:companies(id, razao_social, fantasia, cnpj, cidade, estado, segmento, responsavel, email, telefone)"
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

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      <Link
        href="/admin/relatorios"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Respostas do Diagnóstico
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <ShieldCheck className="h-7 w-7" strokeWidth={2} />
          </div>
          <div>
            <CardTitle className="text-xl">Diagnóstico Operandis</CardTitle>
            <p className="text-sm text-muted-foreground">
              {empresa?.fantasia || empresa?.razao_social}
              {empresa?.cidade ? ` — ${empresa.cidade}/${empresa.estado}` : ""}
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm border-t border-border pt-4">
          <div>
            <span className="text-muted-foreground">CNPJ: </span>
            {empresa?.cnpj ?? "-"}
          </div>
          <div>
            <span className="text-muted-foreground">Segmento: </span>
            {empresa?.segmento ?? "-"}
          </div>
          <div>
            <span className="text-muted-foreground">Responsável: </span>
            {empresa?.responsavel ?? "-"}
          </div>
          <div>
            <span className="text-muted-foreground">Status: </span>
            <span className="capitalize">{diagnostico.status?.replace("_", " ")}</span>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Respondido em: </span>
            {formatarDataHora(diagnostico.fim ?? diagnostico.inicio)}
          </div>
        </CardContent>
      </Card>

      {categorias?.map((categoria) => {
        const perguntas = [...(categoria.questions ?? [])].sort((a, b) => a.ordem - b.ordem);
        if (perguntas.length === 0) return null;

        return (
          <Card key={categoria.id}>
            <CardHeader>
              <CardTitle className="text-base">{categoria.nome}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 border-t border-border pt-4">
              {perguntas.map((pergunta) => {
                const opcoesPorId = new Map(
                  (pergunta.options ?? []).map((o) => [o.id, o.texto])
                );
                const resposta = respostasPorPergunta.get(pergunta.id);
                const valorFormatado = formatarResposta(pergunta.tipo, resposta, opcoesPorId);
                const isSimNao = pergunta.tipo === "sim_nao" && valorFormatado;

                return (
                  <div key={pergunta.id} className="space-y-1.5">
                    <p className="text-sm font-medium text-foreground">{pergunta.titulo}</p>
                    {valorFormatado ? (
                      isSimNao ? (
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

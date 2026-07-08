"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { QuestionInput } from "@/components/questionario/question-input";
import type { Category, Question } from "@/lib/types";

// Fluxo: Empresa -> Grupo 1..N -> Revisão -> Enviar
export default function GrupoPage() {
  const params = useParams<{ diagnosticoId: string; numero: string }>();
  const router = useRouter();
  const numero = Number(params.numero);

  const [categorias, setCategorias] = useState<Category[]>([]);
  const [perguntas, setPerguntas] = useState<Question[]>([]);
  const [respostas, setRespostas] = useState<Record<string, { option_id?: string; texto?: string; nota?: number }>>({});
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      const supabase = createClient();
      const { data: cats } = await supabase
        .from("categories")
        .select("*")
        .order("ordem", { ascending: true });
      setCategorias(cats ?? []);

      const categoriaAtual = (cats ?? [])[numero - 1];
      if (categoriaAtual) {
        const { data: qs } = await supabase
          .from("questions")
          .select("*, options(*)")
          .eq("category_id", categoriaAtual.id)
          .order("ordem", { ascending: true });
        setPerguntas(qs ?? []);
      }
      setCarregando(false);
    }
    carregar();
  }, [numero]);

  const totalGrupos = categorias.length || 1;
  const progresso = Math.round((numero / (totalGrupos + 1)) * 100); // +1 = etapa de revisão

  const categoriaAtual = categorias[numero - 1];

  function respostaVazia(resp?: { option_id?: string; texto?: string; nota?: number }) {
    if (!resp) return true;
    const { option_id, texto, nota } = resp;
    return !option_id && !texto?.trim() && nota === undefined;
  }

  async function salvarEAvancar() {
    const pendentes = perguntas.filter(
      (p) => p.obrigatoria && respostaVazia(respostas[p.id])
    );
    if (pendentes.length > 0) {
      alert(
        `Responda as perguntas obrigatórias antes de continuar:\n\n${pendentes
          .map((p) => `• ${p.titulo}`)
          .join("\n")}`
      );
      return;
    }

    const supabase = createClient();
    const linhas = Object.entries(respostas).map(([question_id, resp]) => ({
      diagnostic_id: params.diagnosticoId,
      question_id,
      ...resp,
    }));
    if (linhas.length > 0) {
      await supabase.from("answers").upsert(linhas, { onConflict: "diagnostic_id,question_id" });
    }

    if (numero >= totalGrupos) {
      router.push(`/questionario/${params.diagnosticoId}/revisao`);
    } else {
      router.push(`/questionario/${params.diagnosticoId}/grupo/${numero + 1}`);
    }
  }

  if (carregando) {
    return <main className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</main>;
  }

  return (
    <main className="min-h-screen bg-secondary/30 px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{categoriaAtual?.nome ?? "Grupo"}</span>
            <span>{numero} de {totalGrupos}</span>
          </div>
          <Progress value={progresso} />
        </div>

        <motion.div
          key={numero}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {perguntas.map((pergunta) => (
            <div key={pergunta.id} className="rounded-2xl border border-border bg-card p-6 space-y-3">
              <div>
                <p className="font-medium text-foreground">
                  {pergunta.titulo}
                  {pergunta.obrigatoria && <span className="text-destructive ml-1">*</span>}
                </p>
                {pergunta.descricao && (
                  <p className="text-sm text-muted-foreground">{pergunta.descricao}</p>
                )}
              </div>
              <QuestionInput
                question={pergunta}
                value={respostas[pergunta.id] ?? {}}
                onChange={(v) =>
                  setRespostas((prev) => ({ ...prev, [pergunta.id]: { ...prev[pergunta.id], ...v } }))
                }
              />
            </div>
          ))}

          {perguntas.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              Nenhuma pergunta cadastrada neste grupo ainda.
            </p>
          )}
        </motion.div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => router.push(numero > 1 ? `/questionario/${params.diagnosticoId}/grupo/${numero - 1}` : "/")}
          >
            Voltar
          </Button>
          <Button onClick={salvarEAvancar}>
            {numero >= totalGrupos ? "Ir para Revisão" : "Salvar e Continuar"}
          </Button>
        </div>
      </div>
    </main>
  );
}

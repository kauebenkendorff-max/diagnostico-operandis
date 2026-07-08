"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RevisaoPage() {
  const params = useParams<{ diagnosticoId: string }>();
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setEnviando(true);
    const supabase = createClient();
    await supabase
      .from("diagnostics")
      .update({ status: "finalizado", fim: new Date().toISOString() })
      .eq("id", params.diagnosticoId);
    router.push(`/questionario/${params.diagnosticoId}/conclusao`);
  }

  return (
    <main className="min-h-screen bg-secondary/30 px-6 py-16 flex justify-center">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Revisão</CardTitle>
          <CardDescription>
            Confira se todas as respostas foram preenchidas antes de enviar o diagnóstico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Ao enviar, o diagnóstico será marcado como finalizado e não poderá mais ser editado
            por aqui. A equipe Operandis irá analisar suas respostas e gerar o relatório completo.
          </p>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              Voltar e revisar
            </Button>
            <Button onClick={enviar} disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar Diagnóstico"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

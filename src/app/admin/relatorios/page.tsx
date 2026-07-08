import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { ExcluirDiagnosticoButton } from "@/components/admin/excluir-diagnostico-button";

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

export default async function RelatoriosPage() {
  const supabase = await createClient();
  const { data: diagnosticos } = await supabase
    .from("diagnostics")
    .select(
      "id, status, inicio, fim, score, company:companies(id, razao_social, fantasia, cidade, estado, segmento)"
    )
    .order("inicio", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Respostas do Diagnóstico</h1>
        <p className="text-muted-foreground text-sm">
          {diagnosticos?.length ?? 0} respostas registradas
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-4 font-medium">Data</th>
                <th className="p-4 font-medium">Empresa</th>
                <th className="p-4 font-medium">Município</th>
                <th className="p-4 font-medium">Setor</th>
                <th className="p-4 font-medium">NPS</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {diagnosticos?.map((diagnostico) => {
                const empresa = Array.isArray(diagnostico.company)
                  ? diagnostico.company[0]
                  : diagnostico.company;
                return (
                  <tr
                    key={diagnostico.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/40"
                  >
                    <td className="p-4 whitespace-nowrap">
                      {formatarDataHora(diagnostico.fim ?? diagnostico.inicio)}
                    </td>
                    <td className="p-4 font-medium">
                      {empresa?.fantasia || empresa?.razao_social || "-"}
                    </td>
                    <td className="p-4">{empresa?.cidade ?? "-"}</td>
                    <td className="p-4">{empresa?.segmento ?? "-"}</td>
                    <td className="p-4">{diagnostico.score ?? "-"}</td>
                    <td className="p-4 whitespace-nowrap space-x-4">
                      <Link
                        href={`/admin/empresas/${empresa?.id ?? ""}`}
                        className="text-primary hover:underline"
                      >
                        Ver relatório →
                      </Link>
                      <ExcluirDiagnosticoButton diagnosticoId={diagnostico.id} />
                    </td>
                  </tr>
                );
              })}
              {(!diagnosticos || diagnosticos.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhuma resposta registrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

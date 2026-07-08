import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CARDS = [
  { label: "Total de diagnósticos", key: "total" },
  { label: "Empresas cadastradas", key: "empresas" },
  { label: "Pendentes", key: "pendentes" },
  { label: "Finalizados", key: "finalizados" },
];

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ count: totalDiag }, { count: totalEmpresas }, { count: pendentes }, { count: finalizados }] =
    await Promise.all([
      supabase.from("diagnostics").select("*", { count: "exact", head: true }),
      supabase.from("companies").select("*", { count: "exact", head: true }),
      supabase.from("diagnostics").select("*", { count: "exact", head: true }).eq("status", "pendente"),
      supabase.from("diagnostics").select("*", { count: "exact", head: true }).eq("status", "finalizado"),
    ]);

  const valores: Record<string, number | null> = {
    total: totalDiag,
    empresas: totalEmpresas,
    pendentes: pendentes,
    finalizados: finalizados,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral dos diagnósticos Operandis</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map(({ label, key }) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{valores[key] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos acessos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Conecte os gráficos (Radar, Barras, Pizza, Linha, Heatmap) via Recharts assim que os
            dados de diagnósticos estiverem populados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

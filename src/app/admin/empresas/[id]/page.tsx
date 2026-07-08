import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";

export default async function EmpresaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: empresa } = await supabase.from("companies").select("*").eq("id", id).single();
  if (!empresa) notFound();

  const { data: diagnosticos } = await supabase
    .from("diagnostics")
    .select("*, answers(*), comments(*)")
    .eq("company_id", id)
    .order("inicio", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{empresa.fantasia || empresa.razao_social}</h1>
        <p className="text-muted-foreground text-sm">{empresa.cnpj} · {empresa.cidade}/{empresa.estado}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Informações</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1 text-muted-foreground">
            <p>Responsável: {empresa.responsavel}</p>
            <p>Cargo: {empresa.cargo}</p>
            <p>Telefone: {empresa.telefone}</p>
            <p>Email: {empresa.email}</p>
            <p>Colaboradores: {empresa.funcionarios}</p>
            <p>Segmento: {empresa.segmento}</p>
            <p>SESMT: {empresa.possui_sesmt}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Diagnósticos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {diagnosticos?.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                <span className="capitalize">{d.status.replace("_", " ")}</span>
                <span className="text-muted-foreground">
                  {d.answers?.length ?? 0} respostas · {d.comments?.length ?? 0} comentários
                </span>
                <span className="font-medium">{d.score ?? "-"}</span>
              </div>
            ))}
            {(!diagnosticos || diagnosticos.length === 0) && (
              <p className="text-sm text-muted-foreground">Nenhum diagnóstico iniciado.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

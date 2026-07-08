import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export default async function EmpresasPage() {
  const supabase = await createClient();
  const { data: empresas } = await supabase
    .from("companies")
    .select("*, diagnostics(status)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Empresas</h1>
          <p className="text-muted-foreground text-sm">{empresas?.length ?? 0} empresas cadastradas</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-4 font-medium">Empresa</th>
                <th className="p-4 font-medium">Cidade/UF</th>
                <th className="p-4 font-medium">Segmento</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {empresas?.map((empresa) => (
                <tr key={empresa.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                  <td className="p-4">
                    <Link href={`/admin/empresas/${empresa.id}`} className="font-medium text-primary hover:underline">
                      {empresa.fantasia || empresa.razao_social}
                    </Link>
                  </td>
                  <td className="p-4">{empresa.cidade}/{empresa.estado}</td>
                  <td className="p-4">{empresa.segmento}</td>
                  <td className="p-4 capitalize">
                    {empresa.diagnostics?.[0]?.status?.replace("_", " ") ?? "pendente"}
                  </td>
                </tr>
              ))}
              {(!empresas || empresas.length === 0) && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    Nenhuma empresa cadastrada ainda.
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

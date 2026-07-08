import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <p className="text-muted-foreground text-sm">
          Geração automática de PDF com identidade visual Operandis.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estrutura do relatório</CardTitle>
          <CardDescription>
            Implementar com @react-pdf/renderer em src/lib/pdf/relatorio.tsx, a partir dos dados
            de um diagnóstico finalizado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
            <li>Capa Operandis</li>
            <li>Resumo Executivo</li>
            <li>Pontuação geral e por categoria</li>
            <li>Gráfico Radar</li>
            <li>Pontos Fortes</li>
            <li>Pontos Críticos / Não Conformidades</li>
            <li>Plano de Ação</li>
            <li>Cronograma</li>
            <li>Assinatura Operandis</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

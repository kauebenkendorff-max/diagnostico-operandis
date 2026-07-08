import { CheckCircle2 } from "lucide-react";

export default function ConclusaoPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-b from-white to-secondary/40">
      <div className="max-w-md text-center space-y-6 animate-fade-in">
        <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
        <h1 className="text-2xl font-semibold">Diagnóstico enviado com sucesso!</h1>
        <p className="text-muted-foreground">
          Obrigado por responder. A equipe Operandis irá analisar as informações e, em breve,
          você receberá o relatório completo com pontuação, pontos fortes, não conformidades e
          plano de ação.
        </p>
      </div>
    </main>
  );
}

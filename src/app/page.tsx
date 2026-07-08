import Link from "next/link";
import { ArrowRight, ShieldCheck, HeartPulse, ClipboardList, Brain } from "lucide-react";

const PILARES = [
  { icon: ShieldCheck, titulo: "Segurança do Trabalho" },
  { icon: HeartPulse, titulo: "Saúde Ocupacional" },
  { icon: ClipboardList, titulo: "Gestão de Riscos" },
  { icon: Brain, titulo: "Fatores Psicossociais" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-24 bg-gradient-to-b from-white to-secondary/40">
      <div className="w-full max-w-3xl text-center space-y-8 animate-fade-in">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold shadow-lg shadow-primary/20">
            O
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
            Diagnóstico Operandis
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Descubra o nível de maturidade da sua empresa em Segurança do Trabalho,
            Saúde Ocupacional, Gestão de Riscos e Fatores Psicossociais.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          {PILARES.map(({ icon: Icon, titulo }) => (
            <div
              key={titulo}
              className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center gap-2 shadow-sm"
            >
              <Icon className="h-6 w-6 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">{titulo}</span>
            </div>
          ))}
        </div>

        <Link
          href="/questionario/empresa"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-primary-foreground font-medium shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Começar Diagnóstico
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}

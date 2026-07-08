"use client";

import { Input } from "@/components/ui/input";
import type { Question } from "@/lib/types";

interface Props {
  question: Question;
  value: { option_id?: string; texto?: string; nota?: number };
  onChange: (value: { option_id?: string; texto?: string; nota?: number }) => void;
}

// Renderiza o campo de resposta de acordo com o tipo da pergunta.
export function QuestionInput({ question, value, onChange }: Props) {
  switch (question.tipo) {
    case "escolha_unica":
      return (
        <div className="flex flex-col gap-2">
          {question.options?.map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm cursor-pointer hover:bg-secondary/60"
            >
              <input
                type="radio"
                name={question.id}
                checked={value.option_id === opt.id}
                onChange={() => onChange({ option_id: opt.id })}
              />
              {opt.texto}
            </label>
          ))}
        </div>
      );

    case "multipla_escolha":
      return (
        <div className="flex flex-col gap-2">
          {question.options?.map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm cursor-pointer hover:bg-secondary/60"
            >
              <input
                type="checkbox"
                checked={value.texto?.split(",").includes(opt.id) ?? false}
                onChange={(e) => {
                  const atual = value.texto ? value.texto.split(",").filter(Boolean) : [];
                  const proximo = e.target.checked
                    ? [...atual, opt.id]
                    : atual.filter((id) => id !== opt.id);
                  onChange({ texto: proximo.join(",") });
                }}
              />
              {opt.texto}
            </label>
          ))}
        </div>
      );

    case "sim_nao":
      return (
        <div className="flex gap-3">
          {["Sim", "Não"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange({ texto: opt })}
              className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                value.texto === opt
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-secondary/60"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      );

    case "escala":
      return (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ nota: n })}
              className={`h-11 w-11 rounded-full border text-sm font-semibold transition-colors ${
                (value.nota ?? 0) >= n
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      );

    case "slider":
      return (
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={10}
            value={value.nota ?? 0}
            onChange={(e) => onChange({ nota: Number(e.target.value) })}
            className="w-full accent-primary"
          />
          <div className="text-sm text-muted-foreground text-center">{value.nota ?? 0} / 10</div>
        </div>
      );

    case "numero":
      return (
        <Input
          type="number"
          value={value.texto ?? ""}
          onChange={(e) => onChange({ texto: e.target.value })}
        />
      );

    case "data":
      return (
        <Input
          type="date"
          value={value.texto ?? ""}
          onChange={(e) => onChange({ texto: e.target.value })}
        />
      );

    case "texto_longo":
      return (
        <textarea
          value={value.texto ?? ""}
          onChange={(e) => onChange({ texto: e.target.value })}
          rows={4}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      );

    case "upload":
      return (
        <input
          type="file"
          onChange={(e) => onChange({ texto: e.target.files?.[0]?.name ?? "" })}
          className="text-sm"
        />
      );

    case "matriz":
      return (
        <div className="text-sm text-muted-foreground italic">
          Pergunta em matriz — configure as linhas/colunas em Admin &gt; Perguntas.
        </div>
      );

    case "texto":
    default:
      return (
        <Input
          value={value.texto ?? ""}
          onChange={(e) => onChange({ texto: e.target.value })}
        />
      );
  }
}

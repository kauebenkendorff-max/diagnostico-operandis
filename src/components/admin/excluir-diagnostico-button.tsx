"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ExcluirDiagnosticoButton({ diagnosticoId }: { diagnosticoId: string }) {
  const router = useRouter();
  const [excluindo, setExcluindo] = useState(false);

  async function handleExcluir() {
    const confirmado = window.confirm(
      "Tem certeza que deseja excluir esta resposta de diagnóstico? Essa ação não pode ser desfeita."
    );
    if (!confirmado) return;

    setExcluindo(true);
    const supabase = createClient();
    const { error } = await supabase.from("diagnostics").delete().eq("id", diagnosticoId);
    setExcluindo(false);

    if (error) {
      alert("Erro ao excluir. Tente novamente.");
      return;
    }
    router.refresh();
  }

  return (
    <button
      onClick={handleExcluir}
      disabled={excluindo}
      className="text-destructive hover:underline disabled:opacity-50"
    >
      {excluindo ? "Excluindo..." : "Excluir"}
    </button>
  );
}

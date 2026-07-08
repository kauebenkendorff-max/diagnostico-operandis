"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companySchema, type CompanyFormValues } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Consulta a BrasilAPI (pública, sem chave) para autocompletar os dados da
// empresa a partir do CNPJ digitado.
async function buscarDadosCnpj(cnpjDigitado: string) {
  const cnpj = cnpjDigitado.replace(/\D/g, "");
  if (cnpj.length !== 14) return null;

  const resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
  if (!resposta.ok) return null;
  return resposta.json() as Promise<{
    razao_social?: string;
    nome_fantasia?: string;
    cnae_fiscal?: number;
    cnae_fiscal_descricao?: string;
    municipio?: string;
    uf?: string;
  }>;
}

export default function EmpresaPage() {
  const router = useRouter();
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [cnpjErro, setCnpjErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormValues>({ resolver: zodResolver(companySchema) });

  async function handleCnpjBlur(e: React.FocusEvent<HTMLInputElement>) {
    const cnpj = e.target.value;
    if (cnpj.replace(/\D/g, "").length !== 14) return;

    setBuscandoCnpj(true);
    setCnpjErro(null);
    try {
      const dados = await buscarDadosCnpj(cnpj);
      if (!dados) {
        setCnpjErro("CNPJ não encontrado. Preencha os dados manualmente.");
        return;
      }
      if (dados.razao_social) setValue("razao_social", dados.razao_social, { shouldValidate: true });
      if (dados.nome_fantasia) setValue("fantasia", dados.nome_fantasia, { shouldValidate: true });
      if (dados.municipio) setValue("cidade", dados.municipio, { shouldValidate: true });
      if (dados.uf) setValue("estado", dados.uf, { shouldValidate: true });
      if (dados.cnae_fiscal_descricao) {
        setValue(
          "cnae",
          dados.cnae_fiscal ? `${dados.cnae_fiscal} - ${dados.cnae_fiscal_descricao}` : dados.cnae_fiscal_descricao,
          { shouldValidate: true }
        );
      }
    } catch {
      setCnpjErro("Não foi possível consultar o CNPJ agora. Preencha os dados manualmente.");
    } finally {
      setBuscandoCnpj(false);
    }
  }

  async function onSubmit(values: CompanyFormValues) {
    const supabase = createClient();

    const { data: diagnosticoId, error } = await supabase.rpc("iniciar_diagnostico", {
      empresa: values,
    });

    if (error || !diagnosticoId) {
      alert("Erro ao salvar a empresa. Tente novamente.");
      return;
    }

    router.push(`/questionario/${diagnosticoId}/grupo/1`);
  }

  return (
    <main className="min-h-screen bg-secondary/30 px-6 py-16 flex justify-center">
      <Card className="w-full max-w-2xl animate-slide-up">
        <CardHeader>
          <CardTitle>Antes de começar</CardTitle>
          <CardDescription>
            Preencha os dados da empresa para iniciar o diagnóstico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="CNPJ" required error={errors.cnpj?.message}>
                <Input
                  {...register("cnpj", { onBlur: handleCnpjBlur })}
                  placeholder="00.000.000/0000-00"
                />
              </Field>
              {buscandoCnpj && (
                <p className="text-xs text-muted-foreground mt-1">Consultando CNPJ...</p>
              )}
              {cnpjErro && <p className="text-xs text-destructive mt-1">{cnpjErro}</p>}
            </div>
            <Field label="Razão Social" required error={errors.razao_social?.message}>
              <Input {...register("razao_social")} />
            </Field>
            <Field label="Nome Fantasia" error={errors.fantasia?.message}>
              <Input {...register("fantasia")} />
            </Field>
            <Field label="Responsável" required error={errors.responsavel?.message}>
              <Input {...register("responsavel")} />
            </Field>
            <Field label="Cargo" error={errors.cargo?.message}>
              <Input {...register("cargo")} />
            </Field>
            <Field label="Telefone" error={errors.telefone?.message}>
              <Input {...register("telefone")} />
            </Field>
            <Field label="WhatsApp" error={errors.whatsapp?.message}>
              <Input {...register("whatsapp")} />
            </Field>
            <Field label="Email" required error={errors.email?.message}>
              <Input type="email" {...register("email")} />
            </Field>
            <Field label="Nº de colaboradores" required error={errors.funcionarios?.message}>
              <Input type="number" {...register("funcionarios")} />
            </Field>
            <Field label="Cidade" required error={errors.cidade?.message}>
              <Input {...register("cidade")} />
            </Field>
            <Field label="Estado" required error={errors.estado?.message}>
              <Input maxLength={2} placeholder="SP" {...register("estado")} />
            </Field>
            <Field label="Segmento" required error={errors.segmento?.message}>
              <Input {...register("segmento")} />
            </Field>
            <Field label="CNAE" required error={errors.cnae?.message}>
              <Input {...register("cnae")} />
            </Field>
            <Field label="Possui SESMT?" required error={errors.possui_sesmt?.message}>
              <select
                {...register("possui_sesmt")}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm"
              >
                <option value="nao">Não</option>
                <option value="sim">Sim</option>
                <option value="terceirizado">Terceirizado</option>
              </select>
            </Field>

            <div className="sm:col-span-2 pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Salvando..." : "Iniciar Diagnóstico"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companySchema, type CompanyFormValues } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function EmpresaPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormValues>({ resolver: zodResolver(companySchema) });

  async function onSubmit(values: CompanyFormValues) {
    const supabase = createClient();

    const { data: company, error } = await supabase
      .from("companies")
      .insert(values)
      .select()
      .single();

    if (error || !company) {
      alert("Erro ao salvar a empresa. Tente novamente.");
      return;
    }

    const { data: diagnostic } = await supabase
      .from("diagnostics")
      .insert({ company_id: company.id, status: "em_andamento" })
      .select()
      .single();

    router.push(`/questionario/${diagnostic?.id ?? ""}/grupo/1`);
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
            <Field label="Razão Social" error={errors.razao_social?.message}>
              <Input {...register("razao_social")} />
            </Field>
            <Field label="Nome Fantasia" error={errors.fantasia?.message}>
              <Input {...register("fantasia")} />
            </Field>
            <Field label="CNPJ" error={errors.cnpj?.message}>
              <Input {...register("cnpj")} placeholder="00.000.000/0000-00" />
            </Field>
            <Field label="Responsável" error={errors.responsavel?.message}>
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
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" {...register("email")} />
            </Field>
            <Field label="Nº de colaboradores" error={errors.funcionarios?.message}>
              <Input type="number" {...register("funcionarios")} />
            </Field>
            <Field label="Cidade" error={errors.cidade?.message}>
              <Input {...register("cidade")} />
            </Field>
            <Field label="Estado" error={errors.estado?.message}>
              <Input maxLength={2} placeholder="SP" {...register("estado")} />
            </Field>
            <Field label="Segmento" error={errors.segmento?.message}>
              <Input {...register("segmento")} />
            </Field>
            <Field label="CNAE" error={errors.cnae?.message}>
              <Input {...register("cnae")} />
            </Field>
            <Field label="Possui SESMT?" error={errors.possui_sesmt?.message}>
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
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

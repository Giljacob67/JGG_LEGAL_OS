import { redirect } from "next/navigation";

/** Alias da importação em lote (rota canônica: /processos/importacoes). */
export default function ImportacoesAliasPage() {
  redirect("/processos/importacoes");
}

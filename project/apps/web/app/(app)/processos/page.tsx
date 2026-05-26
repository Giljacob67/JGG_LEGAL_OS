import { redirect } from "next/navigation";

/** Redireciona a listagem legada para a UI atual de processos. */
export default function ProcessosRedirectPage() {
  redirect("/processos-v2");
}

import { ComparadorProcessos } from "@/components/processos-v2/comparador-processos";

export default function Page() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Comparador de Processos</h1>
      <ComparadorProcessos />
    </div>
  );
}

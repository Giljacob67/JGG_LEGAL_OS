"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Check, ArrowRight, Building2, Gavel, Users } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [cnj, setCnj] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  async function buscarCNJ() {
    if (!cnj.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/datajud?cnj=${encodeURIComponent(cnj)}`);
      const data = await res.json();
      if (res.ok) setResultado(data);
      else setResultado(null);
    } catch {
      setResultado(null);
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    { icon: Building2, title: "Bem-vindo ao JGG Legal OS", desc: "Sistema juridico integrado do escritorio Jacob, Greczyszn & Greczyszn. Vamos configurar seu primeiro processo em poucos passos." },
    { icon: Gavel, title: "Importe seu primeiro processo", desc: "Busque pelo numero CNJ no DataJud ou cadastre manualmente mais tarde." },
    { icon: Users, title: "Convide a equipe", desc: "Convide advogados e estagiarios para colaborar nos processos." },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-accent" : "bg-muted"}`} />
          ))}
        </div>

        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-5">
            {(() => {
              const Icon = steps[step].icon;
              return <Icon size={24} />;
            })()}
          </div>

          <h1 className="text-xl font-serif font-semibold mb-2">{steps[step].title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">{steps[step].desc}</p>

          {step === 0 && (
            <button onClick={() => setStep(1)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              Comecar <ArrowRight size={16} />
            </button>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  value={cnj}
                  onChange={(e) => setCnj(e.target.value)}
                  placeholder="0000000-00.0000.0.00.0000"
                  className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm font-mono outline-none focus:ring-2 focus:ring-ring"
                />
                <button onClick={buscarCNJ} disabled={loading} className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  {loading ? "..." : <Search size={16} />}
                </button>
              </div>

              {resultado && (
                <div className="p-4 rounded-lg bg-muted/50 border text-sm space-y-1">
                  <div className="font-mono font-medium">{resultado.numeroProcesso}</div>
                  <div className="text-muted-foreground">{resultado.classe?.nome}</div>
                  <div className="text-muted-foreground">{resultado.orgaoJulgador?.nome}</div>
                  <div className="pt-2 flex gap-2">
                    <button className="px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:opacity-90">Importar processo</button>
                    <button onClick={() => setResultado(null)} className="px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-muted">Limpar</button>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(0)} className="text-xs text-muted-foreground hover:text-foreground">Voltar</button>
                <button onClick={() => setStep(2)} className="text-xs text-muted-foreground hover:text-foreground">Pular este passo</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border text-sm text-muted-foreground">
                A convite de equipe sera habilitado apos a configuracao inicial do Clerk.
              </div>
              <button onClick={() => router.push("/dashboard")} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                <Check size={16} /> Ir para o Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
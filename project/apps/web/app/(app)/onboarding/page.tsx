"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Check, ArrowRight, Building2, Gavel, Users, FileText, Clock, Banknote, Upload } from "lucide-react";
import { ONBOARDING_FLUXO_BASICO } from "@/lib/content/onboarding";

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

  const fluxo = ONBOARDING_FLUXO_BASICO;
  const totalSteps = fluxo.length;

  function next() {
    if (step < totalSteps - 1) setStep(step + 1);
    else router.push("/dashboard");
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  const current = fluxo[step];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-8">
          {fluxo.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-accent" : "bg-muted"}`} />
          ))}
        </div>

        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-5">
            {step === 0 && <Building2 size={24} />}
            {step === 1 && <Users size={24} />}
            {step === 2 && <FileText size={24} />}
            {step === 3 && <Gavel size={24} />}
            {step === 4 && <Clock size={24} />}
            {step === 5 && <Upload size={24} />}
            {step === 6 && <Banknote size={24} />}
          </div>

          <h1 className="text-xl font-serif font-semibold mb-2">{current.etapa}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">{current.descricao}</p>

          {step === 3 && (
            <div className="space-y-4 mb-4">
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
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={back}
              disabled={step === 0}
              className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              Voltar
            </button>
            <button
              onClick={next}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {step === totalSteps - 1 ? (
                <> <Check size={16} /> Ir para o Dashboard </>
              ) : (
                <> Próximo <ArrowRight size={16} /> </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

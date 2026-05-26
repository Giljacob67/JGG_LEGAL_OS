import { GoogleCalendarIntegration } from "@/components/processos-v2/google-calendar-integration";
import { WorkflowsManager } from "@/components/processos-v2/workflows-manager";

export default function Page() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrações e Automações</h1>
        <p className="text-muted-foreground mt-1">
          Configure integrações externas e automatize tarefas repetitivas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <GoogleCalendarIntegration />
        </div>
      </div>

      <div className="mt-8">
        <WorkflowsManager />
      </div>
    </div>
  );
}

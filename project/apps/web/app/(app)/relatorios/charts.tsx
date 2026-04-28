"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#64748b",
];

const STATUS_COLORS: Record<string, string> = {
  em_andamento: "#3b82f6",
  suspenso: "#f59e0b",
  arquivado: "#64748b",
  encerrado: "#10b981",
  pago: "#10b981",
  pendente: "#f59e0b",
  atrasado: "#ef4444",
  cancelado: "#64748b",
};

const AREA_LABELS: Record<string, string> = {
  bancario: "Bancario",
  agrario: "Agrario",
  tributario: "Tributario",
  trabalhista: "Trabalhista",
  civil: "Civil",
  empresarial: "Empresarial",
  penal: "Penal",
};

function formatMonthYear(ano: number | null, mes: string | null) {
  if (!ano || !mes) return "";
  const monthNames = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const m = parseInt(mes, 10) - 1;
  return `${monthNames[m]}/${ano.toString().slice(2)}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ============================================
// Receita Mensal (Bar Chart)
// ============================================
export function ReceitaMensalChart({
  data,
}: {
  data: { ano: number | null; mes: string | null; _sum: { valor: unknown } }[];
}) {
  const chartData = data.map((d) => ({
    label: formatMonthYear(d.ano, d.mes),
    valor: Number(d._sum.valor ?? 0),
  }));

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="p-4 border-b">
        <h2 className="text-sm font-semibold">Evolucao de Receita</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Ultimos 12 meses</p>
      </div>
      <div className="p-4 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) =>
                `R$${(v / 1000).toFixed(0)}k`
              }
            />
            <Tooltip
              formatter={(value: unknown) => [formatCurrency(Number(value ?? 0)), "Receita"]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
            />
            <Bar dataKey="valor" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================================
// Processos por Area (Pie Chart)
// ============================================
export function ProcessosPorAreaChart({
  data,
}: {
  data: { area: string | null; _count: { id: number }; _sum: { valorCausa: unknown } }[];
}) {
  const chartData = data.map((d) => ({
    name: (AREA_LABELS[d.area ?? ""] || d.area) ?? "N/A",
    value: d._count.id,
    valor: Number(d._sum.valorCausa ?? 0),
  }));

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="p-4 border-b">
        <h2 className="text-sm font-semibold">Processos por Area</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Distribuicao e valor em litigio</p>
      </div>
      <div className="p-4 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((_, i) => (
                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: unknown, name: unknown, props: unknown) => {
                const p = props as { payload?: { valor?: unknown } };
                const valor = p?.payload?.valor ?? 0;
                return [
                  `${value} processos (${formatCurrency(Number(valor))})`,
                  name as string,
                ];
              }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================================
// Processos por Status (Pie Chart)
// ============================================
export function ProcessosPorStatusChart({
  data,
}: {
  data: { status: string; _count: { id: number } }[];
}) {
  const chartData = data.map((d) => ({
    name: d.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value: d._count.id,
    color: STATUS_COLORS[d.status] || "#64748b",
  }));

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="p-4 border-b">
        <h2 className="text-sm font-semibold">Processos por Status</h2>
      </div>
      <div className="p-4 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((d, i) => (
                <Cell key={`cell-${i}`} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: unknown, name: unknown) => [`${value} processos`, name as string]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================================
// Faturas por Status (Pie Chart)
// ============================================
export function FaturasPorStatusChart({
  data,
}: {
  data: { status: string; _count: { id: number }; _sum: { valor: unknown } }[];
}) {
  const chartData = data.map((d) => ({
    name: d.status.replace(/\b\w/g, (c) => c.toUpperCase()),
    value: d._count.id,
    valor: Number(d._sum.valor ?? 0),
    color: STATUS_COLORS[d.status] || "#64748b",
  }));

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="p-4 border-b">
        <h2 className="text-sm font-semibold">Faturas por Status</h2>
      </div>
      <div className="p-4 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((d, i) => (
                <Cell key={`cell-${i}`} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: unknown, name: unknown, props: unknown) => {
                const p = props as { payload?: { valor?: unknown } };
                const valor = p?.payload?.valor ?? 0;
                return [`${value} faturas (${formatCurrency(Number(valor))})`, name as string];
              }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================================
// Top Clientes (Horizontal Bar)
// ============================================
export function TopClientesChart({
  data,
}: {
  data: { id: string; nome: string; _count: { processos: number } }[];
}) {
  const chartData = [...data]
    .sort((a, b) => b._count.processos - a._count.processos)
    .slice(0, 8)
    .map((d) => ({
      name: d.nome.length > 20 ? d.nome.slice(0, 20) + "..." : d.nome,
      processos: d._count.processos,
    }));

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="p-4 border-b">
        <h2 className="text-sm font-semibold">Top Clientes</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Por quantidade de processos</p>
      </div>
      <div className="p-4 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip
              formatter={(value: unknown) => [`${value} processos`, "Processos"]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
            />
            <Bar dataKey="processos" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

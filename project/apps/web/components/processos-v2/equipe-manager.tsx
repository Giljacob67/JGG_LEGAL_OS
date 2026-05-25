"use client";

import { useState, useEffect } from "react";
import { UserPlus, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  cor: string | null;
}

interface EquipeManagerProps {
  processoId: string;
}

export function EquipeManager({ processoId }: EquipeManagerProps) {
  const [responsavel, setResponsavel] = useState<User | null>(null);
  const [equipe, setEquipe] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingUser, setAddingUser] = useState<string>("");

  useEffect(() => {
    loadData();
  }, [processoId]);

  async function loadData() {
    try {
      const [teamRes, usersRes] = await Promise.all([
        fetch(`/api/v1/processes/${processoId}/team`),
        fetch("/api/v1/users?limit=100"),
      ]);

      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setResponsavel(teamData.responsavel);
        setEquipe(teamData.equipe);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAllUsers(usersData.data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar equipe:", error);
    } finally {
      setLoading(false);
    }
  }

  async function addMember(userId: string) {
    if (!userId) return;

    try {
      const res = await fetch(`/api/v1/processes/${processoId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        const data = await res.json();
        setEquipe(data.equipe);
        setAddingUser("");
      }
    } catch (error) {
      console.error("Erro ao adicionar membro:", error);
    }
  }

  async function removeMember(userId: string) {
    try {
      const res = await fetch(
        `/api/v1/processes/${processoId}/team?userId=${userId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        const data = await res.json();
        setEquipe(data.equipe);
      }
    } catch (error) {
      console.error("Erro ao remover membro:", error);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const equipeIds = new Set(equipe.map((u) => u.id));
  if (responsavel) equipeIds.add(responsavel.id);
  const availableUsers = allUsers.filter((u) => !equipeIds.has(u.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Equipe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Responsável */}
        {responsavel && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Responsável
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: responsavel.cor || "#3b82f6" }}
              >
                {responsavel.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-medium">{responsavel.nome}</div>
                <div className="text-sm text-muted-foreground">
                  {responsavel.email}
                </div>
              </div>
              <div className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                Responsável
              </div>
            </div>
          </div>
        )}

        {/* Equipe */}
        {equipe.length > 0 && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Membros da Equipe ({equipe.length})
            </div>
            <div className="space-y-2">
              {equipe.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: member.cor || "#6b7280" }}
                  >
                    {member.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{member.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      {member.email}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMember(member.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Adicionar membro */}
        {availableUsers.length > 0 && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Adicionar Membro
            </div>
            <div className="flex gap-2">
              <Select value={addingUser} onValueChange={setAddingUser}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.nome} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => addMember(addingUser)}
                disabled={!addingUser}
                size="icon"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {equipe.length === 0 && availableUsers.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum usuário disponível para adicionar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

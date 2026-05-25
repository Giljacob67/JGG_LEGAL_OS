"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Paperclip, AtSign, Lock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Note {
  id: string;
  titulo: string | null;
  conteudo: string;
  tipo: string;
  mencoes: string[];
  editadoEm: string | null;
  createdAt: string;
  updatedAt: string;
  autor: {
    id: string;
    nome: string;
    avatar: string | null;
  };
  editadoPor?: {
    id: string;
    nome: string;
  } | null;
  anexos: Array<{
    id: string;
    nome: string;
    url: string;
    mimeType: string | null;
    tamanho: number | null;
  }>;
}

interface ProcessoNotasProps {
  processoId: string;
  currentUserId: string;
}

export function ProcessoNotas({ processoId, currentUserId }: ProcessoNotasProps) {
  const [notas, setNotas] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    conteudo: "",
    tipo: "interna",
    mencoes: [] as string[],
  });
  const [mencoesInput, setMencoesInput] = useState("");

  useEffect(() => {
    loadNotas();
  }, [processoId]);

  async function loadNotas() {
    try {
      const res = await fetch(`/api/v1/processes/${processoId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotas(data);
      }
    } catch (error) {
      console.error("Erro ao carregar notas:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const url = editingNote
        ? `/api/v1/processes/${processoId}/notes/${editingNote.id}`
        : `/api/v1/processes/${processoId}/notes`;
      const method = editingNote ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await loadNotas();
        resetForm();
      }
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
    }
  }

  async function handleDelete(noteId: string) {
    if (!confirm("Tem certeza que deseja excluir esta nota?")) return;

    try {
      const res = await fetch(`/api/v1/processes/${processoId}/notes/${noteId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadNotas();
      }
    } catch (error) {
      console.error("Erro ao excluir nota:", error);
    }
  }

  function handleEdit(note: Note) {
    setEditingNote(note);
    setFormData({
      titulo: note.titulo || "",
      conteudo: note.conteudo,
      tipo: note.tipo,
      mencoes: note.mencoes,
    });
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      titulo: "",
      conteudo: "",
      tipo: "interna",
      mencoes: [],
    });
    setMencoesInput("");
    setEditingNote(null);
    setShowForm(false);
  }

  function handleMencoesChange(value: string) {
    setMencoesInput(value);
    // Extrair menções do formato @username
    const mencoes = value
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m.startsWith("@"))
      .map((m) => m.substring(1));
    setFormData({ ...formData, mencoes });
  }

  const getTipoBadge = (tipo: string) => {
    const badges = {
      interna: { label: "Interna", className: "bg-blue-100 text-blue-800" },
      confidencial: { label: "Confidencial", className: "bg-red-100 text-red-800" },
      historico: { label: "Histórico", className: "bg-gray-100 text-gray-800" },
    };
    return badges[tipo as keyof typeof badges] || badges.interna;
  };

  if (loading) {
    return <div className="text-center py-8">Carregando notas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Notas Colaborativas</h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nova Nota
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {editingNote ? "Editar Nota" : "Nova Nota"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título (opcional)</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Título da nota"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Conteúdo * <span className="text-xs text-gray-500">(use @nome para mencionar)</span>
                </label>
                <textarea
                  value={formData.conteudo}
                  onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={5}
                  required
                  placeholder="Digite sua nota aqui..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  <AtSign className="w-4 h-4 inline mr-1" />
                  Menções (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={mencoesInput}
                  onChange={(e) => handleMencoesChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="@joao, @maria"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="interna">Interna</option>
                  <option value="confidencial">Confidencial</option>
                  <option value="historico">Histórico</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingNote ? "Atualizar" : "Criar"} Nota
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {notas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma nota ainda. Crie a primeira!</p>
          </div>
        ) : (
          notas.map((nota) => (
            <Card key={nota.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold">
                      {nota.autor.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{nota.autor.nome}</div>
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(nota.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                        {nota.editadoEm && (
                          <span className="ml-2">
                            (editado {formatDistanceToNow(new Date(nota.editadoEm), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                            {nota.editadoPor && ` por ${nota.editadoPor.nome}`})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={getTipoBadge(nota.tipo).className}>
                      {nota.tipo === "confidencial" && <Lock className="w-3 h-3 mr-1" />}
                      {getTipoBadge(nota.tipo).label}
                    </Badge>
                    {nota.autor.id === currentUserId && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(nota)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(nota.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {nota.titulo && (
                  <h3 className="font-semibold mb-2">{nota.titulo}</h3>
                )}

                <div className="whitespace-pre-wrap text-sm mb-3">
                  {nota.conteudo}
                </div>

                {nota.mencoes.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <AtSign className="w-3 h-3" />
                    <span>Mencionou: {nota.mencoes.join(", ")}</span>
                  </div>
                )}

                {nota.anexos.length > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <div className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Anexos ({nota.anexos.length})
                    </div>
                    <div className="space-y-1">
                      {nota.anexos.map((anexo) => (
                        <a
                          key={anexo.id}
                          href={anexo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-blue-600 hover:underline"
                        >
                          {anexo.nome}
                          {anexo.tamanho && (
                            <span className="text-gray-500 ml-2">
                              ({(anexo.tamanho / 1024).toFixed(1)} KB)
                            </span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

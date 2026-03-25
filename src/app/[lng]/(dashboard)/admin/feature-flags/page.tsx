"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Globe,
  Building2,
} from "lucide-react";

import { Header } from "@/components/dashboard/header";
import { api } from "@/lib/api/client";
import { handleApiError } from "@/lib/toast";

interface FeatureFlag {
  id: string;
  key: string;
  description: string;
  enabled: boolean;
  clinic_id: string | null;
  created_at: string;
  updated_at: string;
}

interface FeatureFlagsPageProps {
  params: Promise<{ lng: string }>;
}

export default function FeatureFlagsPage({ params }: FeatureFlagsPageProps) {
  const [lng, setLng] = useState("pt-BR");
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFlag, setNewFlag] = useState({ key: "", description: "", enabled: false, clinic_id: "" });

  useEffect(() => {
    params.then((p) => setLng(p.lng));
  }, [params]);

  const fetchFlags = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getFeatureFlags();
      setFlags(response.data || []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleToggle = async (flag: FeatureFlag) => {
    try {
      await api.updateFeatureFlag(flag.id, { enabled: !flag.enabled });
      setFlags((prev) =>
        prev.map((f) => (f.id === flag.id ? { ...f, enabled: !f.enabled } : f))
      );
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleCreate = async () => {
    try {
      await api.createFeatureFlag(newFlag);
      setIsModalOpen(false);
      setNewFlag({ key: "", description: "", enabled: false, clinic_id: "" });
      fetchFlags();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta feature flag?")) return;
    try {
      await api.deleteFeatureFlag(id);
      setFlags((prev) => prev.filter((f) => f.id !== id));
    } catch (error) {
      handleApiError(error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header lng={lng} title="Feature Flags" />

      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Flags sao usadas para ativar/desativar funcionalidades novas sem redeploy.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-4 py-2 rounded-md text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Nova Flag
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : flags.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Nenhuma feature flag criada ainda
          </div>
        ) : (
          <div className="space-y-3">
            {flags.map((flag) => (
              <div
                key={flag.id}
                className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-sm">{flag.key}</span>
                    {flag.clinic_id ? (
                      <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        <Building2 className="w-3 h-3" />
                        Clinica
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        <Globe className="w-3 h-3" />
                        Global
                      </span>
                    )}
                  </div>
                  {flag.description && (
                    <p className="text-sm text-gray-500 mt-1">{flag.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Criada em {new Date(flag.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleToggle(flag)} className="p-1">
                    {flag.enabled ? (
                      <ToggleRight className="w-8 h-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-300" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(flag.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Nova Feature Flag</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key (identificador unico)
                </label>
                <input
                  type="text"
                  placeholder="ex: auto_whatsapp_booking"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={newFlag.key}
                  onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descricao
                </label>
                <input
                  type="text"
                  placeholder="ex: Agendamento automatico via WhatsApp"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={newFlag.description}
                  onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clinic ID (vazio = global)
                </label>
                <input
                  type="text"
                  placeholder="UUID da clinica (opcional)"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={newFlag.clinic_id}
                  onChange={(e) => setNewFlag({ ...newFlag, clinic_id: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={newFlag.enabled}
                  onChange={(e) => setNewFlag({ ...newFlag, enabled: e.target.checked })}
                />
                <label htmlFor="enabled" className="text-sm">Ativada ao criar</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm border rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!newFlag.key}
                className="px-4 py-2 text-sm bg-primary text-white rounded-md disabled:opacity-50"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

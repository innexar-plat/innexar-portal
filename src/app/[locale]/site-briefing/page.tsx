'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { CheckCircle2, ArrowRight, Loader2, FileText, Upload, File } from 'lucide-react';
import { useWorkspaceApi, workspaceFetch, getCustomerToken } from '@/lib/workspace-api';

interface ProjectAguardando {
  id: number;
  name: string;
  status: string;
}

interface ProjectFileItem {
  id: number;
  filename: string;
  size: number;
  created_at: string;
}

export default function SiteBriefingPage() {
  const router = useRouter();
  const locale = useLocale();
  const isWorkspaceApi = useWorkspaceApi();
  const [companyName, setCompanyName] = useState('');
  const [services, setServices] = useState('');
  const [city, setCity] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [domain, setDomain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [colors, setColors] = useState('');
  const [photos, setPhotos] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [projectAguardando, setProjectAguardando] = useState<ProjectAguardando | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [files, setFiles] = useState<ProjectFileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState('');

  const fetchProjectAguardando = useCallback(async () => {
    const token = getCustomerToken();
    if (!token || !isWorkspaceApi) {
      setProjectLoading(false);
      return;
    }
    try {
      const res = await workspaceFetch('/api/portal/me/project-aguardando-briefing', { token });
      if (res.ok) {
        const data = await res.json();
        setProjectAguardando(data ?? null);
      }
    } catch {
      setProjectAguardando(null);
    } finally {
      setProjectLoading(false);
    }
  }, [isWorkspaceApi]);

  const fetchFiles = useCallback(async (projectId: number) => {
    const token = getCustomerToken();
    if (!token) return;
    setFilesLoading(true);
    try {
      const res = await workspaceFetch(`/api/portal/projects/${projectId}/files`, { token });
      if (res.ok) {
        const data = await res.json();
        setFiles(Array.isArray(data) ? data : []);
      } else {
        setFiles([]);
      }
    } catch {
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjectAguardando();
  }, [fetchProjectAguardando]);

  useEffect(() => {
    if (projectAguardando?.id) {
      fetchFiles(projectAguardando.id);
    } else {
      setFiles([]);
    }
  }, [projectAguardando?.id, fetchFiles]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const projectId = projectAguardando?.id;
    const token = getCustomerToken();
    if (!projectId || !token || !e.target.files?.length) return;
    setFileError('');
    setUploading(true);
    try {
      for (const file of Array.from(e.target.files)) {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_WORKSPACE_API_URL?.replace(/\/*$/, '') || ''}/api/portal/projects/${projectId}/files`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setFileError(typeof err.detail === 'string' ? err.detail : 'Erro ao enviar arquivo.');
          break;
        }
      }
      if (projectId) fetchFiles(projectId);
    } catch {
      setFileError('Erro de conexão.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const token = getCustomerToken();
    if (!token && isWorkspaceApi) {
      setError('Faça login para enviar.');
      return;
    }
    if (!companyName.trim()) {
      setError('Preencha o nome da empresa.');
      return;
    }
    setSubmitting(true);
    try {
      if (isWorkspaceApi && token) {
        const res = await workspaceFetch('/api/portal/site-briefing', {
          method: 'POST',
          token,
          body: JSON.stringify({
            company_name: companyName.trim(),
            services: services.trim() || undefined,
            city: city.trim() || undefined,
            whatsapp: whatsapp.trim() || undefined,
            domain: domain.trim() || undefined,
            logo_url: logoUrl.trim() || undefined,
            colors: colors.trim() || undefined,
            photos: photos.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(typeof data.detail === 'string' ? data.detail : 'Erro ao enviar.');
          setSubmitting(false);
          return;
        }
        setSubmitted(true);
        return;
      }
      setError('Recurso disponível apenas com a API do workspace.');
    } catch {
      setError('Erro de conexão.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Dados enviados!</h2>
        <p className="text-slate-400 mb-6">
          Nossa equipe recebeu as informações do seu site e entrará em contato em breve.
        </p>
        <motion.button
          onClick={() => router.push(`/${locale}`)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-medium"
        >
          Voltar ao Painel
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <FileText className="w-8 h-8 text-cyan-400" />
          Dados do meu site
        </h1>
        <p className="text-slate-400">Preencha as informações do seu negócio para criarmos seu site.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nome da empresa *</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="Minha Empresa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Serviços (o que sua empresa faz)</label>
            <textarea
              value={services}
              onChange={(e) => setServices(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
              placeholder="Ex.: Advocacia trabalhista, consultoria empresarial..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Cidade</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="Santos, SP"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">WhatsApp</label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Domínio (se já tiver)</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="meusite.com.br"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">URL da logo (se já tiver)</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Cores preferidas</label>
            <input
              type="text"
              value={colors}
              onChange={(e) => setColors(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="Ex.: Azul e branco"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Fotos ou referências (links ou descrição)</label>
            <textarea
              value={photos}
              onChange={(e) => setPhotos(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
              placeholder="URLs de fotos ou descrição do que precisa"
            />
          </div>

          {!projectLoading && projectAguardando && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                Arquivos do projeto
              </h3>
              <p className="text-slate-400 text-sm">
                Você pode enviar logo, fotos ou outros arquivos para o projeto &quot;{projectAguardando.name}&quot;.
              </p>
              {fileError && (
                <p className="text-red-400 text-sm">{fileError}</p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 cursor-pointer hover:bg-cyan-500/30 disabled:opacity-50">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Enviando...' : 'Selecionar arquivos'}
                  <input
                    type="file"
                    multiple
                    className="sr-only"
                    disabled={uploading}
                    onChange={handleFileUpload}
                  />
                </label>
                {filesLoading && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
              </div>
              {files.length > 0 && (
                <div>
                  <p className="text-slate-400 text-sm mb-2">
                    {files.length} arquivo(s) enviado(s)
                  </p>
                  <ul className="space-y-1 text-sm text-slate-300">
                    {files.map((f) => (
                      <li key={f.id} className="flex items-center gap-2">
                        <File className="w-4 h-4 text-cyan-400" />
                        {f.filename}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!projectLoading && !projectAguardando && isWorkspaceApi && (
            <p className="text-slate-500 text-sm">
              Após o pagamento você poderá enviar arquivos (logo, fotos) na página do projeto.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
            Enviar dados do site
          </button>
        </form>
      </motion.div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import {
    ArrowLeft, Clock, CheckCircle2, Palette, Eye, Rocket,
    Calendar, MessageSquare, AlertCircle, Upload, FileText, Loader2, Download
} from 'lucide-react';
import ProjectStatusPipeline from '@/components/ProjectStatusPipeline';
import { useWorkspaceApi, workspaceFetch, getCustomerToken } from '@/lib/workspace-api';

interface ProjectDetails {
    id: number;
    name: string;
    status: string;
    created_at: string;
    updated_at?: string;
}

interface ProjectFileItem {
    id: number;
    filename: string;
    content_type: string | null;
    size: number;
    created_at: string;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    active: { icon: Palette, color: 'blue', label: 'Em andamento' },
    building: { icon: Palette, color: 'purple', label: 'Em desenvolvimento' },
    review: { icon: Eye, color: 'cyan', label: 'Em revisão' },
    delivered: { icon: Rocket, color: 'green', label: 'Entregue' },
    completed: { icon: CheckCircle2, color: 'green', label: 'Concluído' },
};

export default function ProjectDetailsPage() {
    const locale = useLocale();
    const params = useParams();
    const projectId = params.id as string;

    const isWorkspaceApi = useWorkspaceApi();
    const [project, setProject] = useState<ProjectDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState<ProjectFileItem[]>([]);
    const [filesLoading, setFilesLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProject = async () => {
            const token = getCustomerToken();
            if (!token || !isWorkspaceApi) {
                setLoading(false);
                return;
            }

            try {
                const res = await workspaceFetch(`/api/portal/projects/${projectId}`, { token });
                if (!res.ok) {
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                setProject({
                    id: data.id,
                    name: data.name,
                    status: data.status || 'active',
                    created_at: data.created_at,
                    updated_at: data.updated_at,
                });
            } catch (error) {
                console.error('Error fetching project:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [projectId, isWorkspaceApi]);

    const fetchFiles = useCallback(async () => {
        const token = getCustomerToken();
        if (!token || !isWorkspaceApi || !projectId) return;
        setFilesLoading(true);
        try {
            const res = await workspaceFetch(`/api/portal/projects/${projectId}/files`, { token });
            if (res.ok) {
                const data = await res.json();
                setFiles(Array.isArray(data) ? data : []);
            }
        } finally {
            setFilesLoading(false);
        }
    }, [projectId, isWorkspaceApi]);

    useEffect(() => {
        if (project) fetchFiles();
    }, [project, fetchFiles]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !getCustomerToken() || !projectId) return;
        setUploading(true);
        setFileError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const token = getCustomerToken();
            const base = process.env.NEXT_PUBLIC_WORKSPACE_API_URL?.replace(/\/$/, '') || '';
            const res = await fetch(`${base}/api/portal/projects/${projectId}/files`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (res.ok) {
                fetchFiles();
                e.target.value = '';
            } else {
                const data = await res.json().catch(() => ({}));
                setFileError(typeof data.detail === 'string' ? data.detail : 'Falha no envio');
            }
        } catch {
            setFileError('Falha no envio');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (fileId: number, filename: string) => {
        const token = getCustomerToken();
        if (!token || !projectId) return;
        const base = process.env.NEXT_PUBLIC_WORKSPACE_API_URL?.replace(/\/$/, '') || '';
        const res = await fetch(`${base}/api/portal/projects/${projectId}/files/${fileId}/download`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getColorClasses = (color: string) => {
        const colors: Record<string, { bg: string; border: string; text: string }> = {
            blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
            purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400' },
            cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400' },
            green: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400' },
        };
        return colors[color] || colors.blue;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isWorkspaceApi) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Portal configurado para Workspace</h2>
                <p className="text-slate-400 mb-6">Configure NEXT_PUBLIC_USE_WORKSPACE_API para acessar os projetos.</p>
                <Link href={`/${locale}/projects`}>
                    <motion.button whileHover={{ scale: 1.02 }} className="px-6 py-3 bg-blue-500 rounded-xl text-white font-medium">
                        Voltar para Projetos
                    </motion.button>
                </Link>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Projeto não encontrado</h2>
                <p className="text-slate-400 mb-6">O projeto solicitado não existe ou você não tem acesso.</p>
                <Link href={`/${locale}/projects`}>
                    <motion.button whileHover={{ scale: 1.02 }} className="px-6 py-3 bg-blue-500 rounded-xl text-white font-medium">
                        Voltar para Projetos
                    </motion.button>
                </Link>
            </div>
        );
    }

    const status = statusConfig[project.status] || statusConfig.active;
    const colors = getColorClasses(status.color);
    const StatusIcon = status.icon;

    return (
        <div className="space-y-8">
            <Link href={`/${locale}/projects`}>
                <motion.button whileHover={{ x: -4 }} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    {locale === 'pt' ? 'Voltar para Projetos' : 'Back to Projects'}
                </motion.button>
            </Link>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                        <StatusIcon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">{project.name}</h1>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border mt-1`}>
                            {status.label}
                        </span>
                    </div>
                </div>
                <Link
                    href={`/${locale}/support?new=1&subject=${encodeURIComponent(locale === 'pt' ? `Modificação no projeto #${project.id}` : `Modification for project #${project.id}`)}&category=modificacao&project_id=${project.id}`}
                >
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-2 px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 rounded-xl text-amber-300 font-medium">
                        <MessageSquare className="w-4 h-4" />
                        {locale === 'pt' ? 'Solicitar modificação' : 'Request modification'}
                    </motion.button>
                </Link>
            </div>

            <ProjectStatusPipeline status={project.status} locale={locale} />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    {locale === 'pt' ? 'Detalhes do Projeto' : 'Project Details'}
                </h2>
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <span className="text-slate-400">ID</span>
                        <span className="text-white font-medium">#{project.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">{locale === 'pt' ? 'Criado em' : 'Created'}</span>
                        <span className="text-white">{new Date(project.created_at).toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US')}</span>
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        {locale === 'pt' ? 'Arquivos do projeto' : 'Project files'}
                    </h2>
                    <span className={`text-sm px-3 py-1 rounded-full ${files.length > 0 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-500/20 text-slate-400'}`}>
                        {files.length > 0
                            ? (locale === 'pt' ? `Arquivos enviados: ${files.length}` : `Files uploaded: ${files.length}`)
                            : (locale === 'pt' ? 'Nenhum arquivo enviado' : 'No files uploaded')}
                    </span>
                </div>
                {fileError && (
                    <p className="text-red-400 text-sm mb-3">{fileError}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white cursor-pointer text-sm font-medium">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {locale === 'pt' ? 'Enviar arquivo' : 'Upload file'}
                        <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                </div>
                {filesLoading ? (
                    <div className="flex items-center gap-2 text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">{locale === 'pt' ? 'Carregando...' : 'Loading...'}</span>
                    </div>
                ) : files.length === 0 ? (
                    <p className="text-slate-500 text-sm">{locale === 'pt' ? 'Nenhum arquivo enviado.' : 'No files uploaded.'}</p>
                ) : (
                    <ul className="space-y-2">
                        {files.map((f) => (
                            <li key={f.id} className="flex items-center justify-between gap-2 py-2 border-b border-white/5 last:border-0">
                                <span className="text-slate-300 text-sm truncate">{f.filename}</span>
                                <button
                                    type="button"
                                    onClick={() => handleDownload(f.id, f.filename)}
                                    className="flex items-center gap-1 text-blue-400 hover:underline text-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    {locale === 'pt' ? 'Baixar' : 'Download'}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    {locale === 'pt' ? 'Comunicação com a equipe' : 'Team communication'}
                </h2>
                <p className="text-slate-400 text-sm mb-4">
                    {locale === 'pt' ? 'Precisa de alterações neste projeto? Abra um chamado de modificação.' : 'Need changes on this project? Open a modification request.'}
                </p>
                <Link
                    href={`/${locale}/support?new=1&subject=${encodeURIComponent(locale === 'pt' ? `Modificação no projeto #${project.id}` : `Modification for project #${project.id}`)}&category=modificacao&project_id=${project.id}`}
                >
                    <motion.button whileHover={{ scale: 1.02 }} className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 rounded-lg text-sm font-medium">
                        {locale === 'pt' ? 'Solicitar modificação' : 'Request modification'}
                    </motion.button>
                </Link>
            </motion.div>
        </div>
    );
}

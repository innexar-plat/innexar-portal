'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
    FolderOpen, Clock, Palette, Eye, Rocket, CheckCircle2,
    ArrowRight, Calendar, ExternalLink, FileText
} from 'lucide-react';
import { useWorkspaceApi, workspaceFetch, getCustomerToken } from '@/lib/workspace-api';

interface Project {
    id: number;
    name: string;
    status: string;
    progress: number;
    created_at: string;
    expected_delivery: string | null;
    site_url: string | null;
    isCrm?: boolean;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    requested: { icon: Clock, color: 'blue', label: 'Solicitação Enviada' },
    pending_payment: { icon: Clock, color: 'yellow', label: 'Aguardando Pagamento' },
    paid: { icon: CheckCircle2, color: 'blue', label: 'Pagamento Confirmado' },
    onboarding_pending: { icon: FileText, color: 'orange', label: 'Onboarding' },
    building: { icon: Palette, color: 'purple', label: 'Em Desenvolvimento' },
    review: { icon: Eye, color: 'cyan', label: 'Pronto para Revisão' },
    delivered: { icon: Rocket, color: 'green', label: 'Entregue' },
    lead: { icon: Clock, color: 'blue', label: 'Lead' },
    qualificacao: { icon: Clock, color: 'blue', label: 'Qualificação' },
    proposta: { icon: FileText, color: 'orange', label: 'Proposta' },
    aprovado: { icon: CheckCircle2, color: 'blue', label: 'Aprovado' },
    em_planejamento: { icon: FileText, color: 'purple', label: 'Em Planejamento' },
    planejamento_concluido: { icon: CheckCircle2, color: 'purple', label: 'Planejamento Concluído' },
    em_desenvolvimento: { icon: Palette, color: 'purple', label: 'Em Desenvolvimento' },
    em_revisao: { icon: Eye, color: 'cyan', label: 'Em Revisão' },
    concluido: { icon: Rocket, color: 'green', label: 'Concluído' },
    cancelado: { icon: Clock, color: 'red', label: 'Cancelado' },
};

export default function ProjectsPage() {
    const locale = useLocale();
    const isWorkspaceApi = useWorkspaceApi();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            const token = getCustomerToken();
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                if (!isWorkspaceApi) {
                    setLoading(false);
                    return;
                }
                const res = await workspaceFetch('/api/portal/projects', { token });
                if (!res.ok) {
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.projects || []);
                setProjects(
                    list.map((p: { id: number; name: string; status: string; created_at?: string }) => ({
                        id: p.id,
                        name: p.name,
                        status: p.status,
                        progress: p.status === 'active' ? 50 : 0,
                        created_at: p.created_at || '',
                        expected_delivery: null,
                        site_url: null,
                        isCrm: true,
                    }))
                );
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [isWorkspaceApi]);

    const getProgressFromStatus = (status: string): number => {
        const progressMap: Record<string, number> = {
            pending_payment: 0, paid: 25, onboarding_pending: 25,
            building: 50, review: 75, delivered: 100,
        };
        return progressMap[status] || 0;
    };

    const getColorClasses = (color: string) => {
        const colors: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
            yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', gradient: 'from-yellow-500 to-orange-500' },
            blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', gradient: 'from-blue-500 to-cyan-500' },
            orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400', gradient: 'from-orange-500 to-red-500' },
            purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400', gradient: 'from-purple-500 to-pink-500' },
            cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400', gradient: 'from-cyan-500 to-blue-500' },
            green: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400', gradient: 'from-green-500 to-emerald-500' },
            red: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', gradient: 'from-red-500 to-rose-500' },
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

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{locale === 'pt' ? 'Meus Projetos' : 'My Projects'}</h1>
                    <p className="text-slate-400">{locale === 'pt' ? 'Veja e gerencie todos os seus projetos de site.' : 'View and manage all your website projects.'}</p>
                </div>
                <Link
                    href={`/${locale}/new-project`}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-medium"
                >
                    {locale === 'pt' ? 'Novo Projeto' : 'New Project'}
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Projects Grid */}
            {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projects.map((project, i) => {
                        const status = statusConfig[project.status] || statusConfig.building;
                        const colors = getColorClasses(status.color);
                        const Icon = status.icon;

                        return (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                                        <Icon className={`w-6 h-6 ${colors.text}`} />
                                    </div>
                                    {project.site_url && (
                                        <a
                                            href={project.site_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4 text-slate-400" />
                                        </a>
                                    )}
                                </div>

                                {/* Info */}
                                <h3 className="text-xl font-bold text-white mb-2">{project.name}</h3>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
                                        {status.label}
                                    </span>
                                </div>

                                {/* Progress */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-400">{locale === 'pt' ? 'Progresso' : 'Progress'}</span>
                                        <span className="text-white font-medium">{project.progress}%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${project.progress}%` }}
                                            transition={{ duration: 1, delay: i * 0.1 }}
                                            className={`h-full bg-gradient-to-r ${colors.gradient}`}
                                        />
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-1 text-slate-400">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            {project.expected_delivery
                                                ? new Date(project.expected_delivery).toLocaleDateString()
                                                : project.created_at
                                                    ? new Date(project.created_at).toLocaleDateString()
                                                    : '-'}
                                        </span>
                                        {project.isCrm && (
                                            <span className="ml-2 px-2 py-0.5 rounded bg-white/10 text-slate-400 text-xs">
                                                {locale === 'pt' ? 'Desenvolvimento' : 'Development'}
                                            </span>
                                        )}
                                    </div>
                                    {!project.isCrm && (
                                        <Link
                                            href={`/${locale}/projects/${project.id}`}
                                            className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                                        >
                                            {locale === 'pt' ? 'Detalhes' : 'Details'}
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FolderOpen className="w-10 h-10 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{locale === 'pt' ? 'Nenhum Projeto Ainda' : 'No Projects Yet'}</h2>
                    <p className="text-slate-400 mb-6">{locale === 'pt' ? 'Comece sua jornada digital hoje mesmo.' : 'Start your digital journey today.'}</p>
                    <Link
                        href={`/${locale}/new-project`}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-medium"
                    >
                        {locale === 'pt' ? 'Iniciar Meu Primeiro Projeto' : 'Start Your First Project'}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            )}
        </div>
    );
}

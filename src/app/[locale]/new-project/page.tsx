'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
    Rocket, Globe, Smartphone, ShoppingCart, Palette, Code,
    CheckCircle2, ArrowRight, Loader2
} from 'lucide-react';
import { useWorkspaceApi, workspaceFetch, getCustomerToken } from '@/lib/workspace-api';

const projectTypes = [
    { id: 'website', label: 'Site Institucional', icon: Globe, description: 'Site profissional para o seu negócio' },
    { id: 'landing', label: 'Landing Page', icon: Rocket, description: 'Página de alta conversão' },
    { id: 'ecommerce', label: 'E-Commerce', icon: ShoppingCart, description: 'Loja online com pagamentos' },
    { id: 'webapp', label: 'Aplicação Web', icon: Code, description: 'Aplicação web personalizada' },
    { id: 'mobile', label: 'App Mobile', icon: Smartphone, description: 'App para iOS e Android' },
    { id: 'custom', label: 'Projeto Customizado', icon: Palette, description: 'Algo único' },
];

export default function NewProjectPage() {
    const router = useRouter();
    const locale = useLocale();
    const isWorkspaceApi = useWorkspaceApi();
    const [step, setStep] = useState(1);
    const [projectType, setProjectType] = useState('');
    const [projectName, setProjectName] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState('');
    const [timeline, setTimeline] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (!isWorkspaceApi) {
                alert('Portal requer Workspace API. Configure NEXT_PUBLIC_USE_WORKSPACE_API e NEXT_PUBLIC_WORKSPACE_API_URL.');
                setSubmitting(false);
                return;
            }
            const token = getCustomerToken();
            if (!token) {
                alert('Faça login para enviar a solicitação.');
                setSubmitting(false);
                return;
            }
            const response = await workspaceFetch('/api/portal/new-project', {
                method: 'POST',
                token,
                body: JSON.stringify({
                    project_name: projectName,
                    project_type: projectType,
                    description: description || undefined,
                    budget: budget || undefined,
                    timeline: timeline || undefined,
                }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                alert(`Erro ao submeter: ${typeof data.detail === 'string' ? data.detail : 'Erro desconhecido'}`);
                setSubmitting(false);
                return;
            }
            setSubmitted(true);
        } catch (error) {
            console.error("Submission error:", error);
            alert("Erro de conexão. Tente novamente.");
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
                <h2 className="text-2xl font-bold text-white mb-2">Solicitação Enviada!</h2>
                <p className="text-slate-400 mb-6">
                    Analisaremos sua solicitação de projeto e entraremos em contato em até 24 horas.
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
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Solicitar Novo Projeto</h1>
                <p className="text-slate-400">Conte-nos sobre seu projeto e vamos começar.</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-4">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
              ${step >= s ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-white/10 text-slate-400'}`}
                        >
                            {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                        </div>
                        {s < 3 && <div className={`w-20 h-1 rounded-full ${step > s ? 'bg-blue-500' : 'bg-white/10'}`} />}
                    </div>
                ))}
            </div>

            {/* Form */}
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
            >
                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-white">Qual o tipo de projeto?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {projectTypes.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <motion.button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setProjectType(type.id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`p-4 rounded-xl border text-left transition-all
                      ${projectType === type.id
                                                ? 'bg-blue-500/20 border-blue-500/50'
                                                : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                                    >
                                        <Icon className={`w-6 h-6 mb-3 ${projectType === type.id ? 'text-blue-400' : 'text-slate-400'}`} />
                                        <p className="text-white font-medium">{type.label}</p>
                                        <p className="text-slate-400 text-sm">{type.description}</p>
                                    </motion.button>
                                );
                            })}
                        </div>
                        <div className="flex justify-end">
                            <motion.button
                                type="button"
                                onClick={() => setStep(2)}
                                disabled={!projectType}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-medium disabled:opacity-50"
                            >
                                Continuar
                                <ArrowRight className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-white">Detalhes do Projeto</h2>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Nome do Projeto</label>
                            <input
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                                placeholder="Meu Projeto Incrível"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 resize-none"
                                placeholder="Conte-nos sobre seu projeto, objetivos e requisitos específicos..."
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium"
                            >
                                Voltar
                            </button>
                            <motion.button
                                type="button"
                                onClick={() => setStep(3)}
                                disabled={!projectName}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-medium disabled:opacity-50"
                            >
                                Continue
                                <ArrowRight className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <h2 className="text-xl font-bold text-white">Orçamento e Prazo</h2>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Faixa de Orçamento</label>
                            <select
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                            >
                                <option value="" className="bg-slate-900">Selecione uma faixa</option>
                                <option value="small" className="bg-slate-900">R$ 1.500 - R$ 5.000</option>
                                <option value="medium" className="bg-slate-900">R$ 5.000 - R$ 15.000</option>
                                <option value="large" className="bg-slate-900">R$ 15.000 - R$ 50.000</option>
                                <option value="enterprise" className="bg-slate-900">R$ 50.000+</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Prazo Desejado</label>
                            <select
                                value={timeline}
                                onChange={(e) => setTimeline(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                            >
                                <option value="" className="bg-slate-900">Selecione o prazo</option>
                                <option value="asap" className="bg-slate-900">O quanto antes</option>
                                <option value="2weeks" className="bg-slate-900">Em até 2 semanas</option>
                                <option value="1month" className="bg-slate-900">Em até 1 mês</option>
                                <option value="flexible" className="bg-slate-900">Flexível</option>
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium"
                            >
                                Voltar
                            </button>
                            <motion.button
                                type="submit"
                                disabled={submitting}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-medium disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        Enviar Solicitação
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </form>
                )}
            </motion.div>
        </div>
    );
}

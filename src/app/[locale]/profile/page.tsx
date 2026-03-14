'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Save, Loader2, CheckCircle2, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useWorkspaceApi, workspaceFetch, getCustomerToken } from '@/lib/workspace-api';

interface CustomerProfile {
    name: string;
    email: string;
    phone: string | null;
    address: Record<string, string> | null;
}

const emptyProfile: CustomerProfile = {
    name: '',
    email: '',
    phone: null,
    address: null,
};

export default function ProfilePage() {
    const [profile, setProfile] = useState<CustomerProfile>(emptyProfile);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const isWorkspaceApi = useWorkspaceApi();

    useEffect(() => {
        const load = async () => {
            if (!isWorkspaceApi) {
                const email = localStorage.getItem('customer_email') || '';
                setProfile(prev => ({ ...prev, email, name: email.split('@')[0] || '' }));
                setLoading(false);
                return;
            }
            const token = getCustomerToken();
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const res = await workspaceFetch('/api/portal/me/profile', { token });
                if (res.ok) {
                    const data = await res.json() as CustomerProfile;
                    setProfile({
                        name: data.name ?? '',
                        email: data.email ?? '',
                        phone: data.phone ?? null,
                        address: data.address ?? null,
                    });
                } else {
                    setProfile(prev => ({ ...prev, email: localStorage.getItem('customer_email') || '' }));
                }
            } catch {
                setProfile(prev => ({ ...prev, email: localStorage.getItem('customer_email') || '' }));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [isWorkspaceApi]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        const token = getCustomerToken();
        if (!isWorkspaceApi || !token) {
            setError('Não foi possível salvar. Faça login novamente.');
            setSaving(false);
            return;
        }
        try {
            const res = await workspaceFetch('/api/portal/me/profile', {
                method: 'PATCH',
                token,
                body: JSON.stringify({
                    name: profile.name.trim(),
                    phone: profile.phone?.trim() || null,
                    address: profile.address && Object.keys(profile.address).length > 0 ? profile.address : null,
                }),
            });
            if (res.ok) {
                const data = await res.json() as CustomerProfile;
                setProfile({
                    name: data.name ?? '',
                    email: data.email ?? '',
                    phone: data.phone ?? null,
                    address: data.address ?? null,
                });
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                const data = await res.json().catch(() => ({}));
                setError(typeof (data as { detail?: string }).detail === 'string' ? (data as { detail: string }).detail : 'Erro ao salvar');
            }
        } catch {
            setError('Erro de conexão.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
                <p className="text-slate-400">Manage your account information.</p>
            </div>

            {/* Avatar Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">
                            {profile.name[0]?.toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">{profile.name || 'User'}</h2>
                        <p className="text-slate-400">{profile.email}</p>
                    </div>
                </div>
            </motion.div>

            {/* Profile Form */}
            <motion.form
                onSubmit={handleSave}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6"
            >
                <h2 className="text-lg font-bold text-white">Informações pessoais</h2>

                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nome</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                                placeholder="Seu nome"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">E-mail</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                readOnly
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 cursor-not-allowed"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">E-mail não pode ser alterado</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Telefone</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="tel"
                                value={profile.phone ?? ''}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value.trim() || null })}
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                                placeholder="+55 (11) 99999-9999"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Endereço</label>
                    <div className="grid gap-2">
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Rua"
                                value={profile.address?.street ?? ''}
                                onChange={(e) => setProfile({
                                    ...profile,
                                    address: { ...(profile.address ?? {}), street: e.target.value },
                                })}
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                placeholder="Número"
                                value={profile.address?.number ?? ''}
                                onChange={(e) => setProfile({
                                    ...profile,
                                    address: { ...(profile.address ?? {}), number: e.target.value },
                                })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500"
                            />
                            <input
                                type="text"
                                placeholder="CEP"
                                value={profile.address?.postal_code ?? ''}
                                onChange={(e) => setProfile({
                                    ...profile,
                                    address: { ...(profile.address ?? {}), postal_code: e.target.value },
                                })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500"
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="Complemento"
                            value={profile.address?.complement ?? ''}
                            onChange={(e) => setProfile({
                                ...profile,
                                address: { ...(profile.address ?? {}), complement: e.target.value },
                            })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                placeholder="Cidade"
                                value={profile.address?.city ?? ''}
                                onChange={(e) => setProfile({
                                    ...profile,
                                    address: { ...(profile.address ?? {}), city: e.target.value },
                                })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500"
                            />
                            <input
                                type="text"
                                placeholder="Estado"
                                value={profile.address?.state ?? ''}
                                onChange={(e) => setProfile({
                                    ...profile,
                                    address: { ...(profile.address ?? {}), state: e.target.value },
                                })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-4">
                    <motion.button
                        type="submit"
                        disabled={saving}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-medium disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Salvando...
                            </>
                        ) : saved ? (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Salvo!
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Salvar alterações
                            </>
                        )}
                    </motion.button>
                </div>
            </motion.form>

            {/* Security Section - Alterar senha */}
            <SecuritySection />
        </div>
    );
}

function SecuritySection() {
    const isWorkspaceApi = useWorkspaceApi();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setError('Nova senha deve ter no mínimo 6 caracteres.');
            return;
        }
        setError('');
        setSuccess(false);
        setLoading(true);
        const token = getCustomerToken();
        if (!token || !isWorkspaceApi) {
            setError('Não foi possível alterar a senha. Faça login novamente.');
            setLoading(false);
            return;
        }
        try {
            const res = await workspaceFetch('/api/portal/me/password', {
                method: 'PATCH',
                token,
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setSuccess(true);
                setCurrentPassword('');
                setNewPassword('');
            } else {
                setError(typeof data.detail === 'string' ? data.detail : 'Erro ao alterar senha.');
            }
        } catch {
            setError('Erro de conexão.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
            <h2 className="text-lg font-bold text-white mb-4">Segurança</h2>
            {!isWorkspaceApi ? (
                <p className="text-slate-400 text-sm">Alteração de senha disponível quando o portal está conectado ao Workspace.</p>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">Senha alterada com sucesso.</p>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Senha atual</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                                placeholder="••••••••"
                            />
                            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Nova senha (mín. 6 caracteres)</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                                placeholder="••••••••"
                            />
                            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-medium disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Alterar senha
                    </button>
                </form>
            )}
        </motion.div>
    );
}

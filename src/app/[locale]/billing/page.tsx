'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { Receipt, Download, CheckCircle2, Clock, CreditCard, Calendar } from 'lucide-react';
import { useWorkspaceApi, workspaceFetch, getCustomerToken, getWorkspaceApiBase } from '@/lib/workspace-api';
import { PaymentBrickModal } from '@/components/PaymentBrickModal';

interface Invoice {
    id: number;
    project_name: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue' | 'sent' | 'draft';
    date: string;
    due_date: string;
    isErp?: boolean;
}

type StatusFilter = 'all' | 'pending' | 'paid';

const MP_PUBLIC_KEY = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? '') : (process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? '');

export default function BillingPage() {
    const locale = useLocale();
    const isWorkspaceApi = useWorkspaceApi();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    useEffect(() => {
        const fetchInvoices = async () => {
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
                const res = await workspaceFetch('/api/portal/invoices', { token });
                if (!res.ok) {
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.invoices || []);
                setInvoices(
                    list.map((inv: { id: number; status: string; due_date?: string; total: number }) => ({
                        id: inv.id,
                        project_name: `Fatura #${inv.id}`,
                        amount: Number(inv.total),
                        status: (inv.status === 'paid' ? 'paid' : inv.status === 'overdue' ? 'overdue' : 'pending') as Invoice['status'],
                        date: inv.due_date || '',
                        due_date: inv.due_date || '',
                        isErp: true,
                    }))
                );
            } catch (error) {
                console.error('Error fetching invoices:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoices();
    }, [isWorkspaceApi, refreshTrigger]);

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { icon: React.ElementType; color: string; label: string; bg: string }> = {
            paid: { icon: CheckCircle2, color: 'text-green-400', label: locale === 'pt' ? 'Pago' : 'Paid', bg: 'bg-green-500/20' },
            pending: { icon: Clock, color: 'text-yellow-400', label: locale === 'pt' ? 'Pendente' : 'Pending', bg: 'bg-yellow-500/20' },
            requested: { icon: Clock, color: 'text-blue-400', label: locale === 'pt' ? 'Solicitação Enviada' : 'Request Sent', bg: 'bg-blue-500/20' },
            overdue: { icon: Clock, color: 'text-red-400', label: locale === 'pt' ? 'Atrasado' : 'Overdue', bg: 'bg-red-500/20' },
        };
        return configs[status] || configs.pending;
    };

    const filteredInvoices = statusFilter === 'all'
        ? invoices
        : statusFilter === 'paid'
            ? invoices.filter(i => i.status === 'paid')
            : invoices.filter(i => i.status !== 'paid');
    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
    const totalPending = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0);

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
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                    {locale === 'pt' ? 'Faturamento e Faturas' : 'Billing & Invoices'}
                </h1>
                <p className="text-slate-400">
                    {locale === 'pt' ? 'Veja seu histórico de pagamentos e faturas.' : 'View your payment history and invoices.'}
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: locale === 'pt' ? 'Total Pago' : 'Total Paid', value: `R$ ${totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: CheckCircle2, color: 'green' },
                    { label: locale === 'pt' ? 'Pendente' : 'Pending', value: `R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Clock, color: 'yellow' },
                    { label: locale === 'pt' ? 'Total de Faturas' : 'Total Invoices', value: invoices.length, icon: Receipt, color: 'blue' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-slate-400 text-sm">{stat.label}</span>
                            <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center`}>
                                <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Invoices Table */}
            {invoices.length > 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
                        <h2 className="text-xl font-bold text-white">
                            {locale === 'pt' ? 'Histórico de Faturas' : 'Invoice History'}
                        </h2>
                        <div className="flex rounded-xl bg-white/5 border border-white/10 p-1">
                            {([
                                { value: 'all' as const, label: locale === 'pt' ? 'Todos' : 'All' },
                                { value: 'pending' as const, label: locale === 'pt' ? 'Pendentes' : 'Pending' },
                                { value: 'paid' as const, label: locale === 'pt' ? 'Pagos' : 'Paid' },
                            ]).map(({ value, label }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setStatusFilter(value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === value ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">{locale === 'pt' ? 'Fatura' : 'Invoice'}</th>
                                    <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">{locale === 'pt' ? 'Projeto' : 'Project'}</th>
                                    <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">{locale === 'pt' ? 'Data' : 'Date'}</th>
                                    <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">{locale === 'pt' ? 'Valor' : 'Amount'}</th>
                                    <th className="text-left px-6 py-4 text-slate-400 font-medium text-sm">Status</th>
                                    <th className="text-right px-6 py-4 text-slate-400 font-medium text-sm">{locale === 'pt' ? 'Ações' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                            {locale === 'pt' ? 'Nenhuma fatura com esse filtro.' : 'No invoices match this filter.'}
                                        </td>
                                    </tr>
                                ) : filteredInvoices.map((invoice) => {
                                    const status = getStatusConfig(invoice.status);
                                    const Icon = status.icon;

                                    return (
                                        <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="text-white font-medium">INV-{invoice.id.toString().padStart(4, '0')}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-300">{invoice.project_name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-400 text-sm flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(invoice.date).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-white font-medium">R$ {invoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                                    <Icon className="w-3 h-3" />
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                {invoice.isErp && invoice.status !== 'paid' && MP_PUBLIC_KEY && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const token = getCustomerToken();
                                                            if (!token) return;
                                                            setPaymentModalInvoice(invoice);
                                                        }}
                                                        className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 disabled:opacity-50"
                                                    >
                                                        {locale === 'pt' ? 'Pagar' : 'Pay'}
                                                    </button>
                                                )}
                                                {invoice.isErp && invoice.status !== 'paid' && !MP_PUBLIC_KEY && (
                                                    <span className="text-slate-500 text-sm" title={locale === 'pt' ? 'Pagamento não configurado' : 'Payment not configured'}>
                                                        {locale === 'pt' ? 'Pagamento não configurado' : 'Payment not configured'}
                                                    </span>
                                                )}
                                                {isWorkspaceApi && (
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            const token = getCustomerToken();
                                                            if (!token) return;
                                                            try {
                                                                const res = await workspaceFetch(
                                                                    `/api/portal/invoices/${invoice.id}/download`,
                                                                    { token }
                                                                );
                                                                if (!res.ok) return;
                                                                const html = await res.text();
                                                                const w = window.open('', '_blank');
                                                                if (w) {
                                                                    w.document.write(html);
                                                                    w.document.close();
                                                                }
                                                            } catch (e) {
                                                                console.error(e);
                                                            }
                                                        }}
                                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                                        title={locale === 'pt' ? 'Baixar / Imprimir fatura' : 'Download / Print invoice'}
                                                    >
                                                        <Download className="w-4 h-4 text-slate-400" />
                                                    </button>
                                                )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Receipt className="w-10 h-10 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {locale === 'pt' ? 'Nenhuma Fatura Ainda' : 'No Invoices Yet'}
                    </h2>
                    <p className="text-slate-400">
                        {locale === 'pt' ? 'Seu histórico de faturas aparecerá aqui.' : 'Your invoice history will appear here.'}
                    </p>
                </motion.div>
            )}

            {/* Payment Methods */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
                <h2 className="text-lg font-bold text-white mb-4">
                    {locale === 'pt' ? 'Métodos de Pagamento' : 'Payment Methods'}
                </h2>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-white font-medium">Stripe Payments</p>
                        <p className="text-slate-400 text-sm">
                            {locale === 'pt' ? 'Processamento de pagamento seguro' : 'Secure payment processing'}
                        </p>
                    </div>
                </div>
            </motion.div>

            {MP_PUBLIC_KEY && (
                <PaymentBrickModal
                    open={!!paymentModalInvoice}
                    onClose={() => setPaymentModalInvoice(null)}
                    invoice={paymentModalInvoice ? { id: paymentModalInvoice.id, total: paymentModalInvoice.amount, currency: 'BRL' } : null}
                    apiBase={getWorkspaceApiBase()}
                    getToken={getCustomerToken}
                    onSuccess={() => {
                        setPaymentModalInvoice(null);
                        setRefreshTrigger((t) => t + 1);
                    }}
                    mpPublicKey={MP_PUBLIC_KEY}
                />
            )}
        </div>
    );
}

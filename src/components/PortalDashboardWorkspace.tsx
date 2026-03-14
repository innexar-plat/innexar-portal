"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Package,
  Globe,
  Receipt,
  CreditCard,
  CheckCircle2,
  LayoutDashboard,
  MessageSquare,
  Bell,
  ExternalLink,
  Sparkles,
  ArrowRight,
  FolderOpen,
  FileText,
} from "lucide-react";
import { useLocale } from "next-intl";
import { workspaceFetch, getCustomerToken } from "@/lib/workspace-api";

interface ProjectSummary {
  id: number;
  name: string;
  status: string;
  created_at: string | null;
  has_files: boolean;
  files_count: number;
}

interface DashboardData {
  plan: {
    status: string;
    product_name: string;
    price_plan_name: string;
    since: string | null;
    next_due_date?: string | null;
  } | null;
  site: { url: string | null; status: string; domain?: string } | null;
  invoice: {
    id: number;
    status: string;
    due_date: string | null;
    total: number;
    currency: string;
  } | null;
  can_pay_invoice: boolean;
  panel: {
    login: string;
    panel_url: string | null;
    password_hint: string | null;
  } | null;
  support: { tickets_open_count: number };
  messages: { unread_count: number };
  projects?: ProjectSummary[];
  projects_aguardando_briefing?: ProjectSummary[];
}

export default function PortalDashboardWorkspace() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [payingId, setPayingId] = useState<number | null>(null);

  useEffect(() => {
    const token = getCustomerToken();
    const email =
      typeof window !== "undefined"
        ? localStorage.getItem("customer_email")
        : null;
    if (email) setCustomerName(email.split("@")[0]);
    if (!token) {
      setLoading(false);
      return;
    }
    workspaceFetch("/api/portal/me/dashboard", { token })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const handlePayInvoice = async (invoiceId: number) => {
    const token = getCustomerToken();
    if (!token) return;
    setPayingId(invoiceId);
    const base =
      typeof window !== "undefined" ? window.location.origin : "";
    const successUrl = `${base}/${locale}/billing?paid=1`;
    const cancelUrl = `${base}/${locale}/billing`;
    try {
      const res = await workspaceFetch(`/api/portal/invoices/${invoiceId}/pay`, {
        method: "POST",
        token,
        body: JSON.stringify({
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      });
      const json = await res.json();
      if (json.payment_url) {
        window.location.href = json.payment_url;
        return;
      }
    } finally {
      setPayingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isPt = locale === "pt";

  const aguardando = data?.projects_aguardando_briefing ?? [];
  const hasAguardandoBriefing = aguardando.length > 0;
  const showBriefingCta =
    checkoutSuccess || (data?.plan && !data?.site?.url) || hasAguardandoBriefing;

  return (
    <div className="space-y-8">
      {showBriefingCta && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border border-emerald-400/25 p-5 shadow-lg"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-semibold">
                  {checkoutSuccess
                    ? "Pagamento confirmado! 🎉"
                    : hasAguardandoBriefing
                      ? isPt
                        ? `Você tem ${aguardando.length} projeto(s) aguardando briefing`
                        : `You have ${aguardando.length} project(s) awaiting briefing`
                      : "Próximo passo"}
                </p>
                <p className="text-slate-400 text-sm mt-0.5">
                  Preencha os dados do seu site (nome, serviços, fotos) para
                  começarmos a construção.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                href={`/${locale}/site-briefing`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
              >
                <FileText className="w-4 h-4" />
                {isPt ? "Preencher dados do site" : "Fill site details"}
              </Link>
              {hasAguardandoBriefing && aguardando[0] && (
                <Link
                  href={`/${locale}/projects/${aguardando[0].id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 font-semibold hover:bg-cyan-500/30 transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  {isPt ? "Enviar arquivos" : "Upload files"}
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {((data?.projects?.length ?? 0) > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white/5 border border-white/10 p-5"
        >
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-cyan-400" />
            {isPt ? "Seus projetos" : "Your projects"}
          </h2>
          <ul className="space-y-2">
            {data!.projects!.map((proj) => (
              <li key={proj.id}>
                <Link
                  href={`/${locale}/projects/${proj.id}`}
                  className="flex items-center justify-between rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 text-white transition-colors"
                >
                  <span className="font-medium">{proj.name}</span>
                  <span className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="capitalize">{proj.status.replace(/_/g, " ")}</span>
                    {proj.files_count > 0 && (
                      <span className="text-cyan-400">
                        {proj.files_count} {isPt ? "arquivo(s)" : "file(s)"}
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-slate-400">Client Portal</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isPt ? "Olá" : "Hello"}
            {customerName ? `, ${customerName}` : ""}! 👋
          </h1>
          <p className="text-slate-400">
            {data?.plan || data?.site?.url
              ? isPt
                ? "Resumo do seu plano, site e fatura."
                : "Your plan, site and invoice summary."
              : isPt
                ? "Suas faturas, projetos e suporte."
                : "Your invoices, projects and support."}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-sm">
              {isPt ? "Plano" : "Plan"}
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          {data?.plan ? (
            <>
              <p className="text-white font-medium">
                {data.plan.product_name} – {data.plan.price_plan_name}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {isPt ? "Status" : "Status"}: {data.plan.status}
              </p>
              {data.plan.since && (
                <p className="text-slate-400 text-xs mt-1">
                  {isPt ? "Desde" : "Since"}:{" "}
                  {new Date(data.plan.since).toLocaleDateString()}
                </p>
              )}
              {data.plan.next_due_date && (
                <p className="text-slate-400 text-xs mt-1">
                  {isPt ? "Próximo venc." : "Next due"}:{" "}
                  {new Date(data.plan.next_due_date).toLocaleDateString()}
                </p>
              )}
            </>
          ) : (
            <p className="text-slate-400 text-sm">
              {isPt ? "Nenhum plano ativo" : "No active plan"}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-sm">
              {isPt ? "Site" : "Site"}
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          {data?.site?.url || data?.site?.domain ? (
            <>
              <a
                href={
                  data.site.url?.startsWith("http")
                    ? data.site.url
                    : `https://${data.site.domain || data.site.url || ""}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                {data.site.domain ||
                  data.site.url?.replace(/^https?:\/\//, "") ||
                  data.site.url}
                <ExternalLink className="w-3 h-3" />
              </a>
              <p className="text-slate-400 text-sm mt-1">{data.site.status}</p>
            </>
          ) : (
            <p className="text-slate-400 text-sm">
              {isPt ? "Nenhum site provisionado" : "No site provisioned"}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-sm">
              {isPt ? "Fatura" : "Invoice"}
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          {data?.invoice ? (
            <>
              <p className="text-white font-medium">
                #{data.invoice.id} – {data.invoice.status}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {data.invoice.currency} {data.invoice.total.toFixed(2)}
                {data.invoice.due_date &&
                  ` · ${isPt ? "Venc." : "Due"} ${new Date(data.invoice.due_date).toLocaleDateString()}`}
              </p>
              {data.can_pay_invoice && (
                <button
                  onClick={() => handlePayInvoice(data.invoice!.id)}
                  disabled={payingId !== null}
                  className="mt-3 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 flex items-center gap-2 disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  {payingId === data.invoice?.id
                    ? isPt
                      ? "Redirecionando..."
                      : "Redirecting..."
                    : isPt
                      ? "Pagar fatura"
                      : "Pay invoice"}
                </button>
              )}
            </>
          ) : (
            <p className="text-slate-400 text-sm">
              {isPt ? "Nenhuma fatura" : "No invoice"}
            </p>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data?.panel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <LayoutDashboard className="w-5 h-5 text-cyan-400" />
              <span className="text-slate-400 text-sm">
                {isPt ? "Painel" : "Panel"}
              </span>
            </div>
            <p className="text-white font-medium">{data.panel.login}</p>
            {data.panel.panel_url && (
              <a
                href={data.panel.panel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-sm"
              >
                {isPt ? "Abrir painel" : "Open panel"}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {data.panel.password_hint && (
              <p className="text-slate-500 text-xs mt-1">
                {data.panel.password_hint}
              </p>
            )}
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <Link href={`/${locale}/support`} className="block">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-5 h-5 text-green-400" />
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-white font-medium">
              {isPt ? "Suporte" : "Support"}
            </p>
            <p className="text-slate-400 text-sm">
              {data?.support?.tickets_open_count ?? 0}{" "}
              {isPt ? "tickets abertos" : "open tickets"}
            </p>
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <span className="text-slate-400 text-sm">
              {isPt ? "Mensagens" : "Messages"}
            </span>
          </div>
          <p className="text-white font-medium">
            {data?.messages?.unread_count ?? 0}{" "}
            {isPt ? "não lidas" : "unread"}
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href={`/${locale}/billing`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="group bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-6 flex items-center gap-4 transition-all cursor-pointer"
          >
            <Receipt className="w-10 h-10 text-blue-400" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">
                {isPt ? "Faturas" : "Invoices"}
              </h3>
              <p className="text-slate-400 text-sm">
                {isPt ? "Ver histórico e pagar" : "View history and pay"}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white" />
          </motion.div>
        </Link>
        <Link href={`/${locale}/projects`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="group bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-6 flex items-center gap-4 transition-all cursor-pointer"
          >
            <FolderOpen className="w-10 h-10 text-cyan-400" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">
                {isPt ? "Projetos" : "Projects"}
              </h3>
              <p className="text-slate-400 text-sm">
                {isPt ? "Acompanhar projetos" : "Track projects"}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white" />
          </motion.div>
        </Link>
        <Link href={`/${locale}/support`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="group bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-6 flex items-center gap-4 transition-all cursor-pointer"
          >
            <MessageSquare className="w-10 h-10 text-green-400" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">
                {isPt ? "Suporte" : "Support"}
              </h3>
              <p className="text-slate-400 text-sm">
                {isPt ? "Tickets e ajuda" : "Tickets and help"}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white" />
          </motion.div>
        </Link>
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Palette,
  Code,
  Eye,
  Rocket,
  CheckCircle2,
} from "lucide-react";

const PIPELINE_STEPS = [
  { key: "briefing", icon: FileText, labelPt: "Briefing recebido", labelEn: "Briefing received" },
  { key: "design", icon: Palette, labelPt: "Design em criação", labelEn: "Design in progress" },
  { key: "development", icon: Code, labelPt: "Desenvolvimento", labelEn: "Development" },
  { key: "review", icon: Eye, labelPt: "Revisão", labelEn: "Review" },
  { key: "delivery", icon: Rocket, labelPt: "Entrega final", labelEn: "Final delivery" },
] as const;

const STATUS_TO_STEP: Record<string, number> = {
  pending: 0,
  aguardando_briefing: 0,
  briefing_recebido: 1,
  design: 2,
  building: 3,
  active: 3,
  development: 3,
  review: 4,
  delivered: 5,
  completed: 5,
};

interface ProjectStatusPipelineProps {
  status: string;
  expectedDelivery?: string | null;
  locale?: string;
}

export default function ProjectStatusPipeline({
  status,
  expectedDelivery,
  locale = "pt",
}: ProjectStatusPipelineProps) {
  const currentStep = STATUS_TO_STEP[status] ?? 2;
  const isPt = locale === "pt";

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <Rocket className="w-5 h-5 text-blue-400" />
        {isPt ? "Status do Projeto" : "Project Status"}
      </h2>

      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10 rounded-full" />
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${Math.min((currentStep / (PIPELINE_STEPS.length - 1)) * 100, 100)}%`,
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
        />

        <div className="relative flex justify-between">
          {PIPELINE_STEPS.map((step, i) => {
            const isComplete = currentStep > i;
            const isCurrent = currentStep === i;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                    isComplete
                      ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg"
                      : isCurrent
                        ? "bg-white/20 ring-4 ring-blue-500/30"
                        : "bg-white/10"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <Icon
                      className={`w-5 h-5 ${
                        isComplete || isCurrent ? "text-white" : "text-slate-500"
                      }`}
                    />
                  )}
                </motion.div>
                <span
                  className={`mt-3 text-xs font-medium text-center max-w-[80px] ${
                    isComplete || isCurrent ? "text-white" : "text-slate-500"
                  }`}
                >
                  {isPt ? step.labelPt : step.labelEn}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {expectedDelivery && (
        <p className="mt-6 text-slate-400 text-sm text-center">
          {isPt ? "Entrega prevista:" : "Expected delivery:"}{" "}
          <span className="text-white font-medium">
            {new Date(expectedDelivery).toLocaleDateString(
              locale === "pt" ? "pt-BR" : "en-US"
            )}
          </span>
        </p>
      )}
    </div>
  );
}

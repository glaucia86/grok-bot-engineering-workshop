"use client";
import { useLocale } from "./locale-provider";
export function FeedbackLoading() { const { t } = useLocale(); return <div className="dashboard-state" role="status">{t("Loading feedback form…", "Carregando formulário…")}</div>; }

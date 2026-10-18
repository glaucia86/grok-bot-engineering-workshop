"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MessageSquare, Star } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader } from "./ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";
import { Button } from "./ui/button";
import { useLocale } from "./locale-provider";

export type TalkInsight = { talkId: string; count: number; average: number; distribution: number[]; comments: { text: string; date: string }[] };
type Load = { key: string; data?: TalkInsight; failed?: boolean };

export function TalkInsights({ talkId, revision = 0, header, comparison }: { talkId: string; revision?: number; header?: ReactNode; comparison?: ReactNode }) {
  const { locale, t, number } = useLocale();
  const chartConfig = { count: { label: t("Ratings", "Avaliações"), color: "#244be8" } };
  const percent = (count: number, total: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(total ? count / total * 100 : 0);
  const stars = (rating: number) => rating === 1 ? t("1 star", "1 estrela") : t(`${number(rating)} stars`, `${number(rating)} estrelas`);
  const ratings = (count: number) => count === 1 ? t("1 rating", "1 avaliação") : t(`${number(count)} ratings`, `${number(count)} avaliações`);
  const [attempt, setAttempt] = useState(0);
  const [load, setLoad] = useState<Load | null>(null);
  const key = `${talkId}:${revision}:${attempt}`;
  const current = load?.key === key ? load : null;
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`/api/feedback/insights?talkId=${encodeURIComponent(talkId)}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Details unavailable");
        const data: TalkInsight = await response.json();
        if (!controller.signal.aborted) setLoad({ key, data });
      } catch {
        if (!controller.signal.aborted) setLoad({ key, failed: true });
      }
    })();
    return () => controller.abort();
  }, [talkId, key]);

  const data = current?.data;
  const positive = data?.count ? Math.round((data.distribution[3] + data.distribution[4]) / data.count * 100) : null;
  const chartData = data ? [1,2,3,4,5].map(rating => ({ rating: String(rating), count: data.distribution[rating - 1], share: percent(data.distribution[rating - 1], data.count) })) : [];
  return <>
    <Card className="results-analytics" role="region" aria-label={t("Selected talk feedback", "Feedback da palestra selecionada")}>
      <CardHeader className="results-analytics-header">{header ?? <div className="results-selected-title"><p>{t("Selected talk", "Palestra selecionada")}</p><h3>{talkId}</h3></div>}</CardHeader>
      {!current ? <CardContent className="insight-loading" role="status"><p>{t("Loading rating details.", "Carregando detalhes das avaliações.")}</p><span aria-hidden="true" /></CardContent> : !data ? <CardContent className="insight-unavailable"><p role="status">{t("Rating details and comments couldn't load. The talk comparison is still available.", "Não foi possível carregar os detalhes das avaliações e os comentários. A comparação entre palestras continua disponível.")}</p><Button variant="outline" type="button" onClick={() => setAttempt(value => value + 1)}>{t("Retry details", "Tentar carregar detalhes novamente")}</Button></CardContent> : <CardContent className="results-analytics-body" data-sparse={data.count <= 1 ? "true" : undefined}>
        <div className="insight-summary">
          <p className="insight-eyebrow">{t("Average rating", "Avaliação média")}</p>
          <div className="insight-score"><div><strong>{data.count ? number(data.average, 1) : "—"}</strong><span>{t("out of 5", "de 5")}</span></div><p className="insight-favorable"><Star size={16} aria-hidden="true" />{positive === null ? t("No ratings yet", "Ainda não há avaliações") : t(`${number(positive)}% rated 4 or 5`, `${number(positive)}% avaliaram com 4 ou 5`)}</p></div>
          <p className="insight-sample">{data.count === 1 ? t("Based on 1 response. This is an early signal.", "Com base em 1 resposta. Este é um sinal inicial.") : data.count === 0 ? t("No responses have been recorded for this talk.", "Nenhuma resposta foi registrada para esta palestra.") : t(`Based on ${number(data.count)} responses.`, `Com base em ${number(data.count)} respostas.`)}</p>
          <p className="insight-context">{t("Every rating counts equally. Explore the spread to see the whole picture.", "Todas as avaliações têm o mesmo peso. Explore a distribuição para ter uma visão completa.")}</p>
        </div>
        <figure className="rating-distribution" aria-label={t(`Rating distribution for ${talkId}`, `Distribuição das avaliações de ${talkId}`)}>
          <figcaption><h4>{t("How the room rated it", "Como o público avaliou")}</h4><span>{t("Individual ratings · counts by score", "Avaliações individuais · quantidade por nota")}</span></figcaption>
          <ChartContainer config={chartConfig} className="distribution-chart" initialDimension={{ width: 640, height: 230 }}>
            <BarChart accessibilityLayer data={chartData} margin={{ top: 16, right: 12, left: -20, bottom: 0 }} barSize={48}>
              <CartesianGrid vertical={false} stroke="#e5eaf2" />
              <XAxis dataKey="rating" tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: "#59657c", fontSize: 13 }} />
              <YAxis tickFormatter={value => number(Number(value))} domain={[0, Math.max(data.count, 1)]} allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#59657c", fontSize: 12 }} width={48} />
              <ChartTooltip cursor={{ fill: "#eef2ff" }} content={<ChartTooltipContent hideLabel formatter={(value, _name, item) => <span>{stars(Number(item.payload.rating))}: {ratings(Number(value))} ({item.payload.share}%)</span>} />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[6,6,0,0]} isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
          <ul className="distribution-values" aria-label={t("Rating distribution", "Distribuição das avaliações")}>{chartData.map(bin => <li key={bin.rating} aria-label={`${stars(Number(bin.rating))}: ${ratings(bin.count)} (${bin.share}%)`}><span className="distribution-rating">{stars(Number(bin.rating))}</span><strong>{number(bin.count)}</strong><span className="distribution-percentage">{bin.share}%</span></li>)}</ul>
          <p>{t("Counts include responses without written comments.", "As contagens incluem respostas sem comentários escritos.")}</p>
        </figure>
      </CardContent>}
    </Card>
    <div className="results-bottom-grid">
      {comparison}
      <Card className="talk-comments" role="region" aria-labelledby="comments-heading">
        <CardHeader className="results-card-header"><header><div><h3 id="comments-heading"><MessageSquare size={18} aria-hidden="true" />{t("Written feedback", "Feedback por escrito")}</h3><p>{t("Comments for the selected talk.", "Comentários sobre a palestra selecionada.")}</p></div><span>{data ? t(`${number(data.comments.length)} ${data.comments.length === 1 ? "comment" : "comments"}`, `${number(data.comments.length)} ${data.comments.length === 1 ? "comentário" : "comentários"}`) : "—"}</span></header></CardHeader>
        <CardContent className="comments-content">{!current ? <p className="comments-empty">{t("Loading comments…", "Carregando comentários…")}</p> : !data ? <p className="comments-empty">{t("Comments will be available when rating details load.", "Os comentários estarão disponíveis quando os detalhes das avaliações forem carregados.")}</p> : data.comments.length ? <ul aria-label={t("Written feedback comments", "Comentários escritos")} tabIndex={0}>{data.comments.map((comment, index) => <li key={`${comment.date}:${index}`}><p>{comment.text}</p><time dateTime={comment.date}>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(comment.date))}</time></li>)}</ul> : <div className="comments-empty"><MessageSquare size={24} aria-hidden="true" /><p>{t("No written comments yet.", "Ainda não há comentários escritos.")}</p><span>{t("Ratings are included even when a comment isn't provided.", "As avaliações são incluídas mesmo quando não há comentário.")}</span></div>}</CardContent>
      </Card>
    </div>
  </>;
}

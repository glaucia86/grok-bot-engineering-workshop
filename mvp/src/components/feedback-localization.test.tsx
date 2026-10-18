// @vitest-environment happy-dom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { LocaleProvider, useLocale } from "./locale-provider";
import { FeedbackForm } from "./feedback-form";
import { FeedbackPage } from "./feedback-page";
import { FeedbackDashboard, TalkResults } from "./feedback-dashboard";
import { TalkInsights } from "./talk-insights";

function LanguageControl() {
  const { setLocale } = useLocale();
  return <><button onClick={() => setLocale("en-US")}>English test control</button><button onClick={() => setLocale("pt-BR")}>Portuguese test control</button></>;
}
function renderPortuguese(children: React.ReactNode) {
  localStorage.setItem("talkfeedback-locale", "pt-BR");
  return render(<LocaleProvider><LanguageControl />{children}</LocaleProvider>);
}
function fillPortuguese() {
  fireEvent.change(screen.getByLabelText("Palestra"), { target: { value: "  Workshop  " } });
  fireEvent.change(screen.getByLabelText("Seu nome"), { target: { value: "  Ana  " } });
  fireEvent.click(screen.getByRole("radio", { name: "5 estrelas" }));
}
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("translates the feedback route, guidance and accessible form fields", () => {
  renderPortuguese(<FeedbackPage initialRating={4} />);
  expect(screen.getByRole("heading", { name: "Deixe seu feedback", level: 1 })).toBeTruthy();
  expect(screen.getByRole("form", { name: "Como foi a palestra?" })).toBeTruthy();
  expect((screen.getByLabelText("Seu nome") as HTMLInputElement).required).toBe(true);
  expect((screen.getByLabelText("Comentário (opcional)") as HTMLTextAreaElement).required).toBe(false);
  expect(screen.getByRole("complementary", { name: "Faça seu feedback valer" })).toBeTruthy();
  expect(screen.getByText("Seja específico")).toBeTruthy();
  expect(screen.getByText("Mantenha um tom construtivo")).toBeTruthy();
  expect(screen.getByText("Compartilhe o que ajudou")).toBeTruthy();
  expect((screen.getByRole("radio", { name: "4 estrelas" }) as HTMLInputElement).checked).toBe(true);
  expect(screen.getByText("4 de 5 estrelas selecionadas")).toBeTruthy();
});

it("translates client validation while preserving required fields and error focus", async () => {
  vi.stubGlobal("fetch", vi.fn());
  renderPortuguese(<FeedbackForm onSaved={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "Enviar feedback" }));
  expect(screen.getByText("Informe a palestra.")).toBeTruthy();
  expect(screen.getByText("Informe seu nome.")).toBeTruthy();
  expect(screen.getByText("Escolha uma avaliação de 1 a 5 estrelas.")).toBeTruthy();
  await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Palestra")));
});

it("localizes server errors at render time and preserves input across language changes", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ errors: { comment: "comment must be at most 1000 characters" } }), { status: 400 })));
  renderPortuguese(<FeedbackForm onSaved={() => {}} />);
  fillPortuguese();
  fireEvent.change(screen.getByLabelText("Comentário (opcional)"), { target: { value: "Keep these words" } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar feedback" }));
  expect(await screen.findByText("O comentário deve ter no máximo 1.000 caracteres.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "English test control" }));
  expect(screen.getByText("comment must be at most 1000 characters")).toBeTruthy();
  expect((screen.getByLabelText("Comment (optional)") as HTMLTextAreaElement).value).toBe("Keep these words");
  expect((screen.getByRole("radio", { name: "5 stars" }) as HTMLInputElement).checked).toBe(true);
});

it.each(["Unknown future validation", "__proto__", "constructor"])("keeps unknown server field errors safe and readable in Portuguese (%s)", async message => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ errors: { author: message } }), { status: 400 })));
  renderPortuguese(<FeedbackForm onSaved={() => {}} />);
  fillPortuguese();
  fireEvent.click(screen.getByRole("button", { name: "Enviar feedback" }));
  expect(await screen.findByText("Confira este campo e tente novamente.")).toBeTruthy();
  expect((screen.getByLabelText("Seu nome") as HTMLInputElement).value).toBe("  Ana  ");
});

it("translates failures and retries without changing the POST payload", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response("Unavailable", { status: 503 }));
  vi.stubGlobal("fetch", fetcher);
  renderPortuguese(<FeedbackForm onSaved={() => {}} />);
  fillPortuguese();
  fireEvent.click(screen.getByRole("button", { name: "Enviar feedback" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Não foi possível salvar seu feedback. Suas respostas continuam aqui. Tente novamente.");
  expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeTruthy();
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ talkId: "Workshop", author: "Ana", comment: "", rating: 5 });
  fireEvent.click(screen.getByRole("button", { name: "English test control" }));
  expect(screen.getByRole("alert").textContent).toContain("Your entries are still here");
});

it("translates saved confirmation and the result link", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 1, talkId: "Workshop", author: "Ana", comment: "", rating: 5, createdAt: "2026-10-18T12:00:00Z" }), { status: 201 })));
  renderPortuguese(<FeedbackForm onSaved={() => {}} resultsHref="/results" />);
  fillPortuguese();
  fireEvent.click(screen.getByRole("button", { name: "Enviar feedback" }));
  expect(await screen.findByText("Feedback salvo. Obrigado por ajudar a melhorar a próxima palestra.")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Ver resultados" }).getAttribute("href")).toBe("/results");
  expect(screen.getByText("Nenhuma avaliação selecionada")).toBeTruthy();
});

it("translates loading, failed refresh and stale results without refetching for locale", async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(new Response('[{"talkId":"Workshop","average":4.3,"count":1234}]')).mockResolvedValueOnce(new Response("Unavailable", { status: 503 }));
  vi.stubGlobal("fetch", fetcher);
  const { rerender } = renderPortuguese(<FeedbackDashboard />);
  expect(screen.getByRole("status").textContent).toBe("Carregando feedback.");
  expect(await screen.findByRole("table", { name: "Resumo do feedback das palestras" })).toBeTruthy();
  expect(screen.getByText("4,3", { selector: "td" })).toBeTruthy();
  expect(screen.getByText("1.234", { selector: ".dashboard-count" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "English test control" }));
  expect(screen.getByText("4.3", { selector: "td" })).toBeTruthy();
  expect(fetcher).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Portuguese test control" }));
  rerender(<LocaleProvider><LanguageControl /><FeedbackDashboard revision={1} /></LocaleProvider>);
  expect(screen.getByRole("status").textContent).toBe("Atualizando resultados…");
  expect((await screen.findByRole("alert")).textContent).toContain("Feedback salvo. Não foi possível atualizar os resultados. Tente novamente.");
  expect(screen.getByText("Resultados carregados anteriormente. Eles podem não incluir seu feedback mais recente.")).toBeTruthy();
});

it("translates the empty dashboard and tied-leader counts", () => {
  const { rerender } = renderPortuguese(<TalkResults talks={[]} feedbackHref="/feedback" />);
  expect(screen.getByRole("heading", { name: "Ainda não há feedback" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Deixe seu feedback" }).getAttribute("href")).toBe("/feedback");
  rerender(<LocaleProvider><TalkResults talks={[{ talkId: "One", average: 4.3, count: 2 }, { talkId: "Two", average: 3, count: 2 }]} /></LocaleProvider>);
  const overview = screen.getByLabelText("Resumo das respostas do workshop");
  expect(within(overview).getByText("Palestras mais avaliadas")).toBeTruthy();
  expect(within(overview).getByText("2 empatadas")).toBeTruthy();
  expect(within(overview).getByText("2 avaliações cada")).toBeTruthy();
  expect(screen.getByLabelText("Explore uma palestra")).toBeTruthy();
});

it("translates insights, exact distribution, percentages and UTC dates without changing comments", async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ talkId: "Workshop", count: 3, average: 4.3, distribution: [0, 0, 0, 2, 1], comments: [{ text: "Original attendee words", date: "2026-10-16T00:30:00Z" }] })));
  vi.stubGlobal("fetch", fetcher);
  const { container } = renderPortuguese(<TalkInsights talkId="Workshop" />);
  expect(screen.getByText("Carregando detalhes das avaliações.")).toBeTruthy();
  expect(await screen.findByText("Original attendee words")).toBeTruthy();
  expect(screen.getByRole("figure", { name: "Distribuição das avaliações de Workshop" })).toBeTruthy();
  expect(screen.getByRole("listitem", { name: "5 estrelas: 1 avaliação (33,3%)" })).toBeTruthy();
  expect(screen.getByText("100% avaliaram com 4 ou 5")).toBeTruthy();
  expect(container.querySelector(".insight-score strong")?.textContent).toBe("4,3");
  const comments = screen.getByRole("list", { name: "Comentários escritos" });
  expect(comments.querySelector("time")?.textContent).toBe("16 de out. de 2026");
  fireEvent.click(screen.getByRole("button", { name: "English test control" }));
  expect(screen.getByRole("listitem", { name: "5 stars: 1 rating (33.3%)" })).toBeTruthy();
  expect(comments.querySelector("time")?.textContent).toBe("Oct 16, 2026");
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it("translates unavailable insights, detail retry and honest empty results", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("Unavailable", { status: 503 })).mockResolvedValueOnce(new Response(JSON.stringify({ talkId: "Workshop", count: 0, average: 0, distribution: [0, 0, 0, 0, 0], comments: [] }))));
  renderPortuguese(<TalkInsights talkId="Workshop" />);
  fireEvent.click(await screen.findByRole("button", { name: "Tentar carregar detalhes novamente" }));
  expect(await screen.findByText("Ainda não há comentários escritos.")).toBeTruthy();
  expect(screen.getByText("Ainda não há avaliações")).toBeTruthy();
  expect(screen.getByText("Nenhuma resposta foi registrada para esta palestra.")).toBeTruthy();
});

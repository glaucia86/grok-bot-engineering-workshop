// @vitest-environment happy-dom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import Results from "../app/results/page";
import { LocaleProvider } from "./locale-provider";

afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); });

it("localizes the complete results route intro and its feedback navigation", async () => {
  localStorage.setItem("talkfeedback-locale", "pt-BR");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]")));
  render(<LocaleProvider><Results /></LocaleProvider>);
  expect(screen.getByRole("heading", { name: "Resultados do workshop", level: 1 })).toBeTruthy();
  expect(screen.getByText("O que mais marcou o público? Explore as avaliações e o número de respostas de cada palestra.")).toBeTruthy();
  expect((await screen.findAllByRole("link", { name: "Deixe seu feedback" })).every(link => link.getAttribute("href") === "/feedback")).toBe(true);
  expect(await screen.findByRole("heading", { name: "Ainda não há feedback" })).toBeTruthy();
});

it("retains the English results intro without a provider", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]")));
  render(<Results />);
  expect(screen.getByRole("heading", { name: "Workshop results", level: 1 })).toBeTruthy();
  expect(await screen.findByRole("heading", { name: "No feedback yet" })).toBeTruthy();
});

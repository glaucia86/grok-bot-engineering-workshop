// @vitest-environment happy-dom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { WorkshopShell } from "./workshop-shell";
import Home from "../app/page";

const route = vi.hoisted(() => ({ pathname: "/feedback" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
afterEach(() => { cleanup(); route.pathname = "/feedback"; });

it("gives the workshop a persistent product sidebar with all three real destinations", () => {
  render(<WorkshopShell><h1>Leave feedback</h1></WorkshopShell>);
  const navigation = screen.getByRole("navigation", { name: "Main navigation" });
  expect(navigation.closest("aside")).not.toBeNull();
  expect(within(navigation).getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(["/", "/feedback", "/results"]);
  expect(within(navigation).getByRole("link", { name: "Leave feedback" }).getAttribute("aria-current")).toBe("page");
  expect(screen.getByLabelText("Current page").textContent).toContain("Leave feedback");
});

it("introduces the workshop with a clear purpose, original team and route actions", () => {
  const { container } = render(<Home />);
  expect(screen.getByText("Packt workshop")).toBeTruthy();
  expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/Better talks.*Built together/);
  expect(screen.getByRole("link", { name: "Leave feedback" }).getAttribute("href")).toBe("/feedback");
  expect(screen.getByRole("link", { name: "Explore results" }).getAttribute("href")).toBe("/results");
  expect(container.querySelectorAll("[data-bot]")).toHaveLength(5);
  expect(container.querySelector("form")).toBeNull();
});

it("keeps the home supporting text readable on its cool-gray background", () => {
  const css = readFileSync("src/app/loop.css", "utf8");
  const { container } = render(<><style>{css}</style><Home /></>);
  const color = getComputedStyle(container.querySelector(".loop-steps p")!).color;
  const rgb = color.startsWith("#") ? [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16)) : color.match(/\d+/g)!.slice(0, 3).map(Number);
  const luminance = (values: number[]) => values.map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
  expect((luminance([248, 250, 252]) + .05) / (luminance(rgb) + .05)).toBeGreaterThanOrEqual(4.5);
});

it("does not expose the internal engineering process as workshop branding", () => {
  const { container } = render(<WorkshopShell><Home /></WorkshopShell>);
  expect(container.textContent).not.toMatch(/Loop Engineering/i);
  expect(container.querySelector('[aria-label*="Loop Engineering"]')).toBeNull();
  expect(container.querySelector(".sidebar-loop-note")).toBeNull();
});


it("gives the home page a company-style horizontal header instead of the app sidebar", () => {
  route.pathname = "/";
  const { container } = render(<WorkshopShell><Home /></WorkshopShell>);
  const navigation = screen.getByRole("navigation", { name: "Main navigation" });
  expect(navigation.closest("header")?.className).toBe("company-header");
  expect(container.querySelector(".loop-sidebar")).toBeNull();
  expect(container.querySelector(".loop-topbar")).toBeNull();
  expect(within(navigation).getByRole("link", { name: /^Home$/ }).getAttribute("aria-current")).toBe("page");
  expect(within(navigation).getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(["/", "/feedback", "/results"]);
  expect(screen.getByRole("main").getAttribute("id")).toBe("main-content");
});

it("shows clear workshop benefits and an honestly labeled interface preview without a live form", () => {
  const { container } = render(<Home />);
  expect(screen.getByRole("heading", { name: "Good feedback goes further." })).toBeTruthy();
  const preview = screen.getByRole("figure", { name: "An illustration of the feedback experience" });
  expect(preview.textContent).toContain("Illustrative preview. No live workshop data.");
  expect(preview.querySelector("form, input, textarea, button, table")).toBeNull();
  expect(container.querySelectorAll("[data-bot]")).toHaveLength(5);
  expect(screen.getByRole("link", { name: /^Leave feedback$/ }).getAttribute("href")).toBe("/feedback");
  expect(screen.getByRole("link", { name: /^Explore results$/ }).getAttribute("href")).toBe("/results");
});

it.each(["/feedback", "/results"])("retains the working sidebar on %s", pathname => {
  route.pathname = pathname;
  const { container } = render(<WorkshopShell><h1>Working page</h1></WorkshopShell>);
  expect(screen.getByRole("complementary", { name: "Workshop sidebar" })).toBeTruthy();
  expect(container.querySelector(".company-header")).toBeNull();
  expect(container.querySelector(".loop-workspace")).toBeTruthy();
});

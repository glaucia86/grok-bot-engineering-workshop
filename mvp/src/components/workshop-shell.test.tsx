// @vitest-environment happy-dom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { WorkshopShell } from "./workshop-shell";
import Home from "../app/page";

vi.mock("next/navigation", () => ({ usePathname: () => "/feedback" }));
afterEach(cleanup);

it("gives the workshop a persistent product sidebar with all three real destinations", () => {
  render(<WorkshopShell><h1>Leave feedback</h1></WorkshopShell>);
  const navigation = screen.getByRole("navigation", { name: "Main navigation" });
  expect(navigation.closest("aside")).not.toBeNull();
  expect(within(navigation).getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(["/", "/feedback", "/results"]);
  expect(within(navigation).getByRole("link", { name: "Leave feedback" }).getAttribute("aria-current")).toBe("page");
  expect(screen.getByLabelText("Current page").textContent).toContain("Leave feedback");
});

it("introduces Loop Engineering with a clear purpose, original team and route actions", () => {
  const { container } = render(<Home />);
  expect(screen.getByText("Loop Engineering workshop")).toBeTruthy();
  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("feedback loop");
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

// @vitest-environment happy-dom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { BotPortraits } from "./bot-portraits";

afterEach(cleanup);

it("only the black protagonist opts into home pointer motion", () => {
  const { container } = render(<BotPortraits interactive />);
  expect(container.querySelectorAll("[data-bot]")).toHaveLength(5);
  expect(container.querySelectorAll("[data-bot-depth]")).toHaveLength(1);
  expect(container.querySelector("[data-bot-depth]")?.getAttribute("data-bot")).toBe("grok");
  expect(container.querySelector("[data-bot=\"grok\"]")?.getAttribute("data-bot-tilt")).toBe("1");
});

it("working page decoration stays static", () => {
  const { container } = render(<BotPortraits />);
  expect(container.querySelectorAll("[data-bot]")).toHaveLength(5);
  expect(container.querySelectorAll("[data-bot-depth], [data-bot-tilt]")).toHaveLength(0);
});

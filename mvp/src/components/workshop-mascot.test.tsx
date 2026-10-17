// @vitest-environment happy-dom
import React from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { WorkshopMascot } from "./workshop-mascot";

afterEach(cleanup);

it("draws five decorative mascots entirely with native vector geometry", () => {
  const { container } = render(<WorkshopMascot />);
  expect(container.querySelectorAll("svg")).toHaveLength(5);
  expect(container.querySelectorAll("path")).toHaveLength(5);
  expect(container.querySelectorAll(".mascot-eye")).toHaveLength(10);
  expect(container.querySelector("img, image, canvas, .bot-eye-lid")).toBeNull();
  expect(container.querySelector("[style*=background-image]")).toBeNull();
  expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
});

it("keeps pointer motion on the body wrapper and blink timing around the native eyes", () => {
  const { container } = render(<WorkshopMascot />);
  const bots = container.querySelectorAll("[data-bot]");
  expect([...bots].map(bot => bot.getAttribute("data-bot"))).toEqual(["grok", "fde", "qa", "devops", "lead"]);
  for (const bot of bots) {
    expect(bot.hasAttribute("data-bot-depth")).toBe(false);
    expect(bot.querySelector(".mascot-motion[data-bot-depth] .mascot-face[data-bot-depth]")).not.toBeNull();
  }
  expect(container.querySelector(".bot-blink[data-blink=open] svg .mascot-eye")).not.toBeNull();
  expect(container.querySelector("button, a, [tabindex]")).toBeNull();
  expect([...container.querySelectorAll(".mascot-body")].map(body => body.getAttribute("fill"))).toEqual(["#101516", "#00C972", "#FF309B", "#9159FE", "#FF263C"]);
});

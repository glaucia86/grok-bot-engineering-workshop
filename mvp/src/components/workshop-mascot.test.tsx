// @vitest-environment happy-dom
import React from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { WorkshopMascot } from "./workshop-mascot";

afterEach(cleanup);

it("draws one decorative mascot entirely with native vector geometry", () => {
  const { container } = render(<WorkshopMascot />);
  expect(container.querySelectorAll("svg")).toHaveLength(1);
  expect(container.querySelectorAll("path")).toHaveLength(1);
  expect(container.querySelectorAll(".mascot-eye")).toHaveLength(2);
  expect(container.querySelector("img, image, canvas, .bot-eye-lid")).toBeNull();
  expect(container.querySelector("[style*=background-image]")).toBeNull();
  expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
});

it("keeps pointer motion on the body wrapper and blink timing around the native eyes", () => {
  const { container } = render(<WorkshopMascot />);
  const moving = container.querySelectorAll("[data-bot][data-bot-depth]");
  expect(moving).toHaveLength(1);
  expect(moving[0].getAttribute("data-bot")).toBe("grok");
  expect(container.querySelector(".bot-blink[data-blink=open] svg .mascot-eye")).not.toBeNull();
  expect(container.querySelector("button, a, [tabindex]")).toBeNull();
  expect(container.querySelector('.mascot-face[data-bot-depth="0.18"]')).not.toBeNull();
});

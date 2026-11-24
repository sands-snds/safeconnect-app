import React from "react";
import { render } from "@testing-library/react";
import FormattedText, { stripFormatting } from "./FormattedText";

test("keeps line breaks and blank lines, and renders bold and italic", () => {
  const { container } = render(
    <FormattedText text={"First **bold** line\n\nSecond _italic_ paragraph"} />
  );
  const p = container.querySelector("p");
  expect(p.style.whiteSpace).toBe("pre-wrap");
  expect(p.textContent).toBe("First bold line\n\nSecond italic paragraph");
  expect(p.querySelector("strong").textContent).toBe("bold");
  expect(p.querySelector("em").textContent).toBe("italic");
});

test("leaves snake_case words and lone markers alone", () => {
  const { container } = render(<FormattedText text={"my_file_name and 2 * 3"} />);
  expect(container.querySelector("em")).toBeNull();
  expect(container.textContent).toBe("my_file_name and 2 * 3");
});

test("never renders HTML from the message", () => {
  const { container } = render(<FormattedText text={"<b>hi</b>"} />);
  expect(container.querySelector("b")).toBeNull();
});

test("stripFormatting removes the markers", () => {
  expect(stripFormatting("**Flood** warning _now_")).toBe("Flood warning now");
});

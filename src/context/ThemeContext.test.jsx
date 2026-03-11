import { createRoot } from "react-dom/client";
import { act } from "react";
import { ThemeProvider, useTheme } from "./ThemeContext";

function Probe() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button type="button" onClick={toggleTheme}>
        toggle
      </button>
    </div>
  );
}

describe("ThemeContext", () => {
  let container;
  let root;

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("toggles and persists the selected theme", () => {
    act(() => {
      root.render(
        <ThemeProvider>
          <Probe />
        </ThemeProvider>
      );
    });

    const valueNode = container.querySelector('[data-testid="theme-value"]');
    const button = container.querySelector("button");

    const initialTheme = valueNode.textContent;

    act(() => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const nextTheme = valueNode.textContent;
    expect(nextTheme).not.toBe(initialTheme);
    expect(window.localStorage.getItem("pizzeria_theme_v2")).toBe(nextTheme);
    expect(document.documentElement.getAttribute("data-theme")).toBe(nextTheme);
  });
});

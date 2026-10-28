import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import MainLayout from "./MainLayout.jsx";

vi.mock("../components/Navbar", () => ({
  default: () => <nav>Mock Navbar</nav>,
}));

describe("MainLayout", () => {
  it("renders a skip link pointing at the main content region", () => {
    render(
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>,
    );

    const skipLink = screen.getByRole("link", {
      name: "Skip to content",
    });

    expect(skipLink).toHaveAttribute("href", "#main-content");

    const main = document.getElementById("main-content");

    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute("tabindex", "-1");
  });
});
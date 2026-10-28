import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EventCard from "./EventCard.jsx";

function baseEvent(overrides = {}) {
  return {
    id: 7,
    title: "React Workshop",
    short_description: "Hands-on React.",
    description: "Full description of the workshop.",
    category_name: "Tech",
    price: "0",
    mode: "ONLINE",
    venue_name: "",
    city: "",
    capacity: 50,
    banner_image: "https://example.com/banner.jpg",
    start_datetime: "2026-10-01T10:00:00Z",
    ...overrides,
  };
}

function renderCard(event) {
  return render(
    <MemoryRouter>
      <EventCard event={event} />
    </MemoryRouter>,
  );
}

describe("EventCard", () => {
  it("renders title, category, description and free badge", () => {
    renderCard(baseEvent());

    expect(
      screen.getByRole("heading", { name: "React Workshop" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tech")).toBeInTheDocument();
    expect(screen.getByText("Hands-on React.")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("shows the price badge for paid events", () => {
    renderCard(baseEvent({ price: "250.00" }));

    expect(screen.getByText("₹250.00")).toBeInTheDocument();
  });

  it("shows Online for online events", () => {
    renderCard(baseEvent());

    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("shows venue and city for offline events", () => {
    renderCard(
      baseEvent({
        mode: "OFFLINE",
        venue_name: "Main Hall",
        city: "Mumbai",
      }),
    );

    expect(screen.getByText("Main Hall, Mumbai")).toBeInTheDocument();
  });

  it("falls back to Venue label when venue is missing", () => {
    renderCard(
      baseEvent({
        mode: "OFFLINE",
        venue_name: "",
        city: "Mumbai",
      }),
    );

    expect(screen.getByText("Venue, Mumbai")).toBeInTheDocument();
  });

  it("shows capacity when provided", () => {
    renderCard(baseEvent({ capacity: 50 }));

    expect(screen.getByText("50 seats")).toBeInTheDocument();
  });

  it("hides capacity when not provided", () => {
    renderCard(baseEvent({ capacity: null }));

    expect(screen.queryByText(/seats/)).not.toBeInTheDocument();
  });

  it("links through to the event detail page", () => {
    renderCard(baseEvent());

    expect(
      screen.getByRole("link", { name: "View Details" }),
    ).toHaveAttribute("href", "/events/7");
  });

  it("uses the image as a lazy-loaded alt-bearing banner", () => {
    renderCard(baseEvent());

    const image = screen.getByAltText("React Workshop");

    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute(
      "src",
      "https://example.com/banner.jpg",
    );
  });
});
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import {
  EventCardSkeleton,
  GalleryCardSkeleton,
  RowItemSkeleton,
  Skeleton,
  SkeletonCardGrid,
} from "./Skeleton.jsx";

describe("Skeleton primitives", () => {
  it("renders a pulsing placeholder block", () => {
    const { container } = render(<Skeleton />);

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("honours the className prop", () => {
    const { container } = render(
      <Skeleton className="h-8 w-1/2" />,
    );

    const block = container.querySelector(".animate-pulse");

    expect(block).toHaveClass("h-8");
    expect(block).toHaveClass("w-1/2");
  });

  it("renders an event card skeleton with a title bar", () => {
    const { container } = render(<EventCardSkeleton />);

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(container.querySelector('[class*="p-6"]')).toBeInTheDocument();
  });

  it("renders a gallery card skeleton with a compact body", () => {
    const { container } = render(<GalleryCardSkeleton />);

    expect(container.querySelector('[class*="p-5"]')).toBeInTheDocument();
  });

  it("renders the requested number of row skeletons", () => {
    const { container } = render(<RowItemSkeleton rows={3} />);

    expect(container.querySelectorAll('[class*="space-y-3"]').length).toBe(1);
    expect(
      container.querySelectorAll('[class^="flex items-center gap-4"]').length,
    ).toBe(3);
  });
});

describe("SkeletonCardGrid", () => {
  it("renders the default count of event cards", () => {
    const { container } = render(<SkeletonCardGrid />);

    const grid = container.querySelector(".grid");

    expect(grid.children.length).toBe(6);
  });

  it("renders the requested count of cards", () => {
    const { container } = render(<SkeletonCardGrid count={4} />);

    const grid = container.querySelector(".grid");

    expect(grid.children.length).toBe(4);
  });

  it("renders gallery cards for the gallery variant", () => {
    const { container } = render(
      <SkeletonCardGrid count={2} variant="gallery" />,
    );

    expect(container.querySelectorAll('[class*="p-5"]').length).toBe(2);
  });
});
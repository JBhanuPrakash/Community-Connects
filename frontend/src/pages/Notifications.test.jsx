import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";

import api from "../api/axios";
import Notifications from "./Notifications.jsx";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

function makeNotification(overrides = {}) {
  return {
    id: 1,
    title: "Event approved",
    message: "Your event was approved.",
    notification_type: "EVENT_APPROVED",
    is_read: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function renderNotifications() {
  return render(
    <MemoryRouter initialEntries={["/notifications"]}>
      <Routes>
        <Route
          path="/notifications"
          element={<Notifications />}
        />
        <Route
          path="/events/:id"
          element={<div>Event Page</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Notifications", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.delete).mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the list with an unread count", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        results: [
          makeNotification({ id: 1, is_read: true }),
          makeNotification({
            id: 2,
            title: "New message",
          }),
        ],
      },
    });

    renderNotifications();

    expect(
      await screen.findByRole("heading", {
        name: "Notifications",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "You have 1 unread notification.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Event approved"),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("New"),
    ).toHaveLength(1);
  });

  it("shows the empty state when there are no notifications", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { results: [] },
    });

    renderNotifications();

    expect(
      await screen.findByText("No notifications"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Mark All as Read",
      }),
    ).not.toBeInTheDocument();
  });

  it("shows an error banner when loading fails", async () => {
    vi.mocked(api.get).mockRejectedValue({
      response: {
        data: { detail: "Server error." },
      },
    });

    renderNotifications();

    expect(
      await screen.findByText("Server error."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No notifications"),
    ).not.toBeInTheDocument();
  });

  it("marks all notifications as read", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { results: [makeNotification()] },
    });
    vi.mocked(api.post).mockResolvedValue({
      data: { message: "All caught up." },
    });

    renderNotifications();

    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", {
        name: "Mark All as Read",
      }),
    );

    expect(
      await screen.findByText("All caught up."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "You have 0 unread notifications.",
      ),
    ).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith(
      "/notifications/read-all/",
    );
  });

  it("deletes a notification after confirmation", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        results: [
          makeNotification({ id: 7, is_read: true }),
        ],
      },
    });
    vi.mocked(api.delete).mockResolvedValue({ data: {} });
    vi.stubGlobal("confirm", vi.fn(() => true));

    renderNotifications();

    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", {
        name: "Delete",
      }),
    );

    expect(
      await screen.findByText("Notification deleted."),
    ).toBeInTheDocument();
    expect(api.delete).toHaveBeenCalledWith(
      "/notifications/7/delete/",
    );
    expect(
      screen.queryByText("Event approved"),
    ).not.toBeInTheDocument();
  });

  it("keeps the notification when deletion is cancelled", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { results: [makeNotification()] },
    });
    vi.stubGlobal("confirm", vi.fn(() => false));

    renderNotifications();

    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", {
        name: "Delete",
      }),
    );

    expect(
      screen.getByText("Event approved"),
    ).toBeInTheDocument();
    expect(api.delete).not.toHaveBeenCalled();
  });

  it("navigates to the event when an unread notification is opened", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        results: [
          makeNotification({
            id: 3,
            target_url: "/events/5",
          }),
        ],
      },
    });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        notification: makeNotification({
          id: 3,
          is_read: true,
          target_url: "/events/5",
        }),
      },
    });

    renderNotifications();

    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", {
        name: "Open",
      }),
    );

    expect(
      await screen.findByText("Event Page"),
    ).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith(
      "/notifications/3/read/",
    );
  });
});
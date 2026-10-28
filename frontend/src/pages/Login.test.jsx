import { beforeEach, describe, expect, it, vi } from "vitest";
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

import Login from "./Login.jsx";

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: { login: vi.fn() },
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => useAuthMock,
}));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={<div>User Dashboard Home</div>}
        />
        <Route
          path="/organizer/dashboard"
          element={<div>Organizer Dashboard Home</div>}
        />
        <Route
          path="/admin/dashboard"
          element={<div>Admin Dashboard Home</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

async function submitValidCredentials() {
  const user = userEvent.setup();

  await user.type(
    screen.getByLabelText("Username"),
    "alice",
  );
  await user.type(
    screen.getByLabelText("Password"),
    "secret123",
  );
  await user.click(
    screen.getByRole("button", { name: "Login" }),
  );
}

describe("Login", () => {
  beforeEach(() => {
    useAuthMock.login.mockReset();
  });

  it("renders the login form", () => {
    renderLogin();

    expect(
      screen.getByRole("heading", {
        name: "Welcome Back",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Username"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Password"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Login" }),
    ).toBeInTheDocument();
  });

  it("sends the credentials and routes regular users to their dashboard", async () => {
    useAuthMock.login.mockResolvedValue({
      role: "USER",
    });

    renderLogin();
    await submitValidCredentials();

    expect(
      await screen.findByText("User Dashboard Home"),
    ).toBeInTheDocument();

    expect(
      useAuthMock.login,
    ).toHaveBeenCalledWith({
      username: "alice",
      password: "secret123",
    });
  });

  it("routes organizers to the organizer dashboard", async () => {
    useAuthMock.login.mockResolvedValue({
      role: "ORGANIZER",
    });

    renderLogin();
    await submitValidCredentials();

    expect(
      await screen.findByText(
        "Organizer Dashboard Home",
      ),
    ).toBeInTheDocument();
  });

  it("routes admins to the admin dashboard", async () => {
    useAuthMock.login.mockResolvedValue({
      role: "ADMIN",
    });

    renderLogin();
    await submitValidCredentials();

    expect(
      await screen.findByText("Admin Dashboard Home"),
    ).toBeInTheDocument();
  });

  it("treats a superuser as an admin", async () => {
    useAuthMock.login.mockResolvedValue({
      role: "USER",
      is_superuser: true,
    });

    renderLogin();
    await submitValidCredentials();

    expect(
      await screen.findByText("Admin Dashboard Home"),
    ).toBeInTheDocument();
  });

  it("shows the server message for invalid credentials", async () => {
    useAuthMock.login.mockRejectedValue({
      response: {
        data: {
          non_field_errors: [
            "Invalid credentials.",
          ],
        },
      },
    });

    renderLogin();
    await submitValidCredentials();

    expect(
      await screen.findByText("Invalid credentials."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Welcome Back",
      }),
    ).toBeInTheDocument();
  });

  it("falls back to a generic error for unrecognized payloads", async () => {
    useAuthMock.login.mockRejectedValue({
      response: { data: {} },
    });

    renderLogin();
    await submitValidCredentials();

    expect(
      await screen.findByText(
        "Invalid username or password.",
      ),
    ).toBeInTheDocument();
  });

  it("clears the error once the user types again", async () => {
    useAuthMock.login.mockRejectedValue({
      response: {
        data: { non_field_errors: ["Nope."] },
      },
    });

    renderLogin();
    await submitValidCredentials();

    expect(
      await screen.findByText("Nope."),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("Username"),
      "x",
    );

    expect(
      screen.queryByText("Nope."),
    ).not.toBeInTheDocument();
  });

  it("disables the submit button while the request is pending", async () => {
    let resolveLogin;
    useAuthMock.login.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      }),
    );

    renderLogin();
    await submitValidCredentials();

    expect(
      screen.getByRole("button", {
        name: "Logging in...",
      }),
    ).toBeDisabled();

    resolveLogin({ role: "USER" });

    expect(
      await screen.findByText("User Dashboard Home"),
    ).toBeInTheDocument();
  });
});
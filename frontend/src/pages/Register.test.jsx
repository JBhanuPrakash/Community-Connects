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

import api from "../api/axios";
import Register from "./Register.jsx";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.setConfig({ testTimeout: 20000 });

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route
          path="/login"
          element={<div>Login Screen</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

async function fillForm({
  password = "StrongPass123",
  confirmPassword = "StrongPass123",
} = {}) {
  const user = userEvent.setup();

  await user.type(
    screen.getByLabelText("First Name"),
    "Alice",
  );
  await user.type(
    screen.getByLabelText("Last Name"),
    "Smith",
  );
  await user.type(
    screen.getByLabelText("Username"),
    "alice",
  );
  await user.type(
    screen.getByLabelText("Email"),
    "alice@example.com",
  );
  await user.type(
    screen.getByLabelText("Password"),
    password,
  );
  await user.type(
    screen.getByLabelText("Confirm Password"),
    confirmPassword,
  );

  await user.click(
    screen.getByRole("button", {
      name: "Create Account",
    }),
  );
}

describe("Register", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it("renders the registration form", () => {
    renderRegister();

    expect(
      screen.getByRole("heading", {
        name: "Create Your Account",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Username"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Email"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Create Account",
      }),
    ).toBeInTheDocument();
  });

  it("rejects mismatched passwords without calling the API", async () => {
    renderRegister();
    await fillForm({
      password: "StrongPass123",
      confirmPassword: "Different456",
    });

    expect(
      await screen.findByText(
        "Passwords do not match.",
      ),
    ).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("submits the form data and routes to the login page", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { message: "Registration successful." },
    });

    renderRegister();
    await fillForm();

    expect(
      await screen.findByText("Login Screen"),
    ).toBeInTheDocument();

    expect(
      api.post,
    ).toHaveBeenCalledWith(
      "/auth/register/",
      expect.objectContaining({
        username: "alice",
        email: "alice@example.com",
        first_name: "Alice",
        last_name: "Smith",
        password: "StrongPass123",
        confirm_password: "StrongPass123",
      }),
    );
  });

  it("shows the API error detail on failure", async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: {
        data: { detail: "Username already taken." },
      },
    });

    renderRegister();
    await fillForm();

    expect(
      await screen.findByText("Username already taken."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Create Your Account",
      }),
    ).toBeInTheDocument();
  });

  it("maps field errors from the API onto the fields", async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: {
        data: {
          email: ["Enter a valid email address."],
        },
      },
    });

    renderRegister();
    await fillForm();

    expect(
      await screen.findByText(
        "Enter a valid email address.",
      ),
    ).toBeInTheDocument();
  });

  it("falls back to a generic message for empty payloads", async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: { data: {} },
    });

    renderRegister();
    await fillForm();

    expect(
      await screen.findByText(
        "Unable to create your account.",
      ),
    ).toBeInTheDocument();
  });

  it("clears the error banner when typing resumes", async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: {
        data: { detail: "Something went wrong." },
      },
    });

    renderRegister();
    await fillForm();

    expect(
      await screen.findByText("Something went wrong."),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("Username"),
      "z",
    );

    expect(
      screen.queryByText("Something went wrong."),
    ).not.toBeInTheDocument();
  });
});
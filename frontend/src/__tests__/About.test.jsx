// src/__tests__/About.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ----- AuthContext mock that tests can control -----
let mockUser = null;

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// ----- React Router mock: keep everything real except Navigate -----
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    // Make <Navigate to="/login" /> render something simple we can assert on
    Navigate: ({ to }) => <div>Redirected to {to}</div>,
  };
});

import About from "../pages/About";

describe("About page", () => {
  beforeEach(() => {
    mockUser = null;
  });

  test("shows about content when user is logged in", () => {
    mockUser = { username: "Meg Tester" };

    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    // Main heading
    expect(
      screen.getByRole("heading", { name: /about home fur good 2\.0/i })
    ).toBeInTheDocument();

    // A bit of body text so we know the page really rendered
    expect(
      screen.getByText(/demo adoption app built by meg/i)
    ).toBeInTheDocument();
  });

  test("redirects to login when there is no user", () => {
    mockUser = null;

    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/redirected to \/login/i)
    ).toBeInTheDocument();
  });
});

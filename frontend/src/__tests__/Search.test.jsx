// src/__tests__/Search.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Search from "../pages/Search";

// ---- Mocks ----
jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../components/MultiBreedDropdown", () => {
  return function MockMultiBreedDropdown() {
    return <div data-testid="multi-breed-dropdown">MultiBreedDropdown</div>;
  };
});

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: jest.fn(),
    useSearchParams: jest.fn(),
  };
});

import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";

describe("Search page", () => {
  function setup({ qs = "", user = null } = {}) {
    const mockNavigate = jest.fn();
    const mockSetSearchParams = jest.fn();

    // Mock AuthContext
    useAuth.mockReturnValue({
      user,
    });

    // Mock URL search params
    const url = new URL(`http://localhost/search${qs}`);
    const params = new URLSearchParams(url.search);
    useSearchParams.mockReturnValue([params, mockSetSearchParams]);

    // Mock navigate
    useNavigate.mockReturnValue(mockNavigate);

    render(
      <MemoryRouter initialEntries={["/search"]}>
        <Search />
      </MemoryRouter>
    );

    return { mockNavigate, mockSetSearchParams };
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("uses user's zipcode as default when no zip query present", () => {
    setup({
      qs: "",
      user: { username: "meg", zipcode: "01938" },
    });

    // ZIP input is the one with placeholder="ZIP"
    const zipInput = screen.getByPlaceholderText("ZIP");
    expect(zipInput).toHaveValue("01938");
  });

  test("restores form values from URL query string when present", () => {
    setup({
      qs: "?zip=30301&miles=25&sex=Male&ageGroup=Adult&sizeGroup=Large&isDogsOk=true",
      user: { username: "meg", zipcode: "01938" },
    });

    // Zip and miles via their values
    expect(screen.getByDisplayValue("30301")).toBeInTheDocument();
    expect(screen.getByDisplayValue("25")).toBeInTheDocument();

    // Selects use the provided values
    expect(screen.getByDisplayValue("Male")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Adult")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Large")).toBeInTheDocument();

    // Checkbox labels wrap the inputs, so label-text works here
    const dogsOkCheckbox = screen.getByLabelText(/good with dogs/i);
    expect(dogsOkCheckbox).toBeChecked();
  });

  test("on submit, updates search params and navigates to /results with same query", () => {
    const { mockNavigate, mockSetSearchParams } = setup({
      qs: "",
      user: { username: "meg", zipcode: "01938" },
    });

    // Change ZIP from default to something else to be extra sure
    const zipInput = screen.getByPlaceholderText("ZIP");
    fireEvent.change(zipInput, { target: { value: "02108" } });

    // Toggle one boolean filter
    const dogsOkCheckbox = screen.getByLabelText(/good with dogs/i);
    fireEvent.click(dogsOkCheckbox); // now true

    // Submit the form
    const submitBtn = screen.getByRole("button", { name: /search/i });
    fireEvent.click(submitBtn);

    // 1) setSearchParams should be called with the params object
    expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
    const paramsArg = mockSetSearchParams.mock.calls[0][0];

    // ZIP + some key flags
    expect(paramsArg.zip).toBe("02108");
    expect(paramsArg.miles).toBe(50); // default miles
    expect(paramsArg.isDogsOk).toBe("true");
    expect(paramsArg.isCatsOk).toBe("false");
    expect(paramsArg.isKidsOk).toBe("false");

    // 2) navigate should send us to /results with a query string
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const navArg = mockNavigate.mock.calls[0][0];

    expect(navArg).toContain("/results?");
    expect(navArg).toContain("zip=02108");
    expect(navArg).toContain("isDogsOk=true");
  });
});

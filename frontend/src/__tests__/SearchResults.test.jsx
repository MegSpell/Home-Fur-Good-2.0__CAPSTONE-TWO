// src/__tests__/SearchResults.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SearchResults from "../pages/SearchResults";

// ---- Mocks ----
jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../api", () => ({
  searchDogs: jest.fn(),
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
}));

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: jest.fn(),
    useSearchParams: jest.fn(),
  };
});

import { useAuth } from "../context/AuthContext";
import { searchDogs, addFavorite, removeFavorite } from "../api";
import { useNavigate, useSearchParams } from "react-router-dom";

describe("SearchResults page", () => {
  function setup({
    qs = "",
    user = null,
    favorites = [],
    apiDogs = [],
  } = {}) {
    const mockNavigate = jest.fn();

    // Mock AuthContext
    const mockSetFavorites = jest.fn();
    useAuth.mockReturnValue({
      user,
      favorites,
      setFavorites: mockSetFavorites,
    });

    // Mock URL search params
    const url = new URL(`http://localhost/results${qs}`);
    const params = new URLSearchParams(url.search);
    useSearchParams.mockReturnValue([params, jest.fn()]);

    // Mock navigate
    useNavigate.mockReturnValue(mockNavigate);

    // Mock searchDogs return for this render
    searchDogs.mockResolvedValue({ dogs: apiDogs });

    render(
      <MemoryRouter initialEntries={["/results" + qs]}>
        <SearchResults />
      </MemoryRouter>
    );

    return { mockNavigate, mockSetFavorites };
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("redirects to /search when no zip param in URL", async () => {
    const { mockNavigate } = setup({
      qs: "",
      user: { username: "meg" },
      favorites: [],
      apiDogs: [],
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/search", { replace: true });
    });

    // Should *not* try to call the backend search without a ZIP
    expect(searchDogs).not.toHaveBeenCalled();
  });

  test("calls searchDogs with filters and shows returned dogs", async () => {
    const dogs = [
      {
        id: "d1",
        name: "Fluffy",
        city: "Boston",
        state: "MA",
        distance: 12.3,
        photo: "http://example.com/fluffy.jpg",
      },
      {
        id: "d2",
        name: "Rover",
        city: "Cambridge",
        state: "MA",
        distance: 5.7,
        photo: null,
      },
    ];

    setup({
      qs: "?zip=02118&miles=25&sex=Female&ageGroup=Adult&sizeGroup=Medium&isDogsOk=true",
      user: { username: "meg" },
      favorites: [],
      apiDogs: dogs,
    });

    await waitFor(() => {
      // Both dog names should appear
      expect(screen.getByText("Fluffy")).toBeInTheDocument();
      expect(screen.getByText("Rover")).toBeInTheDocument();
    });

    // Verify searchDogs was called with our filters
    expect(searchDogs).toHaveBeenCalledTimes(1);
    expect(searchDogs).toHaveBeenCalledWith(
      expect.objectContaining({
        zip: "02118",
        miles: "25",
        sex: "Female",
        ageGroup: "Adult",
        sizeGroup: "Medium",
        isDogsOk: true,
      })
    );

    // Filters summary text should mention key bits
    expect(screen.getByText(/filters:/i)).toBeInTheDocument();
    expect(screen.getByText(/zip 02118/i)).toBeInTheDocument();
    expect(screen.getByText(/within 25 miles/i)).toBeInTheDocument();
    expect(screen.getByText(/sex: female/i)).toBeInTheDocument();
  });

  test("clicking heart when logged in toggles favorites and calls backend", async () => {
    const dogs = [
      {
        id: "d1",
        name: "Fluffy",
        city: "Boston",
        state: "MA",
        distance: 10,
        photo: null,
      },
    ];

    const { mockSetFavorites } = setup({
      qs: "?zip=02118",
      user: { username: "meg" },
      favorites: [],
      apiDogs: dogs,
    });

    // Wait for dog to render
    await waitFor(() => {
      expect(screen.getByText("Fluffy")).toBeInTheDocument();
    });

    const heartButton = screen.getByRole("button", {
      name: /add to favorites/i,
    });

    // First click: should add favorite
    fireEvent.click(heartButton);

    await waitFor(() => {
      expect(addFavorite).toHaveBeenCalledWith("meg", "d1");
      expect(mockSetFavorites).toHaveBeenCalledWith(expect.any(Function));
    });

    // Pretend context now says it's a favorite
    useAuth.mockReturnValue({
      user: { username: "meg" },
      favorites: ["d1"],
      setFavorites: mockSetFavorites,
    });

    // Re-render to simulate updated context
    // (simple way: call setup again with favorites containing "d1")
    jest.clearAllMocks();
    setup({
      qs: "?zip=02118",
      user: { username: "meg" },
      favorites: ["d1"],
      apiDogs: dogs,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /remove from favorites/i })
      ).toBeInTheDocument();
    });

    const heartButton2 = screen.getByRole("button", {
      name: /remove from favorites/i,
    });

    fireEvent.click(heartButton2);

    await waitFor(() => {
      expect(removeFavorite).toHaveBeenCalledWith("meg", "d1");
    });
  });

  test("clicking heart when logged OUT navigates to /login", async () => {
    const dogs = [
      { id: "d1", name: "Fluffy", city: "Boston", state: "MA", distance: 10 },
    ];

    const { mockNavigate } = setup({
      qs: "?zip=02118",
      user: null,
      favorites: [],
      apiDogs: dogs,
    });

    await waitFor(() => {
      expect(screen.getByText("Fluffy")).toBeInTheDocument();
    });

    const heartButton = screen.getByRole("button", {
      name: /add to favorites/i,
    });

    fireEvent.click(heartButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    // No favorite API calls should be made
    expect(addFavorite).not.toHaveBeenCalled();
    expect(removeFavorite).not.toHaveBeenCalled();
  });

  test("shows Load more button and reveals more dogs when clicked", async () => {
    // 61 fake dogs (visibleCount starts at 60)
    const manyDogs = Array.from({ length: 61 }, (_, idx) => ({
      id: `dog-${idx + 1}`,
      name: `Dog ${idx + 1}`,
      city: "Somewhere",
      state: "MA",
      distance: 1 + idx,
      photo: null,
    }));

    setup({
      qs: "?zip=02118",
      user: { username: "meg" },
      favorites: [],
      apiDogs: manyDogs,
    });

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText("Dog 1")).toBeInTheDocument();
    });

    // Initially, only the first 60 should be visible; Dog 61 not yet
    expect(screen.queryByText("Dog 61")).not.toBeInTheDocument();

    const loadMoreBtn = screen.getByRole("button", {
      name: /load more dogs/i,
    });
    expect(loadMoreBtn).toBeInTheDocument();

    fireEvent.click(loadMoreBtn);

    // After clicking, Dog 61 should appear
    await waitFor(() => {
      expect(screen.getByText("Dog 61")).toBeInTheDocument();
    });
  });
});

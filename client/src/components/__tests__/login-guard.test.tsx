import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginGuard } from "../login-guard";

// Mock the auth provider to control isAuthenticated and functions
vi.mock("../auth-provider", () => {
  return {
    useAuth: () => ({
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      forgotPassword: vi.fn(),
      error: null,
    }),
  };
});

describe("LoginGuard", () => {
  test("pigeon play toggles animation and shows sound indicator", async () => {
    render(
      <LoginGuard>
        <div>Children</div>
      </LoginGuard>,
    );

    // Play button should be present
    const playButton = screen.getByRole("button", { name: /play-pigeon/i });
    expect(playButton).toBeInTheDocument();

    // Sound indicator should not be visible initially
    expect(screen.queryByLabelText("sound-indicator")).not.toBeInTheDocument();

    // Canvas should exist and be hidden (opacity 0)
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas).toBeTruthy();
    expect(canvas.className).toContain("opacity-0");

    // Click play
    await userEvent.click(playButton);

    // Stop button should appear (play -> stop)
    const stop = await screen.findByLabelText("stop-pigeon");
    expect(stop).toBeInTheDocument();

    // Canvas should be visible (opacity-100) and have the animation class and be slightly larger
    expect(canvas.className).toContain("opacity-100");
    expect(canvas.className).toContain("pigeon-talk");
    expect(canvas.className).toContain("w-80");

    // Play button should be hidden/disabled
    expect(playButton.className).toContain("opacity-0");

    // The stop control should include a visible label "Stop"
    expect(stop).toHaveTextContent(/stop/i);

    // Click stop to stop animation
    await userEvent.click(stop);

    // Stop should be hidden and canvas should stop animating and hide
    expect(canvas.className).not.toContain("pigeon-talk");
    expect(canvas.className).toContain("opacity-0");
    expect(playButton.className).not.toContain("opacity-0");
  });
});

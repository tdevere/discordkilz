/**
 * App.test.tsx
 *
 * Unit tests for the top-level <App> component.
 *
 * Strategy:
 *  - Mock `@tauri-apps/api/core` so `invoke` never touches real IPC.
 *  - Mock `../VoiceRoom` with a lightweight stub to keep these tests
 *    focused on App-level state transitions only.
 *  - All LiveKit / WebRTC concerns are tested in VoiceRoom.test.tsx.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

// Stub VoiceRoom so App tests are not affected by LiveKit internals.
vi.mock("../VoiceRoom", () => ({
  default: ({ onLeave }: { onLeave: () => void }) => (
    <div data-testid="voice-room">
      <button onClick={onLeave}>Leave</button>
    </div>
  ),
}));

import { invoke } from "@tauri-apps/api/core";
const mockInvoke = invoke as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_ROOM_INFO = {
  room_name: "room-abc12345",
  host_token: "header.payload.sig",
  e2ee_key: "dGVzdGtleQ",
  livekit_url: "ws://localhost:7880",
  join_link:
    "http://localhost:5173/?room=room-abc12345&url=ws%3A%2F%2Flocalhost%3A7880&token=header.payload.sig#key=dGVzdGtleQ",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("App – idle state", () => {
  it("renders the header and create-room button", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /Project Hollow/i })).toBeInTheDocument();
    expect(screen.getByText("Core Media Service — Voice Test")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create Voice Room/i }),
    ).toBeEnabled();
  });

  it("does not show room info or error on first render", () => {
    render(<App />);
    expect(screen.queryByText(/Room:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/E2EE Active/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Leave/i })).not.toBeInTheDocument();
  });
});

describe("App – create room flow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows 'Creating room…' while the invoke call is pending", async () => {
    let settle!: (v: unknown) => void;
    mockInvoke.mockReturnValue(new Promise((r) => (settle = r)));

    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /Create Voice Room/i }));

    expect(screen.getByText("Creating room…")).toBeInTheDocument();
    settle(MOCK_ROOM_INFO); // prevent hanging promise
  });

  it("calls invoke with the correct command name", async () => {
    mockInvoke.mockResolvedValue(MOCK_ROOM_INFO);
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /Create Voice Room/i }));
    await waitFor(() => screen.getByTestId("voice-room"));
    expect(mockInvoke).toHaveBeenCalledWith("create_voice_room");
  });

  it("displays room name and E2EE badge on success", async () => {
    mockInvoke.mockResolvedValue(MOCK_ROOM_INFO);
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /Create Voice Room/i }));
    await waitFor(() =>
      expect(screen.getByText(`Room: ${MOCK_ROOM_INFO.room_name}`)).toBeInTheDocument(),
    );
    expect(screen.getByText("🔒 E2EE Active")).toBeInTheDocument();
  });

  it("renders the VoiceRoom component on success", async () => {
    mockInvoke.mockResolvedValue(MOCK_ROOM_INFO);
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /Create Voice Room/i }));
    await waitFor(() => expect(screen.getByTestId("voice-room")).toBeInTheDocument());
  });

  it("shows the join link", async () => {
    mockInvoke.mockResolvedValue(MOCK_ROOM_INFO);
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /Create Voice Room/i }));
    await waitFor(() => screen.getByTestId("voice-room"));
    expect(screen.getByText(MOCK_ROOM_INFO.join_link)).toBeInTheDocument();
  });
});

describe("App – error handling", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows a human-readable error when invoke rejects", async () => {
    mockInvoke.mockRejectedValue(new Error("connection refused: ws://localhost:7880"));
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /Create Voice Room/i }));
    await waitFor(() =>
      expect(screen.getByText(/connection refused/i)).toBeInTheDocument(),
    );
  });

  it("returns to idle state after an error so the user can retry", async () => {
    mockInvoke.mockRejectedValue(new Error("boom"));
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /Create Voice Room/i }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Create Voice Room/i }),
      ).toBeEnabled(),
    );
  });
});

describe("App – leave room", () => {
  beforeEach(() => vi.clearAllMocks());

  it("pressing Leave resets to idle and shows the create button again", async () => {
    mockInvoke.mockResolvedValue(MOCK_ROOM_INFO);
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /Create Voice Room/i }));
    await waitFor(() => screen.getByTestId("voice-room"));
    await userEvent.click(screen.getByRole("button", { name: /Leave/i }));
    expect(
      screen.getByRole("button", { name: /Create Voice Room/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("voice-room")).not.toBeInTheDocument();
  });
});

describe("App – copy link", () => {
  beforeEach(() => vi.clearAllMocks());

  it("writes the join link to the clipboard", async () => {
    mockInvoke.mockResolvedValue(MOCK_ROOM_INFO);
    const writeMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeMock },
      writable: true,
      configurable: true,
    });

    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /Create Voice Room/i }));
    await waitFor(() => screen.getByRole("button", { name: /Copy/i }));
    await userEvent.click(screen.getByRole("button", { name: /Copy/i }));

    expect(writeMock).toHaveBeenCalledWith(MOCK_ROOM_INFO.join_link);
  });

  it("briefly shows '✓ Copied' feedback after clicking Copy", async () => {
    mockInvoke.mockResolvedValue(MOCK_ROOM_INFO);
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /Create Voice Room/i }));
    await waitFor(() => screen.getByRole("button", { name: /Copy/i }));
    await userEvent.click(screen.getByRole("button", { name: /Copy/i }));
    await waitFor(() =>
      expect(screen.getByText("✓ Copied")).toBeInTheDocument(),
    );
  });
});

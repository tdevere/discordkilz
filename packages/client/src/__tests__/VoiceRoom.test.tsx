/**
 * VoiceRoom.test.tsx
 *
 * Unit tests for the <VoiceRoom> component with full livekit-client mocking.
 *
 * Strategy:
 *  - Every class / constant exported by `livekit-client` is replaced by a
 *    minimal mock so tests run instantly without WebRTC / Web Audio setup.
 *  - `mockConnect` and `mockSetMicrophoneEnabled` are shared vi.fn() handles
 *    that individual tests can override to simulate success or failure.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VoiceRoom from "../VoiceRoom";

// ---------------------------------------------------------------------------
// vi.hoisted ensures these handles are available inside vi.mock() factories,
// which Vitest hoists above all other statements at transform time.
// ---------------------------------------------------------------------------
const {
  mockConnect,
  mockDisconnect,
  mockSetMicrophoneEnabled,
  mockSetKey,
  mockOn,
} = vi.hoisted(() => ({
  mockConnect: vi.fn().mockResolvedValue(undefined),
  mockDisconnect: vi.fn().mockResolvedValue(undefined),
  mockSetMicrophoneEnabled: vi.fn().mockResolvedValue(undefined),
  mockSetKey: vi.fn().mockResolvedValue(undefined),
  mockOn: vi.fn().mockReturnThis(),
}));

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("livekit-client", () => {
  class MockRoom {
    localParticipant = {
      identity: "host",
      getTrackPublication: vi.fn().mockReturnValue({ isMuted: false }),
      setMicrophoneEnabled: mockSetMicrophoneEnabled,
    };
    remoteParticipants = new Map();
    on = mockOn;
    connect = mockConnect;
    disconnect = mockDisconnect;
  }

  return {
    Room: MockRoom,
    RoomEvent: {
      ParticipantConnected: "participantConnected",
      ParticipantDisconnected: "participantDisconnected",
      TrackMuted: "trackMuted",
      TrackUnmuted: "trackUnmuted",
      LocalTrackPublished: "localTrackPublished",
      Disconnected: "disconnected",
    },
    Track: { Source: { Microphone: "microphone" } },
    ExternalE2EEKeyProvider: class {
      setKey = mockSetKey;
    },
  };
});

// ---------------------------------------------------------------------------
// Default props
// ---------------------------------------------------------------------------

const DEFAULT_PROPS = {
  livekitUrl: "ws://localhost:7880",
  token: "header.payload.sig",
  e2eeKey: "dGVzdGtleQ",
  onLeave: vi.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("VoiceRoom – initial render", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockOn.mockReturnThis();
    mockConnect.mockResolvedValue(undefined);
    mockDisconnect.mockResolvedValue(undefined);
    mockSetMicrophoneEnabled.mockResolvedValue(undefined);
  });

  it("shows 'Voice Channel' heading", () => {
    render(<VoiceRoom {...DEFAULT_PROPS} />);
    expect(screen.getByText("Voice Channel")).toBeInTheDocument();
  });

  it("shows ⏳ Connecting… badge synchronously before connect resolves", () => {
    // Never resolve connect so we can inspect the in-flight state.
    mockConnect.mockReturnValue(new Promise(() => {}));
    render(<VoiceRoom {...DEFAULT_PROPS} />);
    expect(screen.getByText("⏳ Connecting…")).toBeInTheDocument();
  });

  it("Mute button is disabled while connecting", () => {
    mockConnect.mockReturnValue(new Promise(() => {}));
    render(<VoiceRoom {...DEFAULT_PROPS} />);
    expect(screen.getByRole("button", { name: /Mute/i })).toBeDisabled();
  });
});

describe("VoiceRoom – successful connection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockOn.mockReturnThis();
    mockConnect.mockResolvedValue(undefined);
    mockDisconnect.mockResolvedValue(undefined);
    mockSetMicrophoneEnabled.mockResolvedValue(undefined);
    mockSetKey.mockResolvedValue(undefined);
  });

  it("transitions to '🔗 Connected' badge after connect", async () => {
    render(<VoiceRoom {...DEFAULT_PROPS} />);
    await waitFor(() =>
      expect(screen.getByText("🔗 Connected")).toBeInTheDocument(),
    );
  });

  it("enables the Mute button once connected", async () => {
    render(<VoiceRoom {...DEFAULT_PROPS} />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Mute/i })).toBeEnabled(),
    );
  });

  it("sets the E2EE key on the key provider", async () => {
    render(<VoiceRoom {...DEFAULT_PROPS} />);
    await waitFor(() => screen.getByText("🔗 Connected"));
    expect(mockSetKey).toHaveBeenCalledWith(DEFAULT_PROPS.e2eeKey);
  });

  it("connects using the supplied URL and token", async () => {
    render(<VoiceRoom {...DEFAULT_PROPS} />);
    await waitFor(() => screen.getByText("🔗 Connected"));
    expect(mockConnect).toHaveBeenCalledWith(
      DEFAULT_PROPS.livekitUrl,
      DEFAULT_PROPS.token,
    );
  });

  it("shows the local participant in the list", async () => {
    render(<VoiceRoom {...DEFAULT_PROPS} />);
    await waitFor(() => screen.getByText("🔗 Connected"));
    expect(screen.getByText(/host \(you\)/i)).toBeInTheDocument();
  });
});

describe("VoiceRoom – connection error", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockOn.mockReturnThis();
    mockDisconnect.mockResolvedValue(undefined);
  });

  it("shows ✖ Error badge when connect throws", async () => {
    mockConnect.mockRejectedValue(new Error("ECONNREFUSED ws://localhost:7880"));
    render(<VoiceRoom {...DEFAULT_PROPS} />);
    await waitFor(() =>
      expect(screen.getByText("✖ Error")).toBeInTheDocument(),
    );
  });

  it("displays the error message text", async () => {
    mockConnect.mockRejectedValue(new Error("ECONNREFUSED ws://localhost:7880"));
    render(<VoiceRoom {...DEFAULT_PROPS} />);
    await waitFor(() =>
      expect(screen.getByText(/ECONNREFUSED/i)).toBeInTheDocument(),
    );
  });
});

describe("VoiceRoom – controls", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockOn.mockReturnThis();
    mockConnect.mockResolvedValue(undefined);
    mockDisconnect.mockResolvedValue(undefined);
    mockSetMicrophoneEnabled.mockResolvedValue(undefined);
  });

  it("calls setMicrophoneEnabled(false) when Mute is clicked", async () => {
    render(<VoiceRoom {...DEFAULT_PROPS} />);
    await waitFor(() => screen.getByRole("button", { name: /Mute/i }));
    await userEvent.click(screen.getByRole("button", { name: /Mute/i }));
    expect(mockSetMicrophoneEnabled).toHaveBeenCalledWith(false);
  });

  it("toggles button label from Mute → Unmute", async () => {
    render(<VoiceRoom {...DEFAULT_PROPS} />);
    await waitFor(() => screen.getByRole("button", { name: /Mute/i }));
    await userEvent.click(screen.getByRole("button", { name: /Mute/i }));
    expect(screen.getByRole("button", { name: /Unmute/i })).toBeInTheDocument();
  });

  it("calls disconnect and onLeave when Leave Room is clicked", async () => {
    render(<VoiceRoom {...DEFAULT_PROPS} />);
    await waitFor(() => screen.getByText("🔗 Connected"));
    await userEvent.click(screen.getByRole("button", { name: /Leave Room/i }));
    expect(mockDisconnect).toHaveBeenCalled();
    expect(DEFAULT_PROPS.onLeave).toHaveBeenCalled();
  });
});

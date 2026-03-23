import { describe, it, expect, beforeEach } from "vitest";
import { useDeputyStore } from "@/lib/deputy-store";
import type { DeputyInfo } from "@/lib/deputy-lookup";

const mockDeputy: DeputyInfo = {
  id: "dep-123",
  fullName: "Marie Martin",
  slug: "marie-martin",
  photoUrl: "https://example.com/photo.jpg",
  partyShortName: "PS",
  partyId: "party-ps",
  circonscription: "Paris (5e)",
};

describe("useDeputyStore", () => {
  beforeEach(() => {
    useDeputyStore.getState().clear();
  });

  it("starts with null deputy and empty code postal", () => {
    const state = useDeputyStore.getState();
    expect(state.selectedDeputy).toBeNull();
    expect(state.codePostal).toBeNull();
  });

  it("sets deputy and code postal together", () => {
    useDeputyStore.getState().setDeputy(mockDeputy, "75005");
    const state = useDeputyStore.getState();
    expect(state.selectedDeputy).toEqual(mockDeputy);
    expect(state.codePostal).toBe("75005");
  });

  it("clears deputy and code postal", () => {
    useDeputyStore.getState().setDeputy(mockDeputy, "75005");
    useDeputyStore.getState().clear();
    const state = useDeputyStore.getState();
    expect(state.selectedDeputy).toBeNull();
    expect(state.codePostal).toBeNull();
  });

  it("replaces previous deputy on re-selection", () => {
    useDeputyStore.getState().setDeputy(mockDeputy, "75005");
    const newDeputy = {
      ...mockDeputy,
      id: "dep-456",
      fullName: "Pierre Durand",
    };
    useDeputyStore.getState().setDeputy(newDeputy, "93200");
    const state = useDeputyStore.getState();
    expect(state.selectedDeputy?.id).toBe("dep-456");
    expect(state.codePostal).toBe("93200");
  });

  it("tracks loading and error states", () => {
    useDeputyStore.getState().setLoading(true);
    expect(useDeputyStore.getState().isLoading).toBe(true);

    useDeputyStore.getState().setError("Code postal introuvable");
    expect(useDeputyStore.getState().error).toBe("Code postal introuvable");
    expect(useDeputyStore.getState().isLoading).toBe(false);
  });

  it("clears error when setting deputy", () => {
    useDeputyStore.getState().setError("some error");
    useDeputyStore.getState().setDeputy(mockDeputy, "75005");
    expect(useDeputyStore.getState().error).toBeNull();
  });
});

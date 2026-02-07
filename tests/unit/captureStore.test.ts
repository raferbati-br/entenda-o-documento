const setMock = jest.fn();
const getMock = jest.fn();
const delMock = jest.fn();

jest.mock("idb-keyval", () => ({
  set: (...args: unknown[]) => setMock(...args),
  get: (...args: unknown[]) => getMock(...args),
  del: (...args: unknown[]) => delMock(...args),
}));

import { clearCapture, loadCapture, saveCapture } from "@/lib/captureStore";


describe("captureStore", () => {
  beforeEach(async () => {
    setMock.mockReset();
    getMock.mockReset();
    delMock.mockReset();
    await clearCapture();
  });

  it("saves to memory and idb", async () => {
    const payload = { blob: new Blob(["x"]), createdAt: "now" };
    await saveCapture(payload);
    expect(setMock).toHaveBeenCalled();

    const loaded = await loadCapture();
    expect(loaded).toEqual(payload);
  });

  it("loads from idb when memory is empty", async () => {
    const payload = { blob: new Blob(["y"]), createdAt: "later" };
    getMock.mockResolvedValue(payload);

    const loaded = await loadCapture();
    expect(loaded).toEqual(payload);
  });

  it("returns null when idb fails", async () => {
    getMock.mockRejectedValue(new Error("fail"));
    const loaded = await loadCapture();
    expect(loaded).toBeNull();
  });

  it("clears memory and idb", async () => {
    const payload = { blob: new Blob(["z"]), createdAt: "t" };
    await saveCapture(payload);
    await clearCapture();

    expect(delMock).toHaveBeenCalled();
    const loaded = await loadCapture();
    expect(loaded).toBeNull();
  });
});

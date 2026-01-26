import { getItem, setItem } from "./storage";

const DEVICE_ID_KEY = "device_id";

let cachedDeviceId: string | null = null;

/**
 * Generates a UUID v4
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gets or creates a unique device ID for this device.
 * The ID is persisted to AsyncStorage and cached in memory.
 */
export async function getDeviceId(): Promise<string> {
  // Return cached value if available
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  // Try to load from storage
  const storedId = await getItem<string>(DEVICE_ID_KEY);
  if (storedId) {
    cachedDeviceId = storedId;
    return storedId;
  }

  // Generate new ID and persist it
  const newId = generateUUID();
  await setItem(DEVICE_ID_KEY, newId);
  cachedDeviceId = newId;
  return newId;
}

// The API speaks UTC with an explicit "Z" (see backend JacksonConfig).
// <input type="datetime-local"> values are in the browser's local time, so convert
// them before sending; server values can be passed straight to new Date().

/** "2026-10-05T10:00" (local) → "2026-10-05T04:30:00.000Z" (UTC). Empty input → null. */
export const toApiDateTime = (localInputValue) => {
  if (!localInputValue) return null;
  const date = new Date(localInputValue);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

// The signed-in user, as saved by the login page (localStorage "user").

const ROLE_LABELS = {
  STUDENT: "Student",
  EXAM_CREATOR: "Examiner",
  PROCTOR: "Proctor",
  ORG_ADMIN: "Org Admin",
  SUPER_ADMIN: "Super Admin",
};

/** @returns {{ name: string, email: string, role: string, roleLabel: string, initials: string }} */
export const getCurrentUser = () => {
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}") || {};
  } catch {
    // corrupted entry — fall back to an anonymous user
  }
  const name = user.name || user.email || "User";
  const initials = name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
  return {
    name,
    email: user.email || "",
    role: user.role || "",
    roleLabel: ROLE_LABELS[user.role] || user.role || "",
    initials: initials || "U",
  };
};

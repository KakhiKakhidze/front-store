const BASE = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const user = JSON.parse(localStorage.getItem("hsms_user") || "{}");
  const res = await fetch(`${BASE}${path}`, {
    headers: { 
      "Content-Type": "application/json", 
      "X-User-Role": user.role || "",
      ...options.headers 
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  del: (path) => request(path, { method: "DELETE" }),
};

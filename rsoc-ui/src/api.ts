const API_BASE = "http://localhost:8000/api";

const api = {
  get: async (path: string) => {
    const res = await fetch(`${API_BASE}${path}`);
    return res.json();
  },
  post: async (path: string, body: unknown) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  del: async (path: string) => {
    await fetch(`${API_BASE}${path}`, { method: "DELETE" });
  },
};

export default api;

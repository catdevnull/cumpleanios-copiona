export const API_URL =
  import.meta.env.VITE_API_URL ??
  location.host.replace(":5173", ":3000") + "/ws";

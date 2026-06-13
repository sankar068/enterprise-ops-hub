export function generateRequestId(department: "HR" | "Finance" | "IT"): string {
  const prefix = department === "HR" ? "HR" : department === "Finance" ? "FIN" : "IT";
  const a = Math.floor(1000000 + Math.random() * 9000000);
  const b = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${a}-${b}`;
}

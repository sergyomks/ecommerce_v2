
export const getLastNMonths = (n) => {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: d.toLocaleString("en-US", { month: "short", year: "numeric" }),
      key: d.getTime(),
    });
  }
  return months;
};

export const formatNumber = (num) => {
  const n = Number(num);
  if (!Number.isFinite(n)) return "0";
  if (n < 1000) return n.toString();
  if (n < 1000000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  if (n < 1000000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  return (n / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
};

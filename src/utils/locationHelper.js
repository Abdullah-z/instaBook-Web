export const shortenAddress = (address) => {
  if (!address) return "";
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length <= 2) return address;
  // Return last two parts (e.g., City, Country)
  return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
};

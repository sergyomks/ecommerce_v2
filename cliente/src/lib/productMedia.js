export const parseImagenes = (imagenes) => {
  let imgs = imagenes;
  if (typeof imgs === "string") {
    try {
      imgs = JSON.parse(imgs);
    } catch {
      return [];
    }
  }
  return Array.isArray(imgs) ? imgs : [];
};

export const productImageUrl = (product) => {
  const first = parseImagenes(product?.imagenes)[0];
  if (!first) return "/placeholder.svg";
  if (typeof first === "string") return first;
  return first.url || "/placeholder.svg";
};

export const normalizeProduct = (product) => {
  if (!product) return product;
  return { ...product, imagenes: parseImagenes(product.imagenes) };
};

export const normCat = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

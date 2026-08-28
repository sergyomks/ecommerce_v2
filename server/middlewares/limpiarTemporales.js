import fs from "fs/promises";

const rutasTemporales = (archivos) =>
  Object.values(archivos || {})
    .flat()
    .map((archivo) => archivo?.tempFilePath)
    .filter(Boolean);

export const limpiarTemporales = (req, res, next) => {
  res.on("close", () => {
    for (const ruta of rutasTemporales(req.files)) {
      fs.unlink(ruta).catch(() => undefined);
    }
  });
  next();
};

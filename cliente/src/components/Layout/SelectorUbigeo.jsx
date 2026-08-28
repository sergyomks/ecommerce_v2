import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../lib/axios";

export default function SelectorUbigeo({ valor, onCambio, className = "" }) {
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);

  const [idDepartamento, setIdDepartamento] = useState("");
  const [idProvincia, setIdProvincia] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let vivo = true;
    axiosInstance
      .get("/ubigeo/departamentos")
      .then(({ data }) => {
        if (!vivo) return;
        setDepartamentos(data.departamentos || data.data || []);
        setCargando(false);
      })
      .catch(() => {
        if (!vivo) return;
        setError("No pudimos cargar la lista de departamentos.");
        setCargando(false);
      });
    return () => { vivo = false; };
  }, []);

  useEffect(() => {
    if (!idDepartamento) {
      setProvincias([]);
      return;
    }
    let vivo = true;
    axiosInstance
      .get(`/ubigeo/provincias/${idDepartamento}`)
      .then(({ data }) => {
        if (vivo) setProvincias(data.provincias || data.data || []);
      })
      .catch(() => { if (vivo) setProvincias([]); });
    return () => { vivo = false; };
  }, [idDepartamento]);

  useEffect(() => {
    if (!idProvincia) {
      setDistritos([]);
      return;
    }
    let vivo = true;
    axiosInstance
      .get(`/ubigeo/distritos/${idProvincia}`)
      .then(({ data }) => {
        if (vivo) setDistritos(data.distritos || data.data || []);
      })
      .catch(() => { if (vivo) setDistritos([]); });
    return () => { vivo = false; };
  }, [idProvincia]);

  const nombreDe = (lista, id) =>
    lista.find((x) => String(x.id) === String(id))?.nombre || "";

  const elegirDepartamento = (id) => {
    setIdDepartamento(id);
    setIdProvincia("");
    setDistritos([]);
    onCambio({
      id_distrito: null,
      departamento: nombreDe(departamentos, id),
      provincia: "",
      distrito: "",
    });
  };

  const elegirProvincia = (id) => {
    setIdProvincia(id);
    onCambio({
      id_distrito: null,
      departamento: nombreDe(departamentos, idDepartamento),
      provincia: nombreDe(provincias, id),
      distrito: "",
    });
  };

  const elegirDistrito = (id) => {
    onCambio({
      id_distrito: id ? Number(id) : null,
      departamento: nombreDe(departamentos, idDepartamento),
      provincia: nombreDe(provincias, idProvincia),
      distrito: nombreDe(distritos, id),
    });
  };

  const claseSelect =
    "w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

  if (error) {
    return <p className="text-sm text-red-400 md:col-span-2">{error}</p>;
  }

  return (
    <>
      <div className="md:col-span-2">
        <label htmlFor="ubigeo-departamento" className="block text-sm font-medium text-foreground mb-2">
          Departamento
        </label>
        <select
          id="ubigeo-departamento"
          value={idDepartamento}
          onChange={(e) => elegirDepartamento(e.target.value)}
          disabled={cargando}
          required
          className={claseSelect}
        >
          <option value="">
            {cargando ? "Cargando…" : "Selecciona un departamento"}
          </option>
          {departamentos.map((d) => (
            <option key={d.id} value={d.id}>{d.nombre}</option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <label htmlFor="ubigeo-provincia" className="block text-sm font-medium text-foreground mb-2">
          Provincia
        </label>
        <select
          id="ubigeo-provincia"
          value={idProvincia}
          onChange={(e) => elegirProvincia(e.target.value)}
          disabled={!idDepartamento}
          required
          className={claseSelect}
        >
          <option value="">
            {idDepartamento ? "Selecciona una provincia" : "Elige primero el departamento"}
          </option>
          {provincias.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <label htmlFor="ubigeo-distrito" className="block text-sm font-medium text-foreground mb-2">
          Distrito
        </label>
        <select
          id="ubigeo-distrito"
          value={valor?.id_distrito ?? ""}
          onChange={(e) => elegirDistrito(e.target.value)}
          disabled={!idProvincia}
          required
          className={claseSelect}
        >
          <option value="">
            {idProvincia ? "Selecciona un distrito" : "Elige primero la provincia"}
          </option>
          {distritos.map((d) => (
            <option key={d.id} value={d.id}>{d.nombre}</option>
          ))}
        </select>
      </div>
    </>
  );
}

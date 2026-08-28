import { useEffect, useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { toast } from "react-toastify";
import { axiosInstance } from "../lib/axios";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    website: "",
  });
  const [info, setInfo] = useState({
    email: "",
    telefono: "",
    direccion: "",
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    axiosInstance
      .get("/contacto/info")
      .then((res) => {
        setInfo({
          email: res.data.email || "",
          telefono: res.data.telefono || "",
          direccion: res.data.direccion || "",
        });
      })
      .catch(() => {

      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await axiosInstance.post("/contacto", {
        nombre: formData.name,
        email: formData.email,
        asunto: formData.subject,
        mensaje: formData.message,
        website: formData.website,
      });
      toast.success(res.data.message || "Mensaje enviado correctamente.");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        website: "",
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "No se pudo enviar el mensaje."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="store-wrap py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Contáctanos
          </h1>
          <p className="text-xl text-muted-foreground">
            Ponte en contacto con nuestro equipo
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Email</h3>
                <p className="text-muted-foreground">
                  {info.email || "cargando..."}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Teléfono</h3>
                <p className="text-muted-foreground">
                  {info.telefono || "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Dirección</h3>
                <p className="text-muted-foreground">
                  {info.direccion || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-secondary rounded-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              { }
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  required
                />
                <input
                  type="email"
                  placeholder="Tu correo electrónico"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  required
                />
              </div>

              <input
                type="text"
                placeholder="Asunto"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                required
              />

              <textarea
                rows="6"
                placeholder="Tu mensaje"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                required
              />

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2 disabled:opacity-60"
              >
                <Send className="w-5 h-5" />
                <span>{sending ? "Enviando..." : "Enviar mensaje"}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

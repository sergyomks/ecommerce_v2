import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { axiosInstance } from "../../lib/axios";

const Footer = () => {
  const [storeInfo, setStoreInfo] = useState({
    email: "",
    telefono: "",
    direccion: "Lima, Perú",
  });

  useEffect(() => {
    axiosInstance
      .get("/contacto/info")
      .then((res) => {
        setStoreInfo({
          email: res.data.email || "",
          telefono: res.data.telefono || "",
          direccion: res.data.direccion || "Lima, Perú",
        });
      })
      .catch(() => {});
  }, []);

  const columns = {
    brand: [
      { name: "Sobre nosotros", path: "/about" },
      { name: "Atención Textil SAC", path: "/contact" },
      { name: "Productos", path: "/products" },
      { name: "Blog", path: "#" },
    ],
    buy: [
      { name: "Todos los productos", path: "/products" },
      { name: "Lista de deseos", path: "/wishlist" },
      { name: "Mis pedidos", path: "/orders" },
      { name: "Preguntas frecuentes", path: "/faq" },
    ],
    sell: [
      { name: "Vende en Textil SAC", path: "/contact" },
      { name: "Trabaja con nosotros", path: "/about" },
      { name: "Publicidad", path: "/contact" },
      { name: "Afiliados", path: "#" },
    ],
    help: [
      { name: "Guía de compra", path: "/faq" },
      { name: "Envíos", path: "/faq" },
      { name: "Devoluciones", path: "/faq" },
      { name: "Contáctanos", path: "/contact" },
    ],
  };

  const socialLinks = [
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Youtube, href: "#", label: "YouTube" },
  ];

  return (
    <footer className="mt-10">
      <div className="relative overflow-hidden min-h-[180px] md:min-h-[220px] flex items-center justify-center bg-[#1A1C22]">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-[#1A1C22]/55" />
        <p
          className="relative z-10 px-6 text-center text-white text-3xl md:text-5xl italic font-medium"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          “Compremos sin fronteras”
        </p>
      </div>

      <div className="bg-[#1A1C22] text-white">
        <div className="store-wrap py-14">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 mb-12">
            <div className="col-span-2 md:col-span-3 lg:col-span-1">
              <h2 className="text-xl font-extrabold mb-3">Compañia Peruana Nacional Textil SAC</h2>
              <p className="text-white/60 text-sm mb-5 leading-relaxed">
                Tu socio de confianza para compras online. Calidad, estilo y envíos a todo el Perú.
              </p>
              <div className="flex items-center gap-3 mb-5">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10"
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
              <p className="text-white/40 text-xs">
                {storeInfo.email || storeInfo.telefono || storeInfo.direccion}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-4">Textil SAC</h3>
              <ul className="space-y-2.5">
                {columns.brand.map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-sm text-white/60 hover:text-white">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-4">Comprar</h3>
              <ul className="space-y-2.5">
                {columns.buy.map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-sm text-white/60 hover:text-white">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-4">Vender</h3>
              <ul className="space-y-2.5">
                {columns.sell.map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-sm text-white/60 hover:text-white">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-4">Guía y ayuda</h3>
              <ul className="space-y-2.5">
                {columns.help.map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-sm text-white/60 hover:text-white">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-center text-white/45 text-xs border-t border-white/10 pt-6">
            © 2021-{new Date().getFullYear()}, Compañia Peruana Nacional Textil SAC. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

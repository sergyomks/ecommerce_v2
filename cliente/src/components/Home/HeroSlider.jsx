import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const slides = [
  {
    id: 1,
    tag: "#Nueva colección",
    title: "Descubre nuestra nueva colección de ropa",
    subtitle: "Prendas seleccionadas para destacar tu estilo",
    url: "/products",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: 2,
    tag: "#Damas",
    title: "Elegancia y comodidad para ella",
    subtitle: "Looks modernos para cada ocasión",
    url: `/products?category=${encodeURIComponent("Mujer")}`,
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: 3,
    tag: "#Damas",
    title: "Vestidos y blusas de temporada",
    subtitle: "Frescura y estilo para tu día a día",
    url: `/products?category=${encodeURIComponent("Mujer")}`,
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: 4,
    tag: "#Caballeros",
    title: "Estilo casual y formal para él",
    subtitle: "Prendas versátiles para el día a día",
    url: `/products?category=${encodeURIComponent("Hombre")}`,
    image:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: 5,
    tag: "#Caballeros",
    title: "Camisetas y jeans de moda",
    subtitle: "Looks urbanos con actitud",
    url: `/products?category=${encodeURIComponent("Hombre")}`,
    image:
      "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: 6,
    tag: "#Adolescentes",
    title: "Moda juvenil y urbana",
    subtitle: "Estilo fresco para los más jóvenes",
    url: `/products?category=${encodeURIComponent("Adolescentes")}`,
    image:
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: 7,
    tag: "#Adolescentes",
    title: "Streetwear y tendencias",
    subtitle: "Lo último en moda juvenil",
    url: `/products?category=${encodeURIComponent("Adolescentes")}`,
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=80",
  },
];

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[currentSlide];

  return (
    <div className="relative overflow-hidden rounded-2xl store-hero w-full">
      <div className="grid md:grid-cols-2 min-h-[240px] sm:min-h-[300px] lg:min-h-[420px] xl:min-h-[480px]">
        <div className="flex flex-col justify-center px-5 sm:px-8 lg:px-14 xl:px-16 py-10">
          <p className="text-sm font-medium text-[#9CA3AF] mb-3">{slide.tag}</p>
          <h1 className="text-[28px] sm:text-[36px] lg:text-[44px] xl:text-[48px] font-extrabold store-ink leading-[1.15] mb-3 max-w-xl">
            {slide.title}
          </h1>
          <p className="store-muted mb-8 text-sm sm:text-base">{slide.subtitle}</p>
          <div className="flex space-x-2 mt-auto">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentSlide ? "bg-[var(--store-ink)]" : "bg-[var(--store-border)]"
                }`}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
        <Link
          to={slide.url}
          className="flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-[180px] sm:min-h-[240px]"
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full max-h-[220px] sm:max-h-[280px] lg:max-h-[380px] xl:max-h-[420px] object-cover rounded-2xl"
          />
        </Link>
      </div>
    </div>
  );
};

export default HeroSlider;

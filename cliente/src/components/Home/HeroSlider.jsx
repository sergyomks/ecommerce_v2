import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const slides = [
  {
    id: 1,
    tag: "#Oferta de moda",
    title: "Oferta por tiempo limitado! Hasta 50% OFF!",
    subtitle: "Redefine tu estilo diario",
    url: "/products",
    image:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: 2,
    tag: "#Electrónica",
    title: "Tecnología premium con descuento",
    subtitle: "Auriculares, relojes y más para tu día a día",
    url: "/products?category=Electronicos",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: 3,
    tag: "#Hogar",
    title: "Renueva tu espacio",
    subtitle: "Piezas seleccionadas para transformar tu casa",
    url: `/products?category=${encodeURIComponent("Hogar y jardin")}`,
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1400&q=80",
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

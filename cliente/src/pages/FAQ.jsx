import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQ = () => {
  const [openItems, setOpenItems] = useState({});

  const faqs = [
    {
      question: '¿Cómo hago un pedido?',
      answer: 'Simplemente navega por nuestros productos, agrega los artículos a tu carrito y procede al pago. Sigue las instrucciones para completar tu pedido.'
    },
    {
      question: '¿Qué métodos de pago aceptan?',
      answer: 'Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express y Diners) a través de Culqi, el procesador de pagos seguro en Perú.'
    },
    {
      question: '¿Cuánto tiempo tarda el envío?',
      answer: 'El envío estándar tarda entre 3 y 5 días hábiles. Las opciones de envío exprés están disponibles en el momento de realizar el pago.'
    },
    {
      question: '¿Cuál es su política de devoluciones?',
      answer: 'Ofrecemos una política de devolución de 30 días para la mayoría de los artículos. Los artículos deben estar en su estado original y con las etiquetas adjuntas.'
    }
  ];

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="min-h-screen">
      <div className="store-wrap py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Preguntas frecuentes</h1>
          <p className="text-xl text-muted-foreground">Encuentra respuestas a preguntas comunes</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-secondary rounded-xl overflow-hidden">
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-primary/10 transition-colors"
              >
                <h3 className="font-semibold text-foreground">{faq.question}</h3>
                {openItems[index] ? (
                  <ChevronUp className="w-5 h-5 text-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-foreground" />
                )}
              </button>
              {openItems[index] && (
                <div className="px-6 pb-4">
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
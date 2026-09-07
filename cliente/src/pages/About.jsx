import { Users, Target, Award, Heart } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: Heart,
      title: 'El cliente es lo primero',
      description: 'Ponemos a nuestros clientes en el centro de todo lo que hacemos.'
    },
    {
      icon: Award,
      title: 'Productos de calidad',
      description: 'Nos aseguramos de que todos los productos cumplan con nuestros altos estándares.'
    },
    {
      icon: Users,
      title: 'Comunidad',
      description: 'Construyendo relaciones duraderas con nuestros clientes.'
    },
    {
      icon: Target,
      title: 'Innovación',
      description: 'Mejorando constantemente nuestra plataforma y servicios.'
    }
  ];

  return (
    <div className="min-h-screen">
      <div className="store-wrap py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-6">Acerca de Compañia Peruana Nacional Textil SAC</h1>
          <p className="text-xl text-muted-foreground">
            Tu plataforma de comercio electrónico confiable para productos de calidad y un servicio excepcional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {values.map((value, index) => (
            <div key={index} className="bg-secondary rounded-xl p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <value.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{value.title}</h3>
              <p className="text-muted-foreground">{value.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-secondary rounded-xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Nuestra Historia</h2>
          <p className="text-muted-foreground leading-relaxed">
            Fundada con la visión de hacer que las compras en línea sean simples y agradables, Compañia Peruana Nacional Textil SAC ha crecido
            para convertirse en una plataforma confiable para miles de clientes en todo el mundo. Creemos que
            todos merecen acceso a productos de calidad a precios justos, respaldados por un servicio al cliente
            excepcional.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
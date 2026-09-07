import { Package } from "lucide-react";

const App = () => {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <section className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
          <Package size={28} />
        </div>
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">
          Panel administrativo retirado
        </h1>
        <p className="text-slate-600 leading-relaxed">
          El panel admin vive en <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">cliente/src/admin/</code>.
          Esta carpeta conserva solo la configuración base de Vite para mantener
          el repositorio consistente.
        </p>
        <a
          href="../../README.md"
          className="inline-block mt-6 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm hover:bg-slate-700"
        >
          Ver README del proyecto
        </a>
      </section>
    </main>
  );
};

export default App;

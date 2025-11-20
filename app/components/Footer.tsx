const Footer = () => {
  return (
    <footer className="mt-12 mb-8 w-full max-w-[600px]">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 shadow-xl border border-white/20">
        <h3 className="text-center text-lg font-semibold text-yellow-300 mb-4">
          Creado por
        </h3>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            "Juan Caballero",
            "Jesús Castro",
            "Jesús Carbonó",
            "Mariana Díaz",
            "Pedro Ruiz",
          ].map((name, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-red-500/30 to-red-600/30 px-4 py-2 rounded-full border border-red-400/50 hover:scale-105 transition-transform duration-200"
            >
              <span className="text-sm font-medium text-white">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;

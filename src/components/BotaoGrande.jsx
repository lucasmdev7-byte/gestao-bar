export default function BotaoGrande({
  children,
  onClick,
  variante = 'primario',
  disabled = false,
  className = '',
  ...rest
}) {
  const estilos = {
    primario: 'bg-blue-700 text-white',
    sucesso: 'bg-green-600 text-white',
    perigo: 'bg-red-600 text-white',
    neutro: 'bg-white text-slate-900 border-4 border-slate-400'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      {...rest}
      className={`min-h-[72px] w-full rounded-2xl px-4 text-2xl font-bold shadow-md
        active:scale-95 transition disabled:opacity-40 ${estilos[variante]} ${className}`}
    >
      {children}
    </button>
  );
}

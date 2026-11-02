import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import BotaoGrande from '../components/BotaoGrande.jsx';

const formas = [
  { id: 'dinheiro', label: 'Dinheiro', icone: '💵' },
  { id: 'cartao', label: 'Cartão', icone: '💳' },
  { id: 'pix', label: 'PIX', icone: '📱' },
  { id: 'fiado', label: 'Fiado', icone: '📒' }
];

const moeda = (valor) =>
  Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function PDV() {
  const [produtos, setProdutos] = useState([]);
  const [conta, setConta] = useState({});
  const [formaPagamento, setFormaPagamento] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    supabase
      .from('produtos')
      .select('id, nome, preco, estoque_atual, emoji')
      .eq('ativo', true)
      .order('vendas_total', { ascending: false })
      .limit(12)
      .then(({ data, error }) => {
        if (error) setMensagem({ tipo: 'erro', texto: 'Não foi possível carregar os produtos.' });
        else setProdutos(data ?? []);
      });
  }, []);

  const itens = Object.values(conta);
  const total = useMemo(
    () => itens.reduce((soma, i) => soma + Number(i.produto.preco) * i.quantidade, 0),
    [itens]
  );

  const adicionar = (produto) => {
    setConta((atual) => {
      const qtd = (atual[produto.id]?.quantidade ?? 0) + 1;
      return { ...atual, [produto.id]: { produto, quantidade: qtd } };
    });
  };

  const alterarQuantidade = (produtoId, delta) => {
    setConta((atual) => {
      const item = atual[produtoId];
      if (!item) return atual;
      const qtd = item.quantidade + delta;
      const { [produtoId]: _removido, ...resto } = atual;
      return qtd > 0 ? { ...atual, [produtoId]: { ...item, quantidade: qtd } } : resto;
    });
  };

  const limpar = () => {
    setConta({});
    setFormaPagamento(null);
  };

  const finalizar = async () => {
    if (!itens.length || !formaPagamento) return;
    setSalvando(true);

    const { error } = await supabase.rpc('registrar_venda', {
      itens: itens.map((i) => ({
        produto_id: i.produto.id,
        quantidade: i.quantidade,
        preco_unitario: Number(i.produto.preco)
      })),
      forma_pagamento: formaPagamento
    });

    setSalvando(false);

    if (error) {
      setMensagem({ tipo: 'erro', texto: 'Não foi possível salvar. Tente de novo.' });
      return;
    }

    setMensagem({ tipo: 'sucesso', texto: `Venda de ${moeda(total)} concluída!` });
    limpar();
    setTimeout(() => setMensagem(null), 2500);
  };

  return (
    <section aria-labelledby="titulo-pdv" className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 id="titulo-pdv" className="text-3xl font-extrabold">Vender</h1>
        <span className="bg-green-600 text-white rounded-full px-4 py-2 font-bold">
          Caixa aberto ✅
        </span>
      </header>

      {mensagem && (
        <p
          role="status"
          className={`rounded-2xl p-4 text-xl font-bold text-white ${
            mensagem.tipo === 'sucesso' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {mensagem.texto}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {produtos.map((p) => {
          const semEstoque = p.estoque_atual <= 0;
          return (
            <BotaoGrande
              key={p.id}
              onClick={() => adicionar(p)}
              disabled={semEstoque}
              variante={semEstoque ? 'neutro' : 'primario'}
              className="flex-col !min-h-[110px]"
            >
              <span className="text-4xl" aria-hidden="true">{p.emoji ?? '🍽️'}</span>
              <span className="text-lg leading-tight">{p.nome}</span>
              <span className="text-base font-normal">{moeda(p.preco)}</span>
            </BotaoGrande>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-md space-y-3">
        <h2 className="text-2xl font-bold">Conta</h2>

        {itens.length === 0 && (
          <p className="text-lg text-slate-600">Toque nos produtos para adicionar.</p>
        )}

        {itens.map(({ produto, quantidade }) => (
          <div key={produto.id} className="flex items-center justify-between gap-2">
            <span className="text-xl font-semibold flex-1">
              {produto.nome} x{quantidade}
            </span>
            <button
              type="button"
              aria-label={`Diminuir ${produto.nome}`}
              onClick={() => alterarQuantidade(produto.id, -1)}
              className="w-16 h-16 rounded-xl bg-slate-200 text-3xl font-bold"
            >
              −
            </button>
            <button
              type="button"
              aria-label={`Aumentar ${produto.nome}`}
              onClick={() => alterarQuantidade(produto.id, +1)}
              className="w-16 h-16 rounded-xl bg-slate-200 text-3xl font-bold"
            >
              +
            </button>
          </div>
        ))}

        <p className="text-3xl font-extrabold text-right">Total: {moeda(total)}</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-2xl font-bold mb-2">Como o cliente vai pagar?</legend>
        <div className="grid grid-cols-2 gap-3">
          {formas.map((f) => (
            <BotaoGrande
              key={f.id}
              onClick={() => setFormaPagamento(f.id)}
              variante={formaPagamento === f.id ? 'sucesso' : 'neutro'}
              className="flex-col !min-h-[96px]"
              aria-pressed={formaPagamento === f.id}
            >
              <span className="text-4xl" aria-hidden="true">{f.icone}</span>
              {f.label}
            </BotaoGrande>
          ))}
        </div>
      </fieldset>

      <BotaoGrande
        variante="sucesso"
        onClick={finalizar}
        disabled={!itens.length || !formaPagamento || salvando}
      >
        {salvando ? 'Salvando...' : '✅ FINALIZAR VENDA'}
      </BotaoGrande>

      <BotaoGrande variante="perigo" onClick={limpar} disabled={!itens.length}>
        🗑️ Limpar conta
      </BotaoGrande>
    </section>
  );
}

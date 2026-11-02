import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import BotaoGrande from '../components/BotaoGrande.jsx';

const moeda = (valor) =>
  Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Fiado() {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [clienteAtivo, setClienteAtivo] = useState(null);
  const [acao, setAcao] = useState(null);
  const [valor, setValor] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [mensagem, setMensagem] = useState(null);

  const carregarClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome, telefone, saldo_devedor')
      .order('nome');

    if (error) setMensagem({ tipo: 'erro', texto: 'Erro ao carregar clientes.' });
    else setClientes(data ?? []);
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  const cadastrarCliente = async () => {
    if (!novoNome.trim()) {
      setMensagem({ tipo: 'erro', texto: 'Digite pelo menos o nome.' });
      return;
    }
    const { error } = await supabase
      .from('clientes')
      .insert({ nome: novoNome.trim(), telefone: novoTelefone.trim() || null, saldo_devedor: 0 });

    if (error) {
      setMensagem({ tipo: 'erro', texto: 'Não foi possível cadastrar.' });
      return;
    }
    setNovoNome('');
    setNovoTelefone('');
    setMensagem({ tipo: 'sucesso', texto: 'Cliente cadastrado!' });
    carregarClientes();
  };

  const registrarLancamento = async () => {
    const valorNumerico = Number(String(valor).replace(',', '.'));
    if (!clienteAtivo || !acao || !(valorNumerico > 0)) {
      setMensagem({ tipo: 'erro', texto: 'Informe um valor maior que zero.' });
      return;
    }

    const tipo = acao === 'compra' ? 'divida' : 'pagamento';
    const { error } = await supabase.from('fiado_lancamentos').insert({
      cliente_id: clienteAtivo.id,
      tipo,
      valor: valorNumerico
    });

    if (error) {
      setMensagem({ tipo: 'erro', texto: 'Não foi possível salvar. Tente de novo.' });
      return;
    }

    const { data } = await supabase
      .from('clientes')
      .select('id, nome, telefone, saldo_devedor')
      .eq('id', clienteAtivo.id)
      .single();

    const saldo = Number(data?.saldo_devedor ?? 0);
    setClienteAtivo(data);
    setValor('');
    setAcao(null);
    setMensagem({
      tipo: 'sucesso',
      texto:
        acao === 'compra'
          ? `Compra de ${moeda(valorNumerico)} lançada. Deve agora ${moeda(saldo)}.`
          : `${clienteAtivo.nome} pagou ${moeda(valorNumerico)}. Saldo restante: ${moeda(saldo)}.`
    });
    carregarClientes();
  };

  const pagarTudo = () => {
    if (!clienteAtivo) return;
    setValor(String(Number(clienteAtivo.saldo_devedor)).replace('.', ','));
  };

  const clientesFiltrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <section aria-labelledby="titulo-fiado" className="space-y-4">
      <h1 id="titulo-fiado" className="text-3xl font-extrabold">Fiado</h1>

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

      <div className="bg-white rounded-2xl p-4 shadow-md space-y-3">
        <label htmlFor="novo-nome" className="block text-xl font-bold">Novo cliente</label>
        <input
          id="novo-nome"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          placeholder="Nome"
          className="w-full min-h-[64px] rounded-xl border-4 border-slate-300 px-4 text-xl"
        />
        <input
          value={novoTelefone}
          onChange={(e) => setNovoTelefone(e.target.value)}
          placeholder="Telefone (opcional)"
          inputMode="tel"
          aria-label="Telefone opcional"
          className="w-full min-h-[64px] rounded-xl border-4 border-slate-300 px-4 text-xl"
        />
        <BotaoGrande variante="sucesso" onClick={cadastrarCliente}>
          ➕ Cadastrar cliente
        </BotaoGrande>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-md space-y-3">
        <label htmlFor="busca" className="block text-xl font-bold">Buscar cliente</label>
        <input
          id="busca"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Digite o nome"
          className="w-full min-h-[64px] rounded-xl border-4 border-slate-300 px-4 text-xl"
        />

        <ul className="space-y-2">
          {clientesFiltrados.map((c) => {
            const devendo = Number(c.saldo_devedor) > 0;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setClienteAtivo(c);
                    setAcao(null);
                  }}
                  className={`w-full min-h-[80px] rounded-2xl px-4 text-left flex justify-between items-center
                    text-xl font-bold border-4 ${
                      devendo
                        ? 'bg-red-50 border-red-600 text-red-700'
                        : 'bg-green-50 border-green-600 text-green-800'
                    }`}
                >
                  <span>{c.nome}</span>
                  <span>{devendo ? `Deve ${moeda(c.saldo_devedor)}` : 'Em dia ✅'}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {clienteAtivo && (
        <div className="bg-white rounded-2xl p-4 shadow-lg border-4 border-blue-700 space-y-3">
          <h2 className="text-2xl font-extrabold">{clienteAtivo.nome}</h2>
          <p className="text-3xl font-extrabold">
            Saldo: {moeda(clienteAtivo.saldo_devedor)}
          </p>

          {!acao && (
            <div className="space-y-3">
              <BotaoGrande variante="perigo" onClick={() => setAcao('compra')}>
                🛒 Lançar compra
              </BotaoGrande>
              <BotaoGrande variante="sucesso" onClick={() => setAcao('pagamento')}>
                💰 Registrar pagamento
              </BotaoGrande>
            </div>
          )}

          {acao && (
            <div className="space-y-3">
              <label htmlFor="valor" className="block text-xl font-bold">
                {acao === 'compra' ? 'Valor da compra (R$)' : 'Valor pago (R$)'}
              </label>
              <input
                id="valor"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                className="w-full min-h-[80px] rounded-xl border-4 border-slate-400 px-4 text-4xl text-center font-bold"
              />

              {acao === 'pagamento' && Number(clienteAtivo.saldo_devedor) > 0 && (
                <BotaoGrande variante="neutro" onClick={pagarTudo}>
                  ✅ Pagou tudo
                </BotaoGrande>
              )}

              <BotaoGrande variante="sucesso" onClick={registrarLancamento}>
                Confirmar
              </BotaoGrande>
              <BotaoGrande variante="neutro" onClick={() => setAcao(null)}>
                Cancelar
              </BotaoGrande>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

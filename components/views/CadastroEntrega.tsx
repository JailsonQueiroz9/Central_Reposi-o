'use client';
import React, { useState } from 'react';
import { PackageCheck, Search, ScanLine, User, Clock, Briefcase, FileText, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function CadastroEntrega() {
  const [cracha, setCracha] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSearch = async (val: string) => {
    setCracha(val);
    if (!val) {
      setPendingItems([]);
      setSelectedItem(null);
      return;
    }

    setLoading(true);
    try {
      const painelData = await api.post('getPainelData');
      // Filtra por destinatario_cracha e status não entregue
      const items = painelData.filter((r: any) => 
        String(r['destinatario_cracha']) === String(val) &&
        (!r['Status'] || r['Status'].toUpperCase() !== 'ENTREGUE')
      );
      setPendingItems(items);
      if (items.length > 0) {
        setSelectedItem(items[0]);
      } else {
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de entrega:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEntrega = async () => {
    if (!selectedItem) return;

    setLoading(true);
    try {
      const now = new Date();
      const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const updateData = {
        id: selectedItem.id,
        Status: 'ENTREGUE',
        Data_Entrega: formattedDate,
        entrega_status: 'ENTREGUE'
      };

      await api.post('updatePainelData', updateData);
      
      setMessage({ type: 'success', text: 'Entrega realizada com sucesso!' });
      
      // Remove o item da lista local
      const updatedItems = pendingItems.filter(item => item.id !== selectedItem.id);
      setPendingItems(updatedItems);
      if (updatedItems.length > 0) {
        setSelectedItem(updatedItems[0]);
      } else {
        setSelectedItem(null);
      }

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao realizar entrega:', error);
      setMessage({ type: 'error', text: 'Erro ao realizar entrega. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 h-full bg-gray-50 flex flex-col items-center overflow-auto">
      <div className="w-full max-w-full bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mt-4 mb-10">
        
        {/* Header */}
        <div className="bg-[#8B0000] p-6 text-white flex items-center gap-3">
          <PackageCheck size={32} className="text-orange-400" />
          <h1 className="text-2xl font-bold tracking-wide">Cadastro Entrega</h1>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Main Input Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            
            {/* Crachá Input */}
            <div className="md:col-span-1 bg-orange-50 rounded-xl p-6 flex flex-col justify-center items-center border border-orange-100 shadow-inner">
              <label className="text-sm font-bold text-orange-900 mb-4 text-center uppercase tracking-wider">
                Crachá<br/>Destinatário
              </label>
              <div className="relative w-full">
                <input 
                  type="text" 
                  value={cracha}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Escaneie o crachá..." 
                  className="w-full bg-transparent border-b-2 border-orange-300 focus:border-orange-600 outline-none text-center text-xl font-mono py-2 text-gray-800 placeholder-gray-400 transition-colors"
                  autoFocus
                />
                {loading ? (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                  </div>
                ) : (
                  <ScanLine className="absolute right-2 top-1/2 -translate-y-1/2 text-orange-400 opacity-50" size={20} />
                )}
              </div>
            </div>

            {/* Info Grid */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  <User size={14} /> Nome
                </div>
                <div className="text-base font-medium text-gray-800 min-h-[1.5rem] break-words">
                  {selectedItem?.destinatario_nome || selectedItem?.entrega_nome || selectedItem?.Nome || '-'}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  <Clock size={14} /> Turno
                </div>
                <div className="text-base font-medium text-gray-800 min-h-[1.5rem]">
                  {selectedItem?.destinatario_turno || selectedItem?.entrega_turno || selectedItem?.Turno || '-'}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  <Search size={14} /> Desc. Cel
                </div>
                <div className="text-base font-medium text-gray-800 min-h-[1.5rem] break-words">
                  {selectedItem?.destinatario_descCel || selectedItem?.entrega_descCel || selectedItem?.['Desc.Cel'] || '-'}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  <Briefcase size={14} /> Função
                </div>
                <div className="text-base font-medium text-gray-800 min-h-[1.5rem] break-words">
                  {selectedItem?.destinatario_funcao || selectedItem?.entrega_funcao || selectedItem?.['Função'] || '-'}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  <PackageCheck size={14} /> Ordem
                </div>
                <div className="text-base font-medium text-gray-800 min-h-[1.5rem]">
                  {selectedItem?.Ordem || selectedItem?.ordem || '-'}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  <ScanLine size={14} /> Ord_Rep
                </div>
                <div className="text-base font-medium text-gray-800 min-h-[1.5rem]">
                  {selectedItem?.Ord_Rep || selectedItem?.ordRep || '-'}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  <FileText size={14} /> N°_Req
                </div>
                <div className="text-base font-medium text-gray-800 min-h-[1.5rem]">
                  {selectedItem?.['N°_Req'] || selectedItem?.nReq || '-'}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  <Activity size={14} /> Marca
                </div>
                <div className="text-base font-medium text-gray-800 min-h-[1.5rem]">
                  {selectedItem?.Marca || selectedItem?.marca || '-'}
                </div>
              </div>

            </div>
          </div>

          {/* Pending Items Table */}
          {pendingItems.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-[#8B0000]" />
                Itens Pendentes para Entrega
              </h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold border-b">Selecionar</th>
                      <th className="p-4 font-bold border-b">Ord_Rep</th>
                      <th className="p-4 font-bold border-b">Produto</th>
                      <th className="p-4 font-bold border-b">Descrição</th>
                      <th className="p-4 font-bold border-b">Qtd.</th>
                      <th className="p-4 font-bold border-b">TAM.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingItems.map((item) => (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-blue-50 transition-colors cursor-pointer ${selectedItem?.id === item.id ? 'bg-blue-50' : ''}`}
                        onClick={() => setSelectedItem(item)}
                      >
                        <td className="p-4">
                          <input 
                            type="radio" 
                            checked={selectedItem?.id === item.id} 
                            onChange={() => setSelectedItem(item)}
                            className="w-4 h-4 text-blue-600"
                          />
                        </td>
                        <td className="p-4 text-sm font-medium text-gray-800">{item.Ord_Rep}</td>
                        <td className="p-4 text-sm text-gray-600">{item.Produtos}</td>
                        <td className="p-4 text-sm text-gray-600">{item['Descrição']}</td>
                        <td className="p-4 text-sm text-gray-600">{item['Qtd.']}</td>
                        <td className="p-4 text-sm text-gray-600">{item['TAM.']}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Message Feedback */}
          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-center pt-6 border-t border-gray-100">
            <button 
              onClick={handleEntrega}
              className="bg-[#483D8B] hover:bg-[#3b3175] text-white px-12 py-4 rounded-xl font-bold text-xl tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center gap-3 transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedItem || loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <PackageCheck size={28} />
              )}
              {loading ? 'PROCESSANDO...' : 'ENTREGA'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

'use client';
import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter, Loader2, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { dataCache } from '@/lib/cache';

export default function FollowUp() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Usa cache de 20s compartilhado com o Painel
      const data = await dataCache.get('painelData', () => api.post('getPainelData'), 20000);
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao buscar dados do painel:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = Object.values(order).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = statusFilter === 'ALL' || order['Status'] === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getCurrentFormattedDate = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `(${day}/${month}/${year}, ${hours}:${minutes}:${seconds})`;
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.startsWith('(')) return dateStr;
    
    try {
      // Tenta converter se for um formato ISO ou similar
      // Se for formato brasileiro DD/MM/YYYY, o Date() pode se perder, então retornamos como está se der NaN
      const parts = dateStr.split(/[-T:Z/ ]/);
      let d = new Date(dateStr);
      
      if (isNaN(d.getTime())) {
        return dateStr;
      }
      
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      
      return `(${day}/${month}/${year}, ${hours}:${minutes}:${seconds})`;
    } catch (e) {
      return dateStr;
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const now = getCurrentFormattedDate();
    setOrders(prev => prev.map(o => o.id === id ? { ...o, Status: newStatus, 'Data_ Avali_Follow': now } : o));
    await saveUpdate(id, { Status: newStatus, 'Data_ Avali_Follow': now });
  };

  const handleObservacaoChange = (id: string, newObs: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, 'Observação': newObs } : o));
  };

  const handleObservacaoBlur = async (id: string, newObs: string) => {
    const now = getCurrentFormattedDate();
    setOrders(prev => prev.map(o => o.id === id ? { ...o, 'Observação': newObs, 'Data_ Avali_Follow': now } : o));
    await saveUpdate(id, { 'Observação': newObs, 'Data_ Avali_Follow': now });
  };

  const saveUpdate = async (id: string, updates: any) => {
    setSavingId(id);
    try {
      const orderToUpdate = orders.find(o => o.id === id);
      if (orderToUpdate) {
        const updatedOrder = { ...orderToUpdate, ...updates };
        await api.post('updatePainelData', updatedOrder);
        
        // Invalida o cache para forçar atualização na próxima navegação
        dataCache.invalidate('painelData');
        console.log('[DEBUG] Cache painelData invalidado após atualização');
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      alert('Erro ao salvar as alterações.');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 h-full bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-red-800 w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="p-6 h-full bg-gray-50">
      <div className="max-w-full mx-auto h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="text-red-800" />
            Follow-up de Solicitações
          </h1>
          <div className="flex gap-3">
            <div className="bg-white border border-gray-300 rounded-lg flex items-center px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-red-800/20 transition-all">
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none ml-2 text-sm w-48" 
              />
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm ${showFilters ? 'ring-2 ring-red-800/20 bg-gray-50' : ''}`}
              >
                <Filter size={18} />
                Filtros
              </button>
              
              {showFilters && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50">
                  <h3 className="text-sm font-bold text-gray-800 mb-3">Filtrar por Status</h3>
                  <div className="space-y-2">
                    {['ALL', 'MPOK', 'SOLICITADO COMPRA', 'MP TRÂNSITO', 'MPNG'].map((status) => (
                      <label key={status} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
                        <input 
                          type="radio" 
                          name="statusFilter" 
                          checked={statusFilter === status}
                          onChange={() => setStatusFilter(status)}
                          className="text-red-800 focus:ring-red-800"
                        />
                        <span className="text-sm text-gray-600">{status === 'ALL' ? 'Todos' : status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-gray-600 text-sm">
                  <th className="p-4 font-semibold whitespace-nowrap">Ordem</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Ord_Rep</th>
                  <th className="p-4 font-semibold whitespace-nowrap">N°_Req</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Marca</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Ações (Status)</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Produto</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Descrição do Material</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Tamanho</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Quantidade</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Observação</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Setor</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Data Reg.</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Data Avali. Follow</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-mono text-sm text-gray-800 whitespace-nowrap">{order['Ordem']}</td>
                    <td className="p-4 font-mono text-sm text-gray-800 whitespace-nowrap">{order['Ord_Rep']}</td>
                    <td className="p-4 font-mono text-sm text-gray-800 whitespace-nowrap">{order['N°_Req']}</td>
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{order['Marca']}</td>
                    <td className="p-4 whitespace-nowrap">
                      <select 
                        value={order['Status'] || ''} 
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`px-2 py-1 rounded text-xs font-bold border outline-none cursor-pointer ${
                          order['Status'] === 'MPOK' ? 'bg-green-100 text-green-700 border-green-200' :
                          order['Status'] === 'SOLICITADO COMPRA' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                          order['Status'] === 'MP TRÂNSITO' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                        disabled={savingId === order.id}
                      >
                        <option value="">Selecione...</option>
                        <option value="MPOK">MPOK</option>
                        <option value="SOLICITADO COMPRA">SOLICITADO COMPRA</option>
                        <option value="MP TRÂNSITO">MP TRÂNSITO</option>
                        <option value="MPNG">MPNG</option>
                      </select>
                    </td>
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{order['Produtos']}</td>
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{order['Descrição']}</td>
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{order['TAM.']}</td>
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{order['Qtd.']}</td>
                    <td className="p-4 text-sm text-gray-600 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          value={order['Observação'] || ''} 
                          onChange={(e) => handleObservacaoChange(order.id, e.target.value)}
                          onBlur={(e) => handleObservacaoBlur(order.id, e.target.value)}
                          placeholder="Adicionar observação..."
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-red-500 transition-colors"
                          disabled={savingId === order.id}
                        />
                        {savingId === order.id && <Loader2 size={14} className="animate-spin text-gray-400" />}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{order['Setor'] || '-'}</td>
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{formatDateTime(order['Data_Reg_Central'])}</td>
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{formatDateTime(order['Data_ Avali_Follow'])}</td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-gray-500">
                      Nenhuma solicitação encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

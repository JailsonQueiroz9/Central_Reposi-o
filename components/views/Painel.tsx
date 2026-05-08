'use client';
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, CheckCircle2, AlertCircle, Package, Box, TableProperties, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { dataCache } from '@/lib/cache';

export default function Painel() {
  const [materiais, setMateriais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregamento Instantâneo com SWR
    dataCache.swr(
      'painelData', 
      () => api.post('getPainelData'), 
      (data) => {
        setMateriais(data || []);
        setLoading(false);
      },
      20000 // TTL de 20 segundos
    );
  }, []);

  // Cálculos dinâmicos baseados nos dados reais
  const ordensEmAndamento = materiais.length;
  const concluidasHoje = materiais.filter(m => {
    const status = String(m['Status'] || '').toUpperCase();
    return status === 'CONCLUÍDO' || status === 'ENTREGUE' || status === 'FINALIZADO';
  }).length;
  const atrasadas = materiais.filter(m => {
    const status = String(m['Status'] || '').toUpperCase();
    return status === 'ATRASADO';
  }).length;

  const stats = [
    { title: 'Ordens em Andamento', value: ordensEmAndamento.toString(), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Atrasadas', value: atrasadas.toString(), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
    { title: 'Concluídas', value: concluidasHoje.toString(), icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Tempo Médio (h)', value: 'N/A', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  const mpStatusCounts = materiais.reduce((acc, curr) => {
    const status = String(curr['Status'] || 'OUTROS').toUpperCase().trim();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mpStatus = [
    { status: 'MPOK', count: mpStatusCounts['MPOK'] || 0, color: 'bg-green-500' },
    { status: 'SOLICITADO COMPRA', count: mpStatusCounts['SOLICITADO COMPRA'] || 0, color: 'bg-orange-500' },
    { status: 'MP TRÂNSITO', count: mpStatusCounts['MP TRÂNSITO'] || 0, color: 'bg-blue-500' },
    { status: 'MPNG', count: mpStatusCounts['MPNG'] || 0, color: 'bg-red-500' },
  ].filter(item => item.count > 0);

  if (mpStatus.length === 0) {
    mpStatus.push({ status: 'Sem Dados', count: 0, color: 'bg-gray-400' });
  }

  const ultimasAtualizacoes = [...materiais]
    .reverse()
    .slice(0, 6)
    .map(m => ({
      ordem: m['Ordem'] || m['Ord_Rep'] || 'Desconhecida',
      status: m['Status'] || 'Atualizado',
      data: m['Data_Reg_Central'] || 'Recentemente'
    }));

  const setorCounts = materiais.reduce((acc, curr) => {
    const setor = String(curr['Setor'] || 'N/A').toUpperCase().trim();
    if (setor && setor !== 'UNDEFINED' && setor !== 'NULL') {
      acc[setor] = (acc[setor] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const producaoSetor = Object.entries(setorCounts)
    .map(([label, val]) => ({ 
      label, 
      count: val,
      percentage: Math.round((val / materiais.length) * 100) 
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  if (producaoSetor.length === 0) {
    producaoSetor.push({ label: 'Sem Dados', count: 0, percentage: 0 });
  }

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.startsWith('(')) return dateStr;
    
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      
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

  if (loading) {
    return (
      <div className="p-4 md:p-8 h-full bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-red-800 w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-full mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <BarChart3 className="text-red-800" size={32} />
          Painel de Status
        </h1>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${stat.bg}`}>
                  <Icon className={stat.color} size={28} />
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium mb-1">{stat.title}</div>
                  <div className="text-3xl font-bold text-gray-800">{stat.value}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3x1 Grid for Main Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Últimas Atualizações */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 h-[400px] flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Clock className="text-gray-400" size={24} />
              Últimas Atualizações
            </h2>
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              {ultimasAtualizacoes.length > 0 ? ultimasAtualizacoes.map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Box className="text-blue-600" size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-800 mb-1">Ordem {item.ordem} - {item.status}</div>
                    <div className="text-xs text-gray-500 font-medium">{formatDateTime(item.data)}</div>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-gray-500">Nenhuma atualização recente.</div>
              )}
            </div>
          </div>

          {/* Column 2: Produção por Setor */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 h-[400px] flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <TrendingUp className="text-gray-400" size={24} />
              Produção por Setor
            </h2>
            <div className="flex-1 flex items-end justify-between gap-2 pt-4">
              {producaoSetor.map((item, i) => (
                <div key={i} className="w-full h-full flex flex-col items-center justify-end gap-2 group">
                  <div className="w-full bg-red-50 rounded-t-lg relative flex-1 flex items-end justify-center">
                    <div 
                      className="w-full bg-red-800 rounded-t-lg transition-all duration-500 hover:bg-red-700 relative" 
                      style={{ height: `${item.count > 0 ? Math.max(item.percentage, 5) : 0}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {item.count} itens ({item.percentage}%)
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] md:text-xs font-medium text-gray-500 truncate w-full text-center" title={item.label}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Status da Matéria-Prima */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 h-[400px] flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Package className="text-gray-400" size={24} />
              Status da Matéria-Prima
            </h2>
            <div className="flex-1 flex flex-col justify-center gap-4">
              {mpStatus.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-bold text-gray-600">{item.status}</span>
                  </div>
                  <div className="text-3xl font-black text-gray-800">{item.count}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Row: Tabela de Materiais */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TableProperties className="text-gray-400" size={24} />
            Descrição de Materiais
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-[#00FF00] border-b border-gray-200">
                  <th className="p-3 text-sm font-bold text-black border-r border-white/20">Ordem</th>
                  <th className="p-3 text-sm font-bold text-black border-r border-white/20">Ord_Rep</th>
                  <th className="p-3 text-sm font-bold text-black border-r border-white/20">N°_Req</th>
                  <th className="p-3 text-sm font-bold text-black border-r border-white/20">Marca</th>
                  <th className="p-3 text-sm font-bold text-black border-r border-white/20">Produtos</th>
                  <th className="p-3 text-sm font-bold text-black border-r border-white/20">Descrição</th>
                  <th className="p-3 text-sm font-bold text-black border-r border-white/20">Qtd.</th>
                  <th className="p-3 text-sm font-bold text-black border-r border-white/20">Medida</th>
                  <th className="p-3 text-sm font-bold text-black border-r border-white/20">TAM.</th>
                  <th className="p-3 text-sm font-bold text-black border-r border-white/20">Status</th>
                  <th className="p-3 text-sm font-bold text-black border-r border-white/20">Data_Reg_Central</th>
                  <th className="p-3 text-sm font-bold text-black border-r border-white/20">Data_Ent_Almox.</th>
                  <th className="p-3 text-sm font-bold text-black border-r border-white/20">Data_Entrega</th>
                  <th className="p-3 text-sm font-bold text-black border-r border-white/20">Data_Ent_Avi</th>
                  <th className="p-3 text-sm font-bold text-black border-r border-white/20">Data_Ent_Central</th>
                  <th className="p-3 text-sm font-bold text-black border-r border-white/20">Data_ Avali_Follow</th>
                  <th className="p-3 text-sm font-bold text-black border-r border-white/20">Observação</th>
                  <th className="p-3 text-sm font-bold text-black">Setor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {materiais.map((mat, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors bg-[#F5DEB3]/30">
                    <td className="p-3 text-sm font-medium text-gray-800 border-r border-gray-200/50">{mat['Ordem']}</td>
                    <td className="p-3 text-sm text-gray-600 border-r border-gray-200/50">{mat['Ord_Rep']}</td>
                    <td className="p-3 text-sm text-gray-600 border-r border-gray-200/50">{mat['N°_Req']}</td>
                    <td className="p-3 text-sm text-gray-600 border-r border-gray-200/50">{mat['Marca']}</td>
                    <td className="p-3 text-sm text-gray-600 border-r border-gray-200/50">{mat['Produtos']}</td>
                    <td className="p-3 text-sm text-gray-600 border-r border-gray-200/50">{mat['Descrição']}</td>
                    <td className="p-3 text-sm text-gray-600 border-r border-gray-200/50">{mat['Qtd.']}</td>
                    <td className="p-3 text-sm text-gray-600 border-r border-gray-200/50">{mat['Medida']}</td>
                    <td className="p-3 text-sm text-gray-600 border-r border-gray-200/50">{mat['TAM.']}</td>
                    <td className="p-3 text-sm text-gray-600 border-r border-gray-200/50">{mat['Status']}</td>
                    <td className="p-3 text-sm text-gray-600 border-r border-gray-200/50">{formatDateTime(mat['Data_Reg_Central'])}</td>
                    <td className="p-3 text-sm text-gray-600 border-r border-gray-200/50">{formatDateTime(mat['Data_Ent_Almox.'])}</td>
                    <td className="p-3 text-sm text-gray-600 border-r border-gray-200/50">{formatDateTime(mat['Data_Entrega'])}</td>
                    <td className="p-3 text-sm text-gray-600 border-r border-gray-200/50">{formatDateTime(mat['Data_Ent_Avi'])}</td>
                    <td className="p-3 text-sm text-gray-600 border-r border-gray-200/50">{formatDateTime(mat['Data_Ent_Central'])}</td>
                    <td className="p-3 text-sm text-gray-600 border-r border-gray-200/50">{formatDateTime(mat['Data_ Avali_Follow'])}</td>
                    <td className="p-3 text-sm text-gray-600 border-r border-gray-200/50">{mat['Observação']}</td>
                    <td className="p-3 text-sm text-gray-600">{mat['Setor']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}} />
    </div>
  );
}

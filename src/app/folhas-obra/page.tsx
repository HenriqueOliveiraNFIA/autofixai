'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, FileText, Download, Eye, CheckCircle, Clock, Save } from 'lucide-react'

interface FolhaObra {
  id: string
  numero_folha: string
  data_emissao: string
  cliente_nome?: string
  cliente_telefone?: string
  veiculo_marca?: string
  veiculo_modelo?: string
  veiculo_matricula?: string
  veiculo_km?: number
  tipo_servico?: string
  descricao_servico?: string
  horas_trabalhadas?: number
  preco_hora?: number
  total_mao_obra?: number
  total_pecas?: number
  subtotal?: number
  taxa_iva?: number
  valor_iva?: number
  total_final?: number
  status_pagamento: string
  status_entrega: string
  owner_id?: string
}

export default function FolhasObraPage() {
  const router = useRouter()
  const [folhas, setFolhas] = useState<FolhaObra[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFolha, setSelectedFolha] = useState<FolhaObra | null>(null)
  const [savingToHistory, setSavingToHistory] = useState<string | null>(null)

  useEffect(() => {
    loadFolhas()
  }, [])

  const loadFolhas = async () => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      router.push('/login')
      return
    }

    try {
      const { data } = await supabase
        .from('folhas_obra')
        .select('*')
        .eq('owner_id', userId)
        .order('data_emissao', { ascending: false })

      setFolhas(data || [])
    } catch (error) {
      console.error('Erro ao carregar folhas de obra:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, field: string, value: string) => {
    try {
      await supabase
        .from('folhas_obra')
        .update({ [field]: value })
        .eq('id', id)
      
      loadFolhas()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const handleSaveToHistory = async (folha: FolhaObra) => {
    if (!folha.veiculo_matricula) {
      alert('Esta folha de obra não possui matrícula do veículo')
      return
    }

    setSavingToHistory(folha.id)

    try {
      // Buscar informações da oficina
      const userId = localStorage.getItem('userId')
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome_oficina, nome')
        .eq('auth_id', userId)
        .single()

      // Buscar peças do trabalho relacionado
      const { data: trabalho } = await supabase
        .from('trabalhos')
        .select('id')
        .eq('veiculo_matricula', folha.veiculo_matricula)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      let pecas = []
      if (trabalho) {
        const { data: pecasData } = await supabase
          .from('pecas_trabalho')
          .select('*')
          .eq('trabalho_id', trabalho.id)
        
        pecas = pecasData || []
      }

      // Salvar no histórico global
      const { error } = await supabase
        .from('vehicle_history')
        .insert({
          matricula: folha.veiculo_matricula,
          oficina_id: userId,
          oficina_nome: profile?.nome_oficina || profile?.nome || 'Oficina',
          tipo_trabalho: folha.tipo_servico || 'Não especificado',
          data_servico: folha.data_emissao,
          descricao: folha.descricao_servico || '',
          pecas: pecas,
          horas_trabalhadas: folha.horas_trabalhadas || 0,
          total_mao_obra: folha.total_mao_obra || 0,
          total_pecas: folha.total_pecas || 0,
          total_final: folha.total_final || 0,
          folha_obra_id: folha.id
        })

      if (error) throw error

      alert('✅ Folha de obra salva no histórico global do veículo!')
    } catch (error) {
      console.error('Erro ao salvar no histórico:', error)
      alert('Erro ao salvar no histórico. Tente novamente.')
    } finally {
      setSavingToHistory(null)
    }
  }

  const handlePrint = (folha: FolhaObra) => {
    setSelectedFolha(folha)
    setTimeout(() => {
      window.print()
    }, 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff8c00] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm print:hidden">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Folhas de Obra</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {folhas.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Nenhuma folha de obra gerada ainda</p>
              <Button 
                className="bg-[#ff8c00] hover:bg-[#e67e00]"
                onClick={() => router.push('/trabalhos')}
              >
                Ir para Trabalhos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {folhas.map((folha) => (
              <Card key={folha.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-[#ff8c00]" />
                        {folha.numero_folha}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(folha.data_emissao).toLocaleDateString('pt-PT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveToHistory(folha)}
                        disabled={savingToHistory === folha.id}
                        className="border-green-500 text-green-600 hover:bg-green-50"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        {savingToHistory === folha.id ? 'Salvando...' : 'Salvar no Histórico'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrint(folha)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Imprimir
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Cliente e Veículo */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Cliente</p>
                        <p className="text-sm text-gray-900">{folha.cliente_nome || '-'}</p>
                        <p className="text-xs text-gray-600">{folha.cliente_telefone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Veículo</p>
                        <p className="text-sm text-gray-900">
                          {folha.veiculo_marca} {folha.veiculo_modelo}
                        </p>
                        <p className="text-xs text-gray-600">
                          {folha.veiculo_matricula} {folha.veiculo_km ? `• ${folha.veiculo_km} km` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Tipo de Serviço */}
                    <div>
                      <p className="text-sm font-medium text-gray-700">Tipo de Serviço</p>
                      <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                        {folha.tipo_servico?.toUpperCase() || '-'}
                      </span>
                    </div>

                    {/* Descrição */}
                    {folha.descricao_servico && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Descrição do Serviço</p>
                        <p className="text-sm text-gray-600">{folha.descricao_servico}</p>
                      </div>
                    )}

                    {/* Valores */}
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Mão de Obra</p>
                          <p className="font-medium">
                            {folha.horas_trabalhadas}h × €{folha.preco_hora?.toFixed(2)} = €{folha.total_mao_obra?.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Peças</p>
                          <p className="font-medium">€{folha.total_pecas?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Subtotal</p>
                          <p className="font-medium">€{folha.subtotal?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">IVA ({folha.taxa_iva}%)</p>
                          <p className="font-medium">€{folha.valor_iva?.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex justify-between items-center">
                          <p className="text-lg font-bold text-gray-900">Total Final</p>
                          <p className="text-2xl font-bold text-[#ff8c00]">€{folha.total_final?.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Pagamento</Label>
                        <select
                          value={folha.status_pagamento}
                          onChange={(e) => handleUpdateStatus(folha.id, 'status_pagamento', e.target.value)}
                          className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="pendente">Pendente</option>
                          <option value="parcial">Parcial</option>
                          <option value="pago">Pago</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Entrega</Label>
                        <select
                          value={folha.status_entrega}
                          onChange={(e) => handleUpdateStatus(folha.id, 'status_entrega', e.target.value)}
                          className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="na_oficina">Na Oficina</option>
                          <option value="entregue">Entregue</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Impressão */}
      {selectedFolha && (
        <div className="hidden print:block">
          <div className="p-8 bg-white">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">FOLHA DE OBRA</h1>
              <p className="text-lg text-gray-600 mt-2">{selectedFolha.numero_folha}</p>
              <p className="text-sm text-gray-500">
                {new Date(selectedFolha.data_emissao).toLocaleDateString('pt-PT')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">CLIENTE</h3>
                <p>{selectedFolha.cliente_nome}</p>
                <p className="text-sm text-gray-600">{selectedFolha.cliente_telefone}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">VEÍCULO</h3>
                <p>{selectedFolha.veiculo_marca} {selectedFolha.veiculo_modelo}</p>
                <p className="text-sm text-gray-600">
                  {selectedFolha.veiculo_matricula} • {selectedFolha.veiculo_km} km
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-2">TIPO DE SERVIÇO</h3>
              <p className="uppercase">{selectedFolha.tipo_servico}</p>
            </div>

            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-2">DESCRIÇÃO</h3>
              <p>{selectedFolha.descricao_servico}</p>
            </div>

            <table className="w-full mb-8">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="text-left py-2">Descrição</th>
                  <th className="text-right py-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">
                    Mão de Obra ({selectedFolha.horas_trabalhadas}h × €{selectedFolha.preco_hora?.toFixed(2)})
                  </td>
                  <td className="text-right">€{selectedFolha.total_mao_obra?.toFixed(2)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Peças e Materiais</td>
                  <td className="text-right">€{selectedFolha.total_pecas?.toFixed(2)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Subtotal</td>
                  <td className="text-right font-medium">€{selectedFolha.subtotal?.toFixed(2)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">IVA ({selectedFolha.taxa_iva}%)</td>
                  <td className="text-right">€{selectedFolha.valor_iva?.toFixed(2)}</td>
                </tr>
                <tr className="border-b-2 border-gray-900">
                  <td className="py-3 text-lg font-bold">TOTAL</td>
                  <td className="text-right text-lg font-bold">€{selectedFolha.total_final?.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-8 text-sm">
              <div>
                <p className="font-bold">Status Pagamento:</p>
                <p className="uppercase">{selectedFolha.status_pagamento}</p>
              </div>
              <div>
                <p className="font-bold">Status Entrega:</p>
                <p className="uppercase">{selectedFolha.status_entrega}</p>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t text-center text-sm text-gray-600">
              <p>Obrigado pela preferência!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}

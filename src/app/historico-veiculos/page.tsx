'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Search, History, Calendar, Wrench, Package, Building2 } from 'lucide-react'

interface HistoricoItem {
  id: string
  matricula: string
  oficina_id: string
  oficina_nome: string
  tipo_trabalho: string
  data_servico: string
  descricao: string
  pecas: any
  horas_trabalhadas: number
  total_mao_obra: number
  total_pecas: number
  total_final: number
  created_at: string
}

export default function HistoricoVeiculosPage() {
  const router = useRouter()
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchMatricula, setSearchMatricula] = useState('')
  const [filteredHistorico, setFilteredHistorico] = useState<HistoricoItem[]>([])

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      router.push('/login')
    }
  }, [router])

  const handleSearch = async () => {
    if (!searchMatricula.trim()) {
      alert('Por favor, insira uma matrícula para pesquisar')
      return
    }

    setLoading(true)
    try {
      // Buscar histórico global por matrícula
      const { data, error } = await supabase
        .from('vehicle_history')
        .select('*')
        .ilike('matricula', `%${searchMatricula.trim()}%`)
        .order('data_servico', { ascending: false })

      if (error) throw error

      setHistorico(data || [])
      setFilteredHistorico(data || [])
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
      alert('Erro ao buscar histórico do veículo')
    } finally {
      setLoading(false)
    }
  }

  const groupByMatricula = () => {
    const grouped: { [key: string]: HistoricoItem[] } = {}
    filteredHistorico.forEach(item => {
      if (!grouped[item.matricula]) {
        grouped[item.matricula] = []
      }
      grouped[item.matricula].push(item)
    })
    return grouped
  }

  const groupedHistorico = groupByMatricula()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Histórico de Veículos</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Digite a matrícula do veículo (ex: AA-00-BB)"
                  value={searchMatricula}
                  onChange={(e) => setSearchMatricula(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="text-lg"
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={loading}
                className="bg-[#ff8c00] hover:bg-[#e67e00]"
              >
                <Search className="w-4 h-4 mr-2" />
                {loading ? 'Pesquisando...' : 'Pesquisar'}
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Pesquise o histórico completo de qualquer veículo registrado na plataforma
            </p>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff8c00] mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando histórico...</p>
          </div>
        ) : Object.keys(groupedHistorico).length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {searchMatricula 
                  ? 'Nenhum histórico encontrado para esta matrícula' 
                  : 'Digite uma matrícula para ver o histórico completo'}
              </p>
              <p className="text-sm text-gray-500">
                O histórico mostra todos os serviços realizados em todas as oficinas da plataforma
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedHistorico).map(([matricula, items]) => (
              <Card key={matricula} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <History className="w-6 h-6 mr-3 text-[#ff8c00]" />
                      <div>
                        <p className="text-xl font-bold text-gray-900">{matricula}</p>
                        <p className="text-sm font-normal text-gray-600 mt-1">
                          {items.length} {items.length === 1 ? 'serviço registrado' : 'serviços registrados'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Gasto</p>
                      <p className="text-2xl font-bold text-[#ff8c00]">
                        €{items.reduce((sum, item) => sum + (item.total_final || 0), 0).toFixed(2)}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {items.map((item, index) => (
                      <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium">
                                #{items.length - index}
                              </span>
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium uppercase">
                                {item.tipo_trabalho}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 space-x-4 mt-2">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(item.data_servico).toLocaleDateString('pt-PT', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="flex items-center">
                                <Building2 className="w-4 h-4 mr-1" />
                                {item.oficina_nome || 'Oficina não identificada'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                              €{item.total_final?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>

                        {/* Descrição */}
                        {item.descricao && (
                          <div className="mb-4">
                            <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                              <Wrench className="w-4 h-4 mr-1" />
                              Descrição do Serviço
                            </div>
                            <p className="text-sm text-gray-600 pl-5">{item.descricao}</p>
                          </div>
                        )}

                        {/* Peças */}
                        {item.pecas && Array.isArray(item.pecas) && item.pecas.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
                              <Package className="w-4 h-4 mr-1" />
                              Peças Utilizadas
                            </div>
                            <div className="pl-5 space-y-1">
                              {item.pecas.map((peca: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-gray-600">
                                    {peca.nome} {peca.quantidade && `(${peca.quantidade}x)`}
                                  </span>
                                  {peca.preco && (
                                    <span className="text-gray-900 font-medium">
                                      €{(peca.preco * (peca.quantidade || 1)).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Detalhes Financeiros */}
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                          <div>
                            <p className="text-xs text-gray-600">Mão de Obra</p>
                            <p className="text-sm font-medium text-gray-900">
                              {item.horas_trabalhadas}h • €{item.total_mao_obra?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Peças</p>
                            <p className="text-sm font-medium text-gray-900">
                              €{item.total_pecas?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">Total</p>
                            <p className="text-sm font-bold text-[#ff8c00]">
                              €{item.total_final?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

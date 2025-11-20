'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Wrench, Clock, CheckCircle, Package, AlertCircle } from 'lucide-react'

interface Trabalho {
  id: string
  car_id?: string
  cliente_nome?: string
  cliente_telefone?: string
  data_entrada: string
  data_prevista_conclusao?: string
  status: string
  tipo_problema?: string
  descricao_problema?: string
  diagnostico?: string
  materiais_necessarios?: string
  orcamento_pecas?: number
  orcamento_mao_obra?: number
  horas_estimadas?: number
  preco_hora?: number
  notas?: string
}

interface Car {
  id: string
  marca: string
  modelo: string
  matricula: string
}

export default function TrabalhosPage() {
  const router = useRouter()
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([])
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [newTrabalho, setNewTrabalho] = useState({
    car_id: '',
    cliente_nome: '',
    cliente_telefone: '',
    data_prevista_conclusao: '',
    tipo_problema: 'avaria',
    descricao_problema: '',
    diagnostico: '',
    materiais_necessarios: '',
    orcamento_pecas: '',
    orcamento_mao_obra: '',
    horas_estimadas: '',
    preco_hora: '25.00',
    notas: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      router.push('/login')
      return
    }

    try {
      const { data: trabalhosData } = await supabase
        .from('trabalhos')
        .select('*')
        .eq('owner_id', userId)
        .order('data_entrada', { ascending: false })

      setTrabalhos(trabalhosData || [])

      const { data: carsData } = await supabase
        .from('cars')
        .select('id, marca, modelo, matricula')
        .eq('owner_id', userId)

      setCars(carsData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTrabalho = async () => {
    const userId = localStorage.getItem('userId')
    if (!userId) return

    try {
      await supabase.from('trabalhos').insert({
        owner_id: userId,
        car_id: newTrabalho.car_id || null,
        cliente_nome: newTrabalho.cliente_nome,
        cliente_telefone: newTrabalho.cliente_telefone,
        data_prevista_conclusao: newTrabalho.data_prevista_conclusao || null,
        tipo_problema: newTrabalho.tipo_problema,
        descricao_problema: newTrabalho.descricao_problema,
        diagnostico: newTrabalho.diagnostico,
        materiais_necessarios: newTrabalho.materiais_necessarios,
        orcamento_pecas: newTrabalho.orcamento_pecas ? parseFloat(newTrabalho.orcamento_pecas) : null,
        orcamento_mao_obra: newTrabalho.orcamento_mao_obra ? parseFloat(newTrabalho.orcamento_mao_obra) : null,
        horas_estimadas: newTrabalho.horas_estimadas ? parseFloat(newTrabalho.horas_estimadas) : null,
        preco_hora: parseFloat(newTrabalho.preco_hora),
        notas: newTrabalho.notas,
        status: 'a_resolver'
      })

      setIsAddDialogOpen(false)
      setNewTrabalho({
        car_id: '',
        cliente_nome: '',
        cliente_telefone: '',
        data_prevista_conclusao: '',
        tipo_problema: 'avaria',
        descricao_problema: '',
        diagnostico: '',
        materiais_necessarios: '',
        orcamento_pecas: '',
        orcamento_mao_obra: '',
        horas_estimadas: '',
        preco_hora: '25.00',
        notas: ''
      })
      loadData()
    } catch (error) {
      console.error('Erro ao adicionar trabalho:', error)
      alert('Erro ao adicionar trabalho')
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await supabase
        .from('trabalhos')
        .update({ status: newStatus })
        .eq('id', id)
      
      loadData()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const handleGerarFolhaObra = async (trabalho: Trabalho) => {
    const userId = localStorage.getItem('userId')
    if (!userId) return

    try {
      // Buscar dados do carro se existir
      let carData = null
      if (trabalho.car_id) {
        const { data } = await supabase
          .from('cars')
          .select('*')
          .eq('id', trabalho.car_id)
          .single()
        carData = data
      }

      // Calcular totais
      const totalPecas = trabalho.orcamento_pecas || 0
      const totalMaoObra = (trabalho.horas_estimadas || 0) * (trabalho.preco_hora || 25)
      const subtotal = totalPecas + totalMaoObra
      const valorIva = subtotal * 0.23
      const totalFinal = subtotal + valorIva

      // Criar folha de obra
      const numeroFolha = `FO-${Date.now()}`
      
      await supabase.from('folhas_obra').insert({
        owner_id: userId,
        trabalho_id: trabalho.id,
        numero_folha: numeroFolha,
        cliente_nome: trabalho.cliente_nome,
        cliente_telefone: trabalho.cliente_telefone,
        veiculo_marca: carData?.marca,
        veiculo_modelo: carData?.modelo,
        veiculo_matricula: carData?.matricula,
        veiculo_km: carData?.km,
        tipo_servico: trabalho.tipo_problema,
        descricao_servico: trabalho.descricao_problema,
        horas_trabalhadas: trabalho.horas_estimadas,
        preco_hora: trabalho.preco_hora,
        total_mao_obra: totalMaoObra,
        total_pecas: totalPecas,
        subtotal: subtotal,
        taxa_iva: 23.00,
        valor_iva: valorIva,
        total_final: totalFinal,
        status_pagamento: 'pendente',
        status_entrega: 'na_oficina'
      })

      alert(`Folha de Obra ${numeroFolha} gerada com sucesso!`)
      router.push('/folhas-obra')
    } catch (error) {
      console.error('Erro ao gerar folha de obra:', error)
      alert('Erro ao gerar folha de obra')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'a_resolver': return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'em_andamento': return <Clock className="w-5 h-5 text-yellow-500" />
      case 'resolvido': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'entregue': return <Package className="w-5 h-5 text-blue-500" />
      case 'pago': return <CheckCircle className="w-5 h-5 text-green-600" />
      default: return <Wrench className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'a_resolver': 'A Resolver',
      'em_andamento': 'Em Andamento',
      'resolvido': 'Resolvido',
      'entregue': 'Entregue',
      'pago': 'Pago'
    }
    return labels[status] || status
  }

  const filteredTrabalhos = filterStatus === 'todos' 
    ? trabalhos 
    : trabalhos.filter(t => t.status === filterStatus)

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
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Gestão de Trabalhos</h1>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#ff8c00] hover:bg-[#e67e00]">
                <Plus className="w-4 h-4 mr-2" />
                Novo Trabalho
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Trabalho</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cliente_nome">Nome do Cliente</Label>
                    <Input
                      id="cliente_nome"
                      value={newTrabalho.cliente_nome}
                      onChange={(e) => setNewTrabalho({ ...newTrabalho, cliente_nome: e.target.value })}
                      placeholder="João Silva"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cliente_telefone">Telefone</Label>
                    <Input
                      id="cliente_telefone"
                      value={newTrabalho.cliente_telefone}
                      onChange={(e) => setNewTrabalho({ ...newTrabalho, cliente_telefone: e.target.value })}
                      placeholder="+351 912 345 678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="car_id">Veículo</Label>
                    <select
                      id="car_id"
                      value={newTrabalho.car_id}
                      onChange={(e) => setNewTrabalho({ ...newTrabalho, car_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Selecione um veículo</option>
                      {cars.map(car => (
                        <option key={car.id} value={car.id}>
                          {car.marca} {car.modelo} - {car.matricula}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_prevista">Data Prevista</Label>
                    <Input
                      id="data_prevista"
                      type="date"
                      value={newTrabalho.data_prevista_conclusao}
                      onChange={(e) => setNewTrabalho({ ...newTrabalho, data_prevista_conclusao: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_problema">Tipo de Problema</Label>
                  <select
                    id="tipo_problema"
                    value={newTrabalho.tipo_problema}
                    onChange={(e) => setNewTrabalho({ ...newTrabalho, tipo_problema: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="avaria">Avaria</option>
                    <option value="garantia">Garantia</option>
                    <option value="revisao">Revisão</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao_problema">Descrição do Problema</Label>
                  <Textarea
                    id="descricao_problema"
                    value={newTrabalho.descricao_problema}
                    onChange={(e) => setNewTrabalho({ ...newTrabalho, descricao_problema: e.target.value })}
                    placeholder="Descreva o problema reportado pelo cliente..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diagnostico">Diagnóstico</Label>
                  <Textarea
                    id="diagnostico"
                    value={newTrabalho.diagnostico}
                    onChange={(e) => setNewTrabalho({ ...newTrabalho, diagnostico: e.target.value })}
                    placeholder="Diagnóstico técnico..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="materiais">Materiais Necessários</Label>
                  <Textarea
                    id="materiais"
                    value={newTrabalho.materiais_necessarios}
                    onChange={(e) => setNewTrabalho({ ...newTrabalho, materiais_necessarios: e.target.value })}
                    placeholder="Lista de peças e materiais necessários..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orcamento_pecas">Orçamento Peças (€)</Label>
                    <Input
                      id="orcamento_pecas"
                      type="number"
                      step="0.01"
                      value={newTrabalho.orcamento_pecas}
                      onChange={(e) => setNewTrabalho({ ...newTrabalho, orcamento_pecas: e.target.value })}
                      placeholder="150.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orcamento_mao_obra">Orçamento Mão de Obra (€)</Label>
                    <Input
                      id="orcamento_mao_obra"
                      type="number"
                      step="0.01"
                      value={newTrabalho.orcamento_mao_obra}
                      onChange={(e) => setNewTrabalho({ ...newTrabalho, orcamento_mao_obra: e.target.value })}
                      placeholder="100.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="horas_estimadas">Horas Estimadas</Label>
                    <Input
                      id="horas_estimadas"
                      type="number"
                      step="0.5"
                      value={newTrabalho.horas_estimadas}
                      onChange={(e) => setNewTrabalho({ ...newTrabalho, horas_estimadas: e.target.value })}
                      placeholder="4.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preco_hora">Preço por Hora (€)</Label>
                    <Input
                      id="preco_hora"
                      type="number"
                      step="0.01"
                      value={newTrabalho.preco_hora}
                      onChange={(e) => setNewTrabalho({ ...newTrabalho, preco_hora: e.target.value })}
                      placeholder="25.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notas">Notas Adicionais</Label>
                  <Textarea
                    id="notas"
                    value={newTrabalho.notas}
                    onChange={(e) => setNewTrabalho({ ...newTrabalho, notas: e.target.value })}
                    placeholder="Observações importantes..."
                    rows={2}
                  />
                </div>

                <Button 
                  className="w-full bg-[#ff8c00] hover:bg-[#e67e00]"
                  onClick={handleAddTrabalho}
                >
                  Criar Trabalho
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="mb-6 flex space-x-2">
          <Button
            variant={filterStatus === 'todos' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('todos')}
            className={filterStatus === 'todos' ? 'bg-[#ff8c00] hover:bg-[#e67e00]' : ''}
          >
            Todos
          </Button>
          <Button
            variant={filterStatus === 'a_resolver' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('a_resolver')}
            className={filterStatus === 'a_resolver' ? 'bg-[#ff8c00] hover:bg-[#e67e00]' : ''}
          >
            A Resolver
          </Button>
          <Button
            variant={filterStatus === 'em_andamento' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('em_andamento')}
            className={filterStatus === 'em_andamento' ? 'bg-[#ff8c00] hover:bg-[#e67e00]' : ''}
          >
            Em Andamento
          </Button>
          <Button
            variant={filterStatus === 'resolvido' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('resolvido')}
            className={filterStatus === 'resolvido' ? 'bg-[#ff8c00] hover:bg-[#e67e00]' : ''}
          >
            Resolvido
          </Button>
          <Button
            variant={filterStatus === 'entregue' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('entregue')}
            className={filterStatus === 'entregue' ? 'bg-[#ff8c00] hover:bg-[#e67e00]' : ''}
          >
            Entregue
          </Button>
          <Button
            variant={filterStatus === 'pago' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('pago')}
            className={filterStatus === 'pago' ? 'bg-[#ff8c00] hover:bg-[#e67e00]' : ''}
          >
            Pago
          </Button>
        </div>

        {/* Lista de Trabalhos */}
        {filteredTrabalhos.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Nenhum trabalho encontrado</p>
              <Button 
                className="bg-[#ff8c00] hover:bg-[#e67e00]"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Trabalho
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredTrabalhos.map((trabalho) => (
              <Card key={trabalho.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(trabalho.status)}
                        <span className="font-medium">{getStatusLabel(trabalho.status)}</span>
                      </div>
                      <CardTitle className="text-lg">
                        {trabalho.cliente_nome || 'Cliente não informado'}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {trabalho.tipo_problema && (
                          <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs mr-2">
                            {trabalho.tipo_problema.toUpperCase()}
                          </span>
                        )}
                        {new Date(trabalho.data_entrada).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trabalho.descricao_problema && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Problema:</p>
                        <p className="text-sm text-gray-600">{trabalho.descricao_problema}</p>
                      </div>
                    )}
                    
                    {trabalho.diagnostico && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Diagnóstico:</p>
                        <p className="text-sm text-gray-600">{trabalho.diagnostico}</p>
                      </div>
                    )}

                    {trabalho.materiais_necessarios && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Materiais:</p>
                        <p className="text-sm text-gray-600">{trabalho.materiais_necessarios}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div>
                        <p className="text-xs text-gray-500">Orçamento Peças</p>
                        <p className="font-medium">{trabalho.orcamento_pecas ? `€${trabalho.orcamento_pecas.toFixed(2)}` : '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Mão de Obra</p>
                        <p className="font-medium">
                          {trabalho.horas_estimadas && trabalho.preco_hora 
                            ? `€${(trabalho.horas_estimadas * trabalho.preco_hora).toFixed(2)}`
                            : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-3">
                      <select
                        value={trabalho.status}
                        onChange={(e) => handleUpdateStatus(trabalho.id, e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="a_resolver">A Resolver</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="resolvido">Resolvido</option>
                        <option value="entregue">Entregue</option>
                        <option value="pago">Pago</option>
                      </select>
                      <Button
                        onClick={() => handleGerarFolhaObra(trabalho)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Gerar Folha de Obra
                      </Button>
                    </div>
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

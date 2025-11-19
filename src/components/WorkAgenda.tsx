'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { 
  ClipboardList, 
  Plus, 
  X, 
  CheckCircle2, 
  Clock, 
  Truck, 
  AlertCircle,
  Edit,
  Save,
  Calendar,
  Euro,
  Package,
  FileText,
  Wrench,
  ExternalLink,
  Shield
} from 'lucide-react'

interface PartDetail {
  description: string
  price: number
  notes: string
}

interface WorkDetails {
  id?: number
  work_agenda_id: number
  work_hours: number
  hourly_rate: number
  parts_details: PartDetail[]
}

interface ServiceHistoryData {
  service_type: string
  service_category: string
  problem_description: string
  warranty: boolean
}

interface WorkItem {
  id: number
  vehicleid?: number
  licenseplate: string
  vehicle_info?: string
  problem_description: string
  materials_needed?: string
  estimated_budget?: number
  status: 'por_ver' | 'a_resolver' | 'resolvido' | 'por_entregar' | 'entregues_pagos'
  priority: 'baixa' | 'normal' | 'alta' | 'urgente'
  notes?: string
  createdat: string
  updatedat: string
  completed_at?: string
  work_details?: WorkDetails
}

interface Vehicle {
  id: number
  licenseplate: string
  make: string
  model: string
  year: number
}

export default function WorkAgenda() {
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [editingWorkDetails, setEditingWorkDetails] = useState<number | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    vehicleid: '',
    licenseplate: '',
    vehicle_info: '',
    problem_description: '',
    materials_needed: '',
    estimated_budget: '',
    priority: 'normal' as 'baixa' | 'normal' | 'alta' | 'urgente',
    notes: ''
  })

  // Work details form state
  const [workDetailsForm, setWorkDetailsForm] = useState({
    work_hours: 0,
    hourly_rate: 45,
    parts: [] as PartDetail[]
  })

  // Service history form state
  const [serviceHistoryForm, setServiceHistoryForm] = useState<ServiceHistoryData>({
    service_type: 'avaria',
    service_category: '',
    problem_description: '',
    warranty: false
  })

  useEffect(() => {
    loadData()
    // Executar limpeza automática ao carregar
    cleanupOldCompletedItems()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Carregar veículos
      const { data: vehiclesData } = await supabase
        .from('vehicles_correct')
        .select('*')
        .order('licenseplate', { ascending: true })

      setVehicles(vehiclesData || [])

      // Carregar itens da agenda
      const { data: workData, error } = await supabase
        .from('work_agenda')
        .select('*')
        .order('createdat', { ascending: false })

      if (error) throw error

      // Carregar detalhes de trabalho para cada item
      const itemsWithDetails = await Promise.all(
        (workData || []).map(async (item) => {
          const { data: detailsData } = await supabase
            .from('work_details')
            .select('*')
            .eq('work_agenda_id', item.id)
            .single()

          return {
            ...item,
            work_details: detailsData || undefined
          }
        })
      )

      setWorkItems(itemsWithDetails)

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      alert('Erro ao carregar dados da agenda')
    } finally {
      setLoading(false)
    }
  }

  // Função para limpar itens entregues/pagos com mais de 7 dias
  const cleanupOldCompletedItems = async () => {
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // Buscar itens entregues/pagos com mais de 7 dias
      const { data: oldItems, error: fetchError } = await supabase
        .from('work_agenda')
        .select('*')
        .eq('status', 'entregues_pagos')
        .lt('completed_at', sevenDaysAgo.toISOString())

      if (fetchError) throw fetchError

      if (oldItems && oldItems.length > 0) {
        // Para cada item, adicionar ao histórico do veículo antes de deletar
        for (const item of oldItems) {
          if (item.vehicleid) {
            // Buscar veículo
            const { data: vehicle } = await supabase
              .from('vehicles_correct')
              .select('servicehistory')
              .eq('id', item.vehicleid)
              .single()

            if (vehicle) {
              // Adicionar entrada ao histórico
              const historyEntry = `[${new Date(item.completed_at).toLocaleDateString('pt-PT')}] Entregue/Pago - ${item.problem_description}`
              const currentHistory = vehicle.servicehistory || ''
              const updatedHistory = currentHistory 
                ? `${currentHistory}\n${historyEntry}` 
                : historyEntry

              // Atualizar histórico do veículo
              await supabase
                .from('vehicles_correct')
                .update({ servicehistory: updatedHistory })
                .eq('id', item.vehicleid)
            }
          }

          // Deletar detalhes de trabalho associados
          await supabase
            .from('work_details')
            .delete()
            .eq('work_agenda_id', item.id)
        }

        // Deletar itens antigos da agenda
        const { error: deleteError } = await supabase
          .from('work_agenda')
          .delete()
          .eq('status', 'entregues_pagos')
          .lt('completed_at', sevenDaysAgo.toISOString())

        if (deleteError) throw deleteError

        console.log(`${oldItems.length} itens antigos removidos da agenda e adicionados ao histórico`)
      }
    } catch (error: any) {
      console.error('Erro ao limpar itens antigos:', error)
    }
  }

  const handleVehicleSelect = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === parseInt(vehicleId))
    if (vehicle) {
      setFormData({
        ...formData,
        vehicleid: vehicleId,
        licenseplate: vehicle.licenseplate,
        vehicle_info: `${vehicle.make} ${vehicle.model} (${vehicle.year})`
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.licenseplate || !formData.problem_description) {
      alert('Preencha a matrícula e descrição do problema')
      return
    }

    try {
      const dataToSave = {
        vehicleid: formData.vehicleid ? parseInt(formData.vehicleid) : null,
        licenseplate: formData.licenseplate,
        vehicle_info: formData.vehicle_info || null,
        problem_description: formData.problem_description,
        materials_needed: formData.materials_needed || null,
        estimated_budget: formData.estimated_budget ? parseFloat(formData.estimated_budget) : null,
        priority: formData.priority,
        notes: formData.notes || null,
        status: 'por_ver'
      }

      if (editingId) {
        const { error } = await supabase
          .from('work_agenda')
          .update(dataToSave)
          .eq('id', editingId)

        if (error) throw error
        alert('Item atualizado com sucesso!')
      } else {
        const { error } = await supabase
          .from('work_agenda')
          .insert([dataToSave])

        if (error) throw error
        alert('Item adicionado à agenda!')
      }

      resetForm()
      loadData()
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar item na agenda')
    }
  }

  const updateStatus = async (id: number, newStatus: WorkItem['status']) => {
    try {
      const updateData: any = { status: newStatus }
      
      if (newStatus === 'entregues_pagos') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('work_agenda')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
      loadData()
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status')
    }
  }

  const handleEdit = (item: WorkItem) => {
    setFormData({
      vehicleid: item.vehicleid?.toString() || '',
      licenseplate: item.licenseplate,
      vehicle_info: item.vehicle_info || '',
      problem_description: item.problem_description,
      materials_needed: item.materials_needed || '',
      estimated_budget: item.estimated_budget?.toString() || '',
      priority: item.priority,
      notes: item.notes || ''
    })
    setEditingId(item.id)
    setShowAddForm(true)
  }

  const resetForm = () => {
    setFormData({
      vehicleid: '',
      licenseplate: '',
      vehicle_info: '',
      problem_description: '',
      materials_needed: '',
      estimated_budget: '',
      priority: 'normal',
      notes: ''
    })
    setEditingId(null)
    setShowAddForm(false)
  }

  // Funções para gerenciar detalhes de trabalho
  const openWorkDetailsEditor = (item: WorkItem) => {
    setWorkDetailsForm({
      work_hours: item.work_details?.work_hours || 0,
      hourly_rate: item.work_details?.hourly_rate || 45,
      parts: item.work_details?.parts_details || []
    })
    setServiceHistoryForm({
      service_type: 'avaria',
      service_category: '',
      problem_description: item.problem_description,
      warranty: false
    })
    setEditingWorkDetails(item.id)
  }

  const addPartDetail = () => {
    setWorkDetailsForm({
      ...workDetailsForm,
      parts: [...workDetailsForm.parts, { description: '', price: 0, notes: '' }]
    })
  }

  const updatePartDetail = (index: number, field: keyof PartDetail, value: string | number) => {
    const newParts = [...workDetailsForm.parts]
    newParts[index] = { ...newParts[index], [field]: value }
    setWorkDetailsForm({ ...workDetailsForm, parts: newParts })
  }

  const removePartDetail = (index: number) => {
    setWorkDetailsForm({
      ...workDetailsForm,
      parts: workDetailsForm.parts.filter((_, i) => i !== index)
    })
  }

  const saveWorkDetails = async () => {
    if (!editingWorkDetails) return

    try {
      // Verificar se já existe um registro de detalhes
      const { data: existingDetails } = await supabase
        .from('work_details')
        .select('id')
        .eq('work_agenda_id', editingWorkDetails)
        .single()

      const detailsData = {
        work_agenda_id: editingWorkDetails,
        work_hours: workDetailsForm.work_hours,
        hourly_rate: workDetailsForm.hourly_rate,
        parts_details: workDetailsForm.parts,
        updated_at: new Date().toISOString()
      }

      if (existingDetails) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('work_details')
          .update(detailsData)
          .eq('id', existingDetails.id)

        if (error) throw error
      } else {
        // Criar novo registro
        const { error } = await supabase
          .from('work_details')
          .insert([detailsData])

        if (error) throw error
      }

      // Salvar no histórico de serviços
      const workItem = workItems.find(item => item.id === editingWorkDetails)
      if (workItem) {
        const totalCost = workDetailsForm.work_hours * workDetailsForm.hourly_rate + 
                         workDetailsForm.parts.reduce((sum, p) => sum + p.price, 0)

        await supabase
          .from('service_history')
          .insert([{
            work_agenda_id: editingWorkDetails,
            vehicle_id: workItem.vehicleid || null,
            license_plate: workItem.licenseplate,
            service_type: serviceHistoryForm.service_type,
            service_category: serviceHistoryForm.service_category,
            problem_description: serviceHistoryForm.problem_description,
            warranty: serviceHistoryForm.warranty,
            work_hours: workDetailsForm.work_hours,
            hourly_rate: workDetailsForm.hourly_rate,
            parts_details: workDetailsForm.parts,
            total_cost: totalCost,
            service_date: new Date().toISOString()
          }])
      }
      
      alert('Detalhes de trabalho salvos com sucesso!')
      setEditingWorkDetails(null)
      loadData()
    } catch (error: any) {
      console.error('Erro ao salvar detalhes:', error)
      alert('Erro ao salvar detalhes de trabalho: ' + (error.message || 'Erro desconhecido'))
    }
  }

  const openBudgetWithData = (item: WorkItem) => {
    // Preparar dados para a Folha de Obra
    const budgetData = {
      licensePlate: item.licenseplate,
      vehicleInfo: item.vehicle_info || '',
      problemDescription: item.problem_description,
      workHours: item.work_details?.work_hours || 0,
      hourlyRate: item.work_details?.hourly_rate || 45,
      parts: item.work_details?.parts_details || [],
      serviceType: serviceHistoryForm.service_type,
      serviceCategory: serviceHistoryForm.service_category,
      warranty: serviceHistoryForm.warranty
    }

    // Salvar no localStorage para a Folha de Obra acessar
    localStorage.setItem('budgetPrefillData', JSON.stringify(budgetData))
    
    // Navegar para a aba de Folha de Obra
    window.dispatchEvent(new CustomEvent('navigateToBudget'))
    
    alert('Abrindo Folha de Obra com os dados preenchidos...')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'por_ver': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'a_resolver': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'resolvido': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'por_entregar': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'entregues_pagos': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'bg-red-500 text-white'
      case 'alta': return 'bg-orange-500 text-white'
      case 'normal': return 'bg-blue-500 text-white'
      case 'baixa': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'por_ver': return <AlertCircle className="w-4 h-4" />
      case 'a_resolver': return <Wrench className="w-4 h-4" />
      case 'resolvido': return <CheckCircle2 className="w-4 h-4" />
      case 'por_entregar': return <Clock className="w-4 h-4" />
      case 'entregues_pagos': return <Truck className="w-4 h-4" />
      default: return <ClipboardList className="w-4 h-4" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'por_ver': return 'Por Ver'
      case 'a_resolver': return 'A Resolver'
      case 'resolvido': return 'Resolvido'
      case 'por_entregar': return 'Por Entregar'
      case 'entregues_pagos': return 'Entregues/Pagos'
      default: return status
    }
  }

  const filteredItems = filterStatus === 'all' 
    ? workItems 
    : workItems.filter(item => item.status === filterStatus)

  const statusCounts = {
    por_ver: workItems.filter(i => i.status === 'por_ver').length,
    a_resolver: workItems.filter(i => i.status === 'a_resolver').length,
    resolvido: workItems.filter(i => i.status === 'resolvido').length,
    por_entregar: workItems.filter(i => i.status === 'por_entregar').length,
    entregues_pagos: workItems.filter(i => i.status === 'entregues_pagos').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="text-base sm:text-lg">Carregando agenda...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8 text-[#ff8c00]" />
            Agenda de Trabalho
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie veículos pendentes e serviços a realizar
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#ff8c00] hover:bg-[#e67e00] w-full sm:w-auto"
        >
          {showAddForm ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Veículo
            </>
          )}
        </Button>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        <Card className="border-yellow-300 border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Por Ver</p>
                <p className="text-2xl font-bold text-yellow-600">{statusCounts.por_ver}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-300 border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">A Resolver</p>
                <p className="text-2xl font-bold text-orange-600">{statusCounts.a_resolver}</p>
              </div>
              <Wrench className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-300 border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Resolvido</p>
                <p className="text-2xl font-bold text-blue-600">{statusCounts.resolvido}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-300 border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Por Entregar</p>
                <p className="text-2xl font-bold text-purple-600">{statusCounts.por_entregar}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-300 border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Entregues/Pagos</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.entregues_pagos}</p>
              </div>
              <Truck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulário de adicionar/editar */}
      {showAddForm && (
        <Card className="border-[#ff8c00] border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingId ? 'Editar Item' : 'Adicionar Novo Item'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Selecionar Veículo (Opcional)</Label>
                  <select
                    id="vehicle"
                    value={formData.vehicleid}
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">-- Selecione ou digite manualmente --</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.licenseplate} - {vehicle.make} {vehicle.model} ({vehicle.year})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseplate">Matrícula *</Label>
                  <Input
                    id="licenseplate"
                    value={formData.licenseplate}
                    onChange={(e) => setFormData({...formData, licenseplate: e.target.value})}
                    placeholder="Ex: 00-AA-00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_info">Informação do Veículo</Label>
                  <Input
                    id="vehicle_info"
                    value={formData.vehicle_info}
                    onChange={(e) => setFormData({...formData, vehicle_info: e.target.value})}
                    placeholder="Ex: Toyota Corolla 2020"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="problem">Descrição do Problema *</Label>
                <Textarea
                  id="problem"
                  value={formData.problem_description}
                  onChange={(e) => setFormData({...formData, problem_description: e.target.value})}
                  placeholder="Descreva o problema do veículo..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="materials">Materiais Necessários</Label>
                <Textarea
                  id="materials"
                  value={formData.materials_needed}
                  onChange={(e) => setFormData({...formData, materials_needed: e.target.value})}
                  placeholder="Liste os materiais que precisa comprar..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Orçamento Estimado (€)</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={formData.estimated_budget}
                    onChange={(e) => setFormData({...formData, estimated_budget: e.target.value})}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas Adicionais</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Observações..."
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-[#ff8c00] hover:bg-[#e67e00] flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {editingId ? 'Atualizar' : 'Adicionar'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Editor de detalhes de trabalho */}
      {editingWorkDetails && (
        <Card className="border-blue-500 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Detalhes de Trabalho - Resolvido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Informações de Serviço para Histórico */}
            <div className="bg-amber-50 p-4 rounded-lg space-y-3 border-2 border-amber-200">
              <h4 className="font-semibold text-amber-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informações para Histórico do Veículo
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service_type">Tipo de Serviço *</Label>
                  <select
                    id="service_type"
                    value={serviceHistoryForm.service_type}
                    onChange={(e) => setServiceHistoryForm({...serviceHistoryForm, service_type: e.target.value})}
                    className="w-full p-2 border rounded-md bg-white"
                  >
                    <option value="avaria">Avaria</option>
                    <option value="revisao">Revisão</option>
                    <option value="garantia">Garantia</option>
                    <option value="manutencao">Manutenção Preventiva</option>
                    <option value="inspecao">Inspeção</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_category">Categoria do Serviço</Label>
                  <Input
                    id="service_category"
                    value={serviceHistoryForm.service_category}
                    onChange={(e) => setServiceHistoryForm({...serviceHistoryForm, service_category: e.target.value})}
                    placeholder="Ex: Motor, Suspensão, Elétrica..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="problem_desc">Descrição Detalhada do Problema</Label>
                <Textarea
                  id="problem_desc"
                  value={serviceHistoryForm.problem_description}
                  onChange={(e) => setServiceHistoryForm({...serviceHistoryForm, problem_description: e.target.value})}
                  placeholder="Descreva o problema e a solução aplicada para o histórico..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="warranty"
                  checked={serviceHistoryForm.warranty}
                  onChange={(e) => setServiceHistoryForm({...serviceHistoryForm, warranty: e.target.checked})}
                  className="w-4 h-4"
                />
                <Label htmlFor="warranty" className="flex items-center gap-2 cursor-pointer">
                  <Shield className="w-4 h-4 text-green-600" />
                  Serviço em Garantia
                </Label>
              </div>
            </div>

            {/* Horas e Valor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="work_hours">Horas de Trabalho</Label>
                <Input
                  id="work_hours"
                  type="number"
                  step="0.5"
                  value={workDetailsForm.work_hours}
                  onChange={(e) => setWorkDetailsForm({...workDetailsForm, work_hours: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Valor por Hora (€)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="5"
                  value={workDetailsForm.hourly_rate}
                  onChange={(e) => setWorkDetailsForm({...workDetailsForm, hourly_rate: parseFloat(e.target.value) || 0})}
                  placeholder="45"
                />
              </div>
            </div>

            {/* Peças */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Peças Utilizadas</Label>
                <Button type="button" size="sm" onClick={addPartDetail}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Peça
                </Button>
              </div>

              {workDetailsForm.parts.map((part, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Descrição da Peça</Label>
                      <Input
                        value={part.description}
                        onChange={(e) => updatePartDetail(index, 'description', e.target.value)}
                        placeholder="Ex: Filtro de óleo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Preço (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={part.price}
                        onChange={(e) => updatePartDetail(index, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Input
                      value={part.notes}
                      onChange={(e) => updatePartDetail(index, 'notes', e.target.value)}
                      placeholder="Observações sobre a peça..."
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removePartDetail(index)}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remover Peça
                  </Button>
                </div>
              ))}
            </div>

            {/* Resumo */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Resumo:</h4>
              <div className="space-y-1 text-sm">
                <p>Mão de Obra: €{(workDetailsForm.work_hours * workDetailsForm.hourly_rate).toFixed(2)}</p>
                <p>Peças: €{workDetailsForm.parts.reduce((sum, p) => sum + p.price, 0).toFixed(2)}</p>
                <p className="font-bold text-base">Total: €{(workDetailsForm.work_hours * workDetailsForm.hourly_rate + workDetailsForm.parts.reduce((sum, p) => sum + p.price, 0)).toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveWorkDetails} className="bg-blue-600 hover:bg-blue-700 flex-1">
                <Save className="w-4 h-4 mr-2" />
                Salvar Detalhes
              </Button>
              <Button variant="outline" onClick={() => setEditingWorkDetails(null)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
              className={filterStatus === 'all' ? 'bg-[#ff8c00] hover:bg-[#e67e00]' : ''}
              size="sm"
            >
              Todos ({workItems.length})
            </Button>
            <Button
              variant={filterStatus === 'por_ver' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('por_ver')}
              className={filterStatus === 'por_ver' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
              size="sm"
            >
              Por Ver ({statusCounts.por_ver})
            </Button>
            <Button
              variant={filterStatus === 'a_resolver' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('a_resolver')}
              className={filterStatus === 'a_resolver' ? 'bg-orange-600 hover:bg-orange-700' : ''}
              size="sm"
            >
              A Resolver ({statusCounts.a_resolver})
            </Button>
            <Button
              variant={filterStatus === 'resolvido' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('resolvido')}
              className={filterStatus === 'resolvido' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              size="sm"
            >
              Resolvido ({statusCounts.resolvido})
            </Button>
            <Button
              variant={filterStatus === 'por_entregar' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('por_entregar')}
              className={filterStatus === 'por_entregar' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              size="sm"
            >
              Por Entregar ({statusCounts.por_entregar})
            </Button>
            <Button
              variant={filterStatus === 'entregues_pagos' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('entregues_pagos')}
              className={filterStatus === 'entregues_pagos' ? 'bg-green-600 hover:bg-green-700' : ''}
              size="sm"
            >
              Entregues/Pagos ({statusCounts.entregues_pagos})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de itens */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ClipboardList className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground">
                {filterStatus === 'all' 
                  ? 'Nenhum item na agenda ainda. Adicione o primeiro veículo!'
                  : 'Nenhum item com este status.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className="border-l-4 border-l-[#ff8c00]">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg sm:text-xl">
                        {item.licenseplate}
                      </CardTitle>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(item.priority)}`}>
                        {item.priority.toUpperCase()}
                      </span>
                    </div>
                    {item.vehicle_info && (
                      <p className="text-sm text-muted-foreground mt-1">{item.vehicle_info}</p>
                    )}
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="flex-1 sm:flex-none"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Problema */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#ff8c00]">
                    <FileText className="w-4 h-4" />
                    Problema:
                  </div>
                  <p className="text-sm pl-6">{item.problem_description}</p>
                </div>

                {/* Materiais */}
                {item.materials_needed && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                      <Package className="w-4 h-4" />
                      Materiais Necessários:
                    </div>
                    <p className="text-sm pl-6 whitespace-pre-line">{item.materials_needed}</p>
                  </div>
                )}

                {/* Orçamento */}
                {item.estimated_budget && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                      <Euro className="w-4 h-4" />
                      Orçamento Estimado:
                    </div>
                    <p className="text-sm pl-6 font-bold">€{item.estimated_budget.toFixed(2)}</p>
                  </div>
                )}

                {/* Detalhes de trabalho (apenas para status Resolvido) */}
                {item.status === 'resolvido' && (
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-blue-600">Detalhes do Trabalho Realizado</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openWorkDetailsEditor(item)}
                        className="border-blue-600 text-blue-600"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar Detalhes
                      </Button>
                    </div>

                    {item.work_details && (item.work_details.work_hours > 0 || item.work_details.parts_details?.length > 0) ? (
                      <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                        {item.work_details.work_hours > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Horas de Trabalho:</span>
                            <span className="font-semibold">{item.work_details.work_hours}h × €{item.work_details.hourly_rate}/h = €{(item.work_details.work_hours * item.work_details.hourly_rate).toFixed(2)}</span>
                          </div>
                        )}
                        {item.work_details.parts_details && item.work_details.parts_details.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">Peças Utilizadas:</p>
                            {item.work_details.parts_details.map((part, idx) => (
                              <div key={idx} className="text-sm pl-4 flex justify-between">
                                <span>{part.description}</span>
                                <span className="font-semibold">€{part.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="border-t pt-2 flex justify-between font-bold">
                          <span>Total:</span>
                          <span>€{(item.work_details.work_hours * item.work_details.hourly_rate + (item.work_details.parts_details?.reduce((sum, p) => sum + p.price, 0) || 0)).toFixed(2)}</span>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => openBudgetWithData(item)}
                          className="w-full bg-green-600 hover:bg-green-700 mt-2"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Abrir Folha de Obra com Estes Dados
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Nenhum detalhe de trabalho registrado ainda. Clique em "Editar Detalhes" para adicionar.
                      </p>
                    )}
                  </div>
                )}

                {/* Notas */}
                {item.notes && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                      <Calendar className="w-4 h-4" />
                      Notas:
                    </div>
                    <p className="text-sm pl-6">{item.notes}</p>
                  </div>
                )}

                {/* Status e ações */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full border-2 ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)}
                    <span className="text-sm font-semibold">
                      {getStatusLabel(item.status)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {item.status === 'por_ver' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(item.id, 'a_resolver')}
                        className="flex-1 sm:flex-none border-orange-600 text-orange-600 hover:bg-orange-50"
                      >
                        <Wrench className="w-4 h-4 mr-1" />
                        A Resolver
                      </Button>
                    )}
                    {item.status === 'a_resolver' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(item.id, 'resolvido')}
                        className="flex-1 sm:flex-none border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Resolvido
                      </Button>
                    )}
                    {item.status === 'resolvido' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(item.id, 'por_entregar')}
                        className="flex-1 sm:flex-none border-purple-600 text-purple-600 hover:bg-purple-50"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Por Entregar
                      </Button>
                    )}
                    {item.status === 'por_entregar' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(item.id, 'entregues_pagos')}
                        className="flex-1 sm:flex-none border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <Truck className="w-4 h-4 mr-1" />
                        Entregues/Pagos
                      </Button>
                    )}
                  </div>
                </div>

                {/* Data de criação */}
                <div className="text-xs text-muted-foreground">
                  Criado em: {new Date(item.createdat).toLocaleString('pt-PT')}
                  {item.completed_at && (
                    <> • Concluído em: {new Date(item.completed_at).toLocaleString('pt-PT')}</> 
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

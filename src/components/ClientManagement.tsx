'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Search, Plus, Car, Users, X, FileText, Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Vehicle {
  id: number
  licenseplate: string
  make: string
  model: string
  year: number
  mileage?: number
  lastservice?: string
  status?: string
  groupid?: string | null
  user_id?: string
  createdat?: string
}

interface Group {
  id: string
  name: string
  user_id?: string
  created_at?: string
}

interface ServiceHistory {
  id: number
  vehicleid: number
  description: string
  status?: string
  cost?: number
  createdat?: string
}

interface BudgetItem {
  description: string
  partsCost: number
  notes: string
}

interface Budget {
  id: number
  licenseplate: string
  items: {
    items: BudgetItem[]
    serviceInfo?: {
      type: string
      category: string
      description: string
      warranty: boolean
    }
  }
  totalparts: number
  createdat: string
}

export default function ClientManagement() {
  const { toast } = useToast()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [serviceHistory, setServiceHistory] = useState<ServiceHistory[]>([])
  const [budgetHistory, setBudgetHistory] = useState<Budget[]>([])
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [newVehicle, setNewVehicle] = useState({
    licenseplate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    mileage: 0,
    groupid: ''
  })

  const [newGroup, setNewGroup] = useState({
    name: ''
  })

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar autenticado",
          variant: "destructive"
        })
        return
      }

      console.log('✅ Usuário autenticado:', user.id)
      setUserId(user.id)
      
      await loadVehicles(user.id)
      await loadGroups(user.id)
    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error)
    }
  }

  const loadVehicles = async (authId: string) => {
    try {
      console.log('🔄 Carregando veículos do usuário:', authId)
      
      const { data, error } = await supabase
        .from('vehicles_correct')
        .select('id, licenseplate, make, model, year, mileage, status, groupid, user_id, createdat')
        .eq('user_id', authId)
        .order('createdat', { ascending: false })

      if (error) {
        console.error('❌ Erro do Supabase ao carregar veículos:', error)
        throw error
      }

      console.log('✅ Veículos carregados:', data?.length || 0)
      setVehicles(data || [])
    } catch (error: any) {
      console.error('❌ Erro ao carregar veículos:', error)
      toast({
        title: "Erro ao carregar veículos",
        description: error?.message || 'Verifique se a tabela vehicles_correct existe no Supabase',
        variant: "destructive"
      })
    }
  }

  const loadGroups = async (authId: string) => {
    try {
      console.log('🔄 Carregando grupos do usuário:', authId)
      
      const { data, error } = await supabase
        .from('vehicle_groups')
        .select('id, name, user_id, created_at')
        .eq('user_id', authId)
        .order('name')

      if (error) {
        console.error('❌ Erro ao carregar grupos:', error)
        throw error
      }

      console.log('✅ Grupos carregados:', data?.length || 0)
      setGroups(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar grupos:', error)
      toast({
        title: "Erro ao carregar grupos",
        description: error?.message || 'Verifique se a tabela vehicle_groups existe no Supabase',
        variant: "destructive"
      })
    }
  }

  const loadBudgetHistory = async (licensePlate: string) => {
    if (!userId) return

    try {
      console.log('📋 Carregando histórico de orçamentos para:', licensePlate)
      
      const { data, error } = await supabase
        .from('budgets')
        .select('id, licenseplate, items, totalparts, createdat')
        .eq('licenseplate', licensePlate.toUpperCase())
        .eq('user_id', userId)
        .order('createdat', { ascending: false })

      if (error) {
        console.error('❌ Erro ao carregar orçamentos:', error)
        throw error
      }

      console.log('✅ Orçamentos encontrados:', data?.length || 0)
      setBudgetHistory(data || [])
    } catch (error: any) {
      console.error('❌ Erro ao buscar histórico de orçamentos:', error)
      toast({
        title: "Erro ao carregar histórico",
        description: error?.message || 'Verifique se a tabela budgets existe no Supabase',
        variant: "destructive"
      })
      setBudgetHistory([])
    }
  }

  const handleAddVehicle = async () => {
    if (!userId) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar autenticado",
        variant: "destructive"
      })
      return
    }

    try {
      console.log('🚗 Tentando adicionar veículo:', {
        licenseplate: newVehicle.licenseplate,
        make: newVehicle.make,
        model: newVehicle.model,
        groupid: newVehicle.groupid,
        user_id: userId
      })

      // Validação básica
      if (!newVehicle.licenseplate.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Por favor, preencha a matrícula do veículo",
          variant: "destructive"
        })
        return
      }
      if (!newVehicle.make.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Por favor, preencha a marca do veículo",
          variant: "destructive"
        })
        return
      }
      if (!newVehicle.model.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Por favor, preencha o modelo do veículo",
          variant: "destructive"
        })
        return
      }

      const vehicleData = {
        licenseplate: newVehicle.licenseplate.toUpperCase(),
        make: newVehicle.make,
        model: newVehicle.model,
        year: newVehicle.year,
        mileage: newVehicle.mileage || 0,
        status: 'active',
        groupid: newVehicle.groupid || null,
        user_id: userId
      }

      console.log('📤 Enviando dados para Supabase:', vehicleData)

      const { data, error } = await supabase
        .from('vehicles_correct')
        .insert([vehicleData])
        .select('id, licenseplate, make, model, year, mileage, status, groupid, user_id, createdat')

      if (error) {
        console.error('❌ ERRO DETALHADO DO SUPABASE:', error)

        if (error.code === '23505') {
          toast({
            title: "Matrícula duplicada",
            description: "Esta matrícula já está cadastrada no sistema!",
            variant: "destructive"
          })
          return
        }

        if (error.code === '42P01') {
          toast({
            title: "Tabela não encontrada",
            description: "A tabela vehicles_correct não existe no Supabase. Crie a tabela primeiro.",
            variant: "destructive"
          })
          return
        }

        throw error
      }

      console.log('✅ Veículo adicionado com sucesso:', data)
      toast({
        title: "Sucesso!",
        description: "Veículo adicionado com sucesso",
        className: "bg-[#ff8c00] text-white"
      })
      
      setNewVehicle({
        licenseplate: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        mileage: 0,
        groupid: ''
      })
      setShowAddVehicle(false)
      loadVehicles(userId)
    } catch (error: any) {
      console.error('❌ ERRO CRÍTICO ao adicionar veículo:', error)
      toast({
        title: "Erro ao adicionar veículo",
        description: error?.message || 'Erro desconhecido ao adicionar veículo',
        variant: "destructive"
      })
    }
  }

  const handleAddGroup = async () => {
    if (!userId) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar autenticado",
        variant: "destructive"
      })
      return
    }

    try {
      console.log('📁 Tentando criar grupo:', newGroup)

      if (!newGroup.name.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Por favor, preencha o nome do grupo",
          variant: "destructive"
        })
        return
      }

      const { data, error } = await supabase
        .from('vehicle_groups')
        .insert([{ 
          name: newGroup.name.trim(),
          user_id: userId
        }])
        .select('id, name, user_id, created_at')

      if (error) {
        console.error('❌ Erro ao criar grupo:', error)
        
        if (error.code === '42P01') {
          toast({
            title: "Tabela não encontrada",
            description: "A tabela vehicle_groups não existe no Supabase. Crie a tabela primeiro.",
            variant: "destructive"
          })
          return
        }
        
        throw error
      }

      console.log('✅ Grupo criado com sucesso:', data)
      toast({
        title: "Sucesso!",
        description: "Grupo criado com sucesso",
        className: "bg-[#ff8c00] text-white"
      })
      
      setNewGroup({ name: '' })
      setShowAddGroup(false)
      loadGroups(userId)
    } catch (error: any) {
      console.error('❌ Erro ao criar grupo:', error)
      toast({
        title: "Erro ao criar grupo",
        description: error?.message || 'Erro desconhecido ao criar grupo',
        variant: "destructive"
      })
    }
  }

  const searchVehicleHistory = async (vehicleId: number) => {
    try {
      const { data: historyData, error: historyError } = await supabase
        .from('services')
        .select('id, vehicleid, description, status, cost, createdat')
        .eq('vehicleid', vehicleId)
        .order('createdat', { ascending: false })

      if (historyError) throw historyError

      setServiceHistory(historyData || [])
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
      setServiceHistory([])
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    const vehicle = vehicles.find(v => 
      v.licenseplate.toUpperCase() === searchQuery.toUpperCase()
    )

    if (vehicle) {
      setSelectedVehicle(vehicle)
      await searchVehicleHistory(vehicle.id)
      await loadBudgetHistory(vehicle.licenseplate)
    } else {
      toast({
        title: "Veículo não encontrado",
        description: "Nenhum veículo com esta matrícula foi encontrado",
        variant: "destructive"
      })
      setSelectedVehicle(null)
      setServiceHistory([])
      setBudgetHistory([])
    }
  }

  const handleVehicleClick = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    await searchVehicleHistory(vehicle.id)
    await loadBudgetHistory(vehicle.licenseplate)
  }

  const filteredVehicles = vehicles.filter(v =>
    v.licenseplate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.model.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Agrupar veículos por grupo
  const vehiclesByGroup = filteredVehicles.reduce((acc, vehicle) => {
    const groupId = vehicle.groupid || 'sem-grupo'
    if (!acc[groupId]) {
      acc[groupId] = []
    }
    acc[groupId].push(vehicle)
    return acc
  }, {} as Record<string, Vehicle[]>)

  const getGroupName = (groupId: string) => {
    if (groupId === 'sem-grupo') return 'Sem Grupo'
    const group = groups.find(g => g.id === groupId)
    return group?.name || 'Grupo Desconhecido'
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold">Gestão de Clientes</h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button onClick={() => setShowAddGroup(!showAddGroup)} variant="outline" className="flex-1 sm:flex-none text-sm">
            <Users className="w-4 h-4 mr-2" />
            Novo Grupo
          </Button>
          <Button onClick={() => setShowAddVehicle(!showAddVehicle)} className="bg-[#ff8c00] hover:bg-[#e67e00] flex-1 sm:flex-none text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Novo Veículo
          </Button>
        </div>
      </div>

      {showAddGroup && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Criar Novo Grupo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
            <div>
              <Label className="text-sm">Nome do Grupo</Label>
              <Input
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                placeholder="Ex: Stand AutoCarros, Cliente Empresa XYZ"
                className="text-sm"
              />
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Crie grupos para organizar veículos por stand, cliente ou empresa
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleAddGroup} className="bg-[#ff8c00] hover:bg-[#e67e00] text-sm">
                Criar Grupo
              </Button>
              <Button variant="outline" onClick={() => setShowAddGroup(false)} className="text-sm">Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showAddVehicle && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Adicionar Novo Veículo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-sm">Matrícula *</Label>
                <Input
                  value={newVehicle.licenseplate}
                  onChange={(e) => setNewVehicle({ ...newVehicle, licenseplate: e.target.value })}
                  placeholder="AA-00-BB"
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-sm">Marca *</Label>
                <Input
                  value={newVehicle.make}
                  onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                  placeholder="Ex: Toyota"
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-sm">Modelo *</Label>
                <Input
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  placeholder="Ex: Corolla"
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-sm">Ano</Label>
                <Input
                  type="number"
                  value={newVehicle.year}
                  onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) })}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-sm">Quilometragem</Label>
                <Input
                  type="number"
                  value={newVehicle.mileage}
                  onChange={(e) => setNewVehicle({ ...newVehicle, mileage: parseInt(e.target.value) })}
                  placeholder="0"
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-sm">Grupo (Opcional)</Label>
                <select
                  className="w-full p-2 border rounded text-sm"
                  value={newVehicle.groupid}
                  onChange={(e) => setNewVehicle({ ...newVehicle, groupid: e.target.value })}
                >
                  <option value="">Sem grupo</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleAddVehicle} className="bg-[#ff8c00] hover:bg-[#e67e00] text-sm">
                Adicionar Veículo
              </Button>
              <Button variant="outline" onClick={() => setShowAddVehicle(false)} className="text-sm">Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Pesquisar Veículo por Matrícula</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Digite a matrícula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="text-sm flex-1"
            />
            <Button onClick={handleSearch} className="bg-[#ff8c00] hover:bg-[#e67e00] text-sm w-full sm:w-auto">
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedVehicle && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-base sm:text-lg">Histórico do Veículo</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowBudgetModal(true)}
                className="bg-[#ff8c00] hover:bg-[#e67e00] text-white text-xs sm:text-sm w-full sm:w-auto"
              >
                <FileText className="w-4 h-4 mr-2" />
                Ver Orçamentos ({budgetHistory.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-base sm:text-lg mb-2">
                {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">Matrícula: {selectedVehicle.licenseplate}</p>
              <p className="text-xs sm:text-sm text-gray-600">Quilometragem: {selectedVehicle.mileage || 0} km</p>
              <p className="text-xs sm:text-sm text-gray-600">Status: {selectedVehicle.status || 'active'}</p>
              {selectedVehicle.groupid && (
                <p className="text-xs sm:text-sm text-gray-600">
                  Grupo: {getGroupName(selectedVehicle.groupid)}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm sm:text-base">Histórico de Serviços</h4>
              {serviceHistory.length === 0 ? (
                <p className="text-gray-500 text-xs sm:text-sm">Nenhum serviço registrado para este veículo.</p>
              ) : (
                serviceHistory.map(service => (
                  <div key={service.id} className="border p-3 sm:p-4 rounded-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm sm:text-base">
                          {service.createdat ? new Date(service.createdat).toLocaleDateString('pt-PT') : 'Data não disponível'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">Status: {service.status || 'pending'}</p>
                      </div>
                      <p className="font-bold text-base sm:text-lg">€{(service.cost || 0).toFixed(2)}</p>
                    </div>
                    <p className="text-gray-700 text-xs sm:text-sm">{service.description}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Flutuante de Orçamentos - Otimizado para Mobile */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h3 className="text-lg sm:text-2xl font-bold truncate pr-2">
                Histórico de Orçamentos - {selectedVehicle?.licenseplate}
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowBudgetModal(false)}
                className="flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-80px)] sm:max-h-[calc(80vh-120px)]">
              {budgetHistory.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-sm sm:text-lg">Nenhum orçamento encontrado para esta matrícula.</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {budgetHistory.map((budget, index) => (
                    <div key={budget.id} className="border rounded-lg p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0 mb-3">
                        <div className="flex-1">
                          <p className="font-bold text-base sm:text-lg">Orçamento #{budgetHistory.length - index}</p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {new Date(budget.createdat).toLocaleDateString('pt-PT', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-left sm:text-right w-full sm:w-auto">
                          <p className="text-xs sm:text-sm text-gray-600">Total em Peças</p>
                          <p className="font-bold text-lg sm:text-xl text-[#ff8c00]">€{budget.totalparts.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Informações do Serviço */}
                      {budget.items?.serviceInfo && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                          <h4 className="font-semibold text-xs sm:text-sm text-amber-800 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Informações do Serviço
                          </h4>
                          <div className="space-y-1 text-xs sm:text-sm">
                            <p className="text-gray-700">
                              <span className="font-medium">Tipo:</span> {budget.items.serviceInfo.type || 'Não especificado'}
                            </p>
                            {budget.items.serviceInfo.category && (
                              <p className="text-gray-700">
                                <span className="font-medium">Categoria:</span> {budget.items.serviceInfo.category}
                              </p>
                            )}
                            {budget.items.serviceInfo.description && (
                              <p className="text-gray-700">
                                <span className="font-medium">Descrição:</span> {budget.items.serviceInfo.description}
                              </p>
                            )}
                            {budget.items.serviceInfo.warranty && (
                              <p className="text-green-600 font-medium flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Em Garantia
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 mt-4">
                        <h4 className="font-semibold text-xs sm:text-sm text-gray-700 mb-2">Materiais/Peças:</h4>
                        {budget.items?.items && budget.items.items.length > 0 ? (
                          budget.items.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="bg-white p-2 sm:p-3 rounded border-l-4 border-[#ff8c00]">
                              <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-xs sm:text-sm">{item.description || 'Sem descrição'}</p>
                                  {item.notes && (
                                    <p className="text-xs text-gray-600 mt-1 break-words">
                                      <span className="font-medium">Observações:</span> {item.notes}
                                    </p>
                                  )}
                                </div>
                                <p className="font-semibold text-[#ff8c00] text-sm sm:text-base whitespace-nowrap">€{item.partsCost.toFixed(2)}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs sm:text-sm text-gray-500 italic">Nenhum item registrado</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Todos os Veículos ({filteredVehicles.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-4 sm:space-y-6">
            {filteredVehicles.length === 0 ? (
              <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">Nenhum veículo cadastrado ainda.</p>
            ) : (
              Object.entries(vehiclesByGroup).map(([groupId, groupVehicles]) => (
                <div key={groupId} className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff8c00]" />
                    <h3 className="font-bold text-base sm:text-lg text-[#ff8c00]">
                      {getGroupName(groupId)} ({groupVehicles.length})
                    </h3>
                  </div>
                  <div className="space-y-2 pl-2 sm:pl-4 border-l-2 border-[#ff8c00]">
                    {groupVehicles.map(vehicle => (
                      <div
                        key={vehicle.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors gap-3"
                        onClick={() => handleVehicleClick(vehicle)}
                      >
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <Car className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm sm:text-base truncate">{vehicle.licenseplate}</p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">
                              {vehicle.make} {vehicle.model} ({vehicle.year})
                            </p>
                            <p className="text-xs text-gray-500">{vehicle.mileage || 0} km</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="hover:bg-[#ff8c00] hover:text-white text-xs sm:text-sm w-full sm:w-auto">
                          Ver Histórico
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

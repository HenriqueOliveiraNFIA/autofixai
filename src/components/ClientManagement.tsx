'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Search, Plus, Car, Users, X, FileText } from 'lucide-react'
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
  createdat?: string
}

interface Group {
  id: string
  name: string
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
  items: BudgetItem[]
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
    loadVehicles()
    loadGroups()
  }, [])

  const loadVehicles = async () => {
    try {
      console.log('🔄 Carregando veículos...')
      const { data, error } = await supabase
        .from('vehicles_correct')
        .select('*')
        .order('createdat', { ascending: false })

      if (error) {
        console.error('❌ Erro do Supabase ao carregar veículos:', error)
        throw error
      }

      console.log('✅ Veículos carregados:', data?.length || 0)
      setVehicles(data || [])
    } catch (error: any) {
      console.error('❌ Erro ao carregar veículos:', error)
    }
  }

  const loadGroups = async () => {
    try {
      console.log('🔄 Carregando grupos...')
      const { data, error } = await supabase
        .from('vehicle_groups')
        .select('*')
        .order('name')

      if (error) {
        console.error('❌ Erro ao carregar grupos:', error)
        throw error
      }

      console.log('✅ Grupos carregados:', data?.length || 0)
      setGroups(data || [])
    } catch (error) {
      console.error('Erro ao carregar grupos:', error)
    }
  }

  const loadBudgetHistory = async (licensePlate: string) => {
    try {
      console.log('📋 Carregando histórico de orçamentos para:', licensePlate)
      
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('licenseplate', licensePlate.toUpperCase())
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
        description: error?.message || 'Erro desconhecido',
        variant: "destructive"
      })
      setBudgetHistory([])
    }
  }

  const handleAddVehicle = async () => {
    try {
      console.log('🚗 Tentando adicionar veículo:', {
        licenseplate: newVehicle.licenseplate,
        make: newVehicle.make,
        model: newVehicle.model,
        groupid: newVehicle.groupid
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
        groupid: newVehicle.groupid || null
      }

      console.log('📤 Enviando dados para Supabase:', vehicleData)

      const { data, error } = await supabase
        .from('vehicles_correct')
        .insert([vehicleData])
        .select()

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
      loadVehicles()
    } catch (error: any) {
      console.error('❌ ERRO CRÍTICO ao adicionar veículo:', error)
      toast({
        title: "Erro ao adicionar veículo",
        description: error?.message || 'Erro desconhecido',
        variant: "destructive"
      })
    }
  }

  const handleAddGroup = async () => {
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
        .insert([{ name: newGroup.name.trim() }])
        .select()

      if (error) {
        console.error('❌ Erro ao criar grupo:', error)
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
      loadGroups()
    } catch (error: any) {
      console.error('❌ Erro ao criar grupo:', error)
      toast({
        title: "Erro ao criar grupo",
        description: error?.message || 'Erro desconhecido',
        variant: "destructive"
      })
    }
  }

  const searchVehicleHistory = async (vehicleId: number) => {
    try {
      const { data: historyData, error: historyError } = await supabase
        .from('services')
        .select('*')
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Gestão de Clientes</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddGroup(!showAddGroup)} variant="outline">
            <Users className="w-4 h-4 mr-2" />
            Novo Grupo
          </Button>
          <Button onClick={() => setShowAddVehicle(!showAddVehicle)} className="bg-[#ff8c00] hover:bg-[#e67e00]">
            <Plus className="w-4 h-4 mr-2" />
            Novo Veículo
          </Button>
        </div>
      </div>

      {showAddGroup && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Grupo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome do Grupo</Label>
              <Input
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                placeholder="Ex: Stand AutoCarros, Cliente Empresa XYZ"
              />
              <p className="text-sm text-gray-500 mt-1">
                Crie grupos para organizar veículos por stand, cliente ou empresa
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddGroup} className="bg-[#ff8c00] hover:bg-[#e67e00]">
                Criar Grupo
              </Button>
              <Button variant="outline" onClick={() => setShowAddGroup(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showAddVehicle && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Novo Veículo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Matrícula *</Label>
                <Input
                  value={newVehicle.licenseplate}
                  onChange={(e) => setNewVehicle({ ...newVehicle, licenseplate: e.target.value })}
                  placeholder="AA-00-BB"
                />
              </div>
              <div>
                <Label>Marca *</Label>
                <Input
                  value={newVehicle.make}
                  onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                  placeholder="Ex: Toyota"
                />
              </div>
              <div>
                <Label>Modelo *</Label>
                <Input
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  placeholder="Ex: Corolla"
                />
              </div>
              <div>
                <Label>Ano</Label>
                <Input
                  type="number"
                  value={newVehicle.year}
                  onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Quilometragem</Label>
                <Input
                  type="number"
                  value={newVehicle.mileage}
                  onChange={(e) => setNewVehicle({ ...newVehicle, mileage: parseInt(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Grupo (Opcional)</Label>
                <select
                  className="w-full p-2 border rounded"
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
            <div className="flex gap-2">
              <Button onClick={handleAddVehicle} className="bg-[#ff8c00] hover:bg-[#e67e00]">
                Adicionar Veículo
              </Button>
              <Button variant="outline" onClick={() => setShowAddVehicle(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pesquisar Veículo por Matrícula</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Digite a matrícula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} className="bg-[#ff8c00] hover:bg-[#e67e00]">
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedVehicle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Histórico do Veículo
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowBudgetModal(true)}
                className="bg-[#ff8c00] hover:bg-[#e67e00] text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Ver Orçamentos ({budgetHistory.length})
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-lg mb-2">
                {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
              </h3>
              <p className="text-sm text-gray-600">Matrícula: {selectedVehicle.licenseplate}</p>
              <p className="text-sm text-gray-600">Quilometragem: {selectedVehicle.mileage || 0} km</p>
              <p className="text-sm text-gray-600">Status: {selectedVehicle.status || 'active'}</p>
              {selectedVehicle.groupid && (
                <p className="text-sm text-gray-600">
                  Grupo: {getGroupName(selectedVehicle.groupid)}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Histórico de Serviços</h4>
              {serviceHistory.length === 0 ? (
                <p className="text-gray-500">Nenhum serviço registrado para este veículo.</p>
              ) : (
                serviceHistory.map(service => (
                  <div key={service.id} className="border p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">
                          {service.createdat ? new Date(service.createdat).toLocaleDateString('pt-PT') : 'Data não disponível'}
                        </p>
                        <p className="text-sm text-gray-600">Status: {service.status || 'pending'}</p>
                      </div>
                      <p className="font-bold text-lg">€{(service.cost || 0).toFixed(2)}</p>
                    </div>
                    <p className="text-gray-700">{service.description}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Flutuante de Orçamentos */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-2xl font-bold">
                Histórico de Orçamentos - {selectedVehicle?.licenseplate}
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowBudgetModal(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {budgetHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">Nenhum orçamento encontrado para esta matrícula.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {budgetHistory.map((budget, index) => (
                    <div key={budget.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-lg">Orçamento #{budgetHistory.length - index}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(budget.createdat).toLocaleDateString('pt-PT', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Oficina: Anónimo</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total em Peças</p>
                          <p className="font-bold text-xl text-[#ff8c00]">€{budget.totalparts.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">Materiais/Peças:</h4>
                        {budget.items && budget.items.length > 0 ? (
                          budget.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="bg-white p-3 rounded border-l-4 border-[#ff8c00]">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{item.description || 'Sem descrição'}</p>
                                  {item.notes && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      <span className="font-medium">Observações:</span> {item.notes}
                                    </p>
                                  )}
                                </div>
                                <p className="font-semibold text-[#ff8c00] ml-4">€{item.partsCost.toFixed(2)}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">Nenhum item registrado</p>
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
        <CardHeader>
          <CardTitle>Todos os Veículos ({filteredVehicles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {filteredVehicles.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum veículo cadastrado ainda.</p>
            ) : (
              Object.entries(vehiclesByGroup).map(([groupId, groupVehicles]) => (
                <div key={groupId} className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-[#ff8c00]" />
                    <h3 className="font-bold text-lg text-[#ff8c00]">
                      {getGroupName(groupId)} ({groupVehicles.length})
                    </h3>
                  </div>
                  <div className="space-y-2 pl-4 border-l-2 border-[#ff8c00]">
                    {groupVehicles.map(vehicle => (
                      <div
                        key={vehicle.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleVehicleClick(vehicle)}
                      >
                        <div className="flex items-center gap-4">
                          <Car className="w-8 h-8 text-gray-400" />
                          <div>
                            <p className="font-semibold">{vehicle.licenseplate}</p>
                            <p className="text-sm text-gray-600">
                              {vehicle.make} {vehicle.model} ({vehicle.year})
                            </p>
                            <p className="text-sm text-gray-500">{vehicle.mileage || 0} km</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="hover:bg-[#ff8c00] hover:text-white">
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

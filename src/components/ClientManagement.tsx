'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Plus, Car, Users } from 'lucide-react'

interface Vehicle {
  id: string
  license_plate: string
  brand: string
  model: string
  year: number
  owner_name: string
  owner_phone: string
  group_id?: string
}

interface Group {
  id: string
  name: string
  description?: string
}

interface ServiceHistory {
  id: string
  vehicle_id: string
  service_date: string
  description: string
  total_cost: number
  workshop_name?: string
}

export default function ClientManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [serviceHistory, setServiceHistory] = useState<ServiceHistory[]>([])
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [showAddGroup, setShowAddGroup] = useState(false)

  const [newVehicle, setNewVehicle] = useState({
    license_plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    owner_name: '',
    owner_phone: '',
    group_id: ''
  })

  const [newGroup, setNewGroup] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    loadVehicles()
    loadGroups()
  }, [])

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setVehicles(data || [])
    } catch (error) {
      console.error('Erro ao carregar veículos:', error)
    }
  }

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_groups')
        .select('*')
        .order('name')

      if (error) throw error
      setGroups(data || [])
    } catch (error) {
      console.error('Erro ao carregar grupos:', error)
    }
  }

  const handleAddVehicle = async () => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .insert([{
          license_plate: newVehicle.license_plate.toUpperCase(),
          brand: newVehicle.brand,
          model: newVehicle.model,
          year: newVehicle.year,
          owner_name: newVehicle.owner_name,
          owner_phone: newVehicle.owner_phone,
          group_id: newVehicle.group_id || null
        }])

      if (error) throw error

      alert('Veículo adicionado com sucesso!')
      setNewVehicle({
        license_plate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        owner_name: '',
        owner_phone: '',
        group_id: ''
      })
      setShowAddVehicle(false)
      loadVehicles()
    } catch (error) {
      console.error('Erro ao adicionar veículo:', error)
      alert('Erro ao adicionar veículo. Verifique se a matrícula já existe.')
    }
  }

  const handleAddGroup = async () => {
    try {
      const { error } = await supabase
        .from('vehicle_groups')
        .insert([newGroup])

      if (error) throw error

      alert('Grupo criado com sucesso!')
      setNewGroup({ name: '', description: '' })
      setShowAddGroup(false)
      loadGroups()
    } catch (error) {
      console.error('Erro ao criar grupo:', error)
      alert('Erro ao criar grupo.')
    }
  }

  const searchVehicleHistory = async (licensePlate: string) => {
    try {
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('license_plate', licensePlate.toUpperCase())
        .single()

      if (vehicleError) throw vehicleError

      const { data: historyData, error: historyError } = await supabase
        .from('service_history')
        .select('*')
        .eq('vehicle_id', vehicleData.id)
        .order('service_date', { ascending: false })

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
      v.license_plate.toUpperCase() === searchQuery.toUpperCase()
    )

    if (vehicle) {
      setSelectedVehicle(vehicle)
      await searchVehicleHistory(vehicle.license_plate)
    } else {
      alert('Veículo não encontrado')
      setSelectedVehicle(null)
      setServiceHistory([])
    }
  }

  const filteredVehicles = vehicles.filter(v =>
    v.license_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.owner_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Gestão de Clientes</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddGroup(!showAddGroup)} variant="outline">
            <Users className="w-4 h-4 mr-2" />
            Novo Grupo
          </Button>
          <Button onClick={() => setShowAddVehicle(!showAddVehicle)}>
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
                placeholder="Ex: Stand AutoCarros"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddGroup}>Criar Grupo</Button>
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
                <Label>Matrícula</Label>
                <Input
                  value={newVehicle.license_plate}
                  onChange={(e) => setNewVehicle({ ...newVehicle, license_plate: e.target.value })}
                  placeholder="AA-00-BB"
                />
              </div>
              <div>
                <Label>Marca</Label>
                <Input
                  value={newVehicle.brand}
                  onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                  placeholder="Ex: Toyota"
                />
              </div>
              <div>
                <Label>Modelo</Label>
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
                <Label>Nome do Proprietário</Label>
                <Input
                  value={newVehicle.owner_name}
                  onChange={(e) => setNewVehicle({ ...newVehicle, owner_name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={newVehicle.owner_phone}
                  onChange={(e) => setNewVehicle({ ...newVehicle, owner_phone: e.target.value })}
                  placeholder="+351 900 000 000"
                />
              </div>
              <div className="col-span-2">
                <Label>Grupo (Opcional)</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={newVehicle.group_id}
                  onChange={(e) => setNewVehicle({ ...newVehicle, group_id: e.target.value })}
                >
                  <option value="">Sem grupo</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddVehicle}>Adicionar Veículo</Button>
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
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedVehicle && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico do Veículo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-lg mb-2">
                {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year})
              </h3>
              <p className="text-sm text-gray-600">Matrícula: {selectedVehicle.license_plate}</p>
              <p className="text-sm text-gray-600">Proprietário: {selectedVehicle.owner_name}</p>
              <p className="text-sm text-gray-600">Telefone: {selectedVehicle.owner_phone}</p>
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
                        <p className="font-semibold">{new Date(service.service_date).toLocaleDateString('pt-PT')}</p>
                        {service.workshop_name && (
                          <p className="text-sm text-gray-600">Oficina: {service.workshop_name}</p>
                        )}
                      </div>
                      <p className="font-bold text-lg">€{service.total_cost.toFixed(2)}</p>
                    </div>
                    <p className="text-gray-700">{service.description}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Todos os Veículos ({filteredVehicles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredVehicles.map(vehicle => (
              <div
                key={vehicle.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedVehicle(vehicle)
                  searchVehicleHistory(vehicle.license_plate)
                }}
              >
                <div className="flex items-center gap-4">
                  <Car className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="font-semibold">{vehicle.license_plate}</p>
                    <p className="text-sm text-gray-600">
                      {vehicle.brand} {vehicle.model} ({vehicle.year})
                    </p>
                    <p className="text-sm text-gray-500">{vehicle.owner_name}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Ver Histórico</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

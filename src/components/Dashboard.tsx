'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Car, Wrench, Users, TrendingUp } from 'lucide-react'

interface Vehicle {
  id: string
  license_plate: string
  brand: string
  model: string
  year: number
}

interface Service {
  id: string
  vehicle_id: string
  service_type: string
  total_amount: number
  created_at: string
}

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Carregar veículos
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      if (vehiclesError) throw vehiclesError
      setVehicles(vehiclesData || [])

      // Carregar serviços/histórico
      const { data: servicesData, error: servicesError } = await supabase
        .from('service_history')
        .select('*')
        .order('created_at', { ascending: false })

      if (servicesError) throw servicesError
      setServices(servicesData || [])

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setVehicles([])
      setServices([])
      alert('Erro ao carregar dados do dashboard. Verifique sua conexão com o banco de dados.')
    } finally {
      setLoading(false)
    }
  }

  // Calcular estatísticas
  const totalVehicles = vehicles.length
  const totalServices = services.length
  const totalRevenue = services.reduce((sum, service) => sum + (service.total_amount || 0), 0)
  const servicesThisMonth = services.filter(service => {
    const serviceDate = new Date(service.created_at)
    const now = new Date()
    return serviceDate.getMonth() === now.getMonth() && serviceDate.getFullYear() === now.getFullYear()
  }).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando dados...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Dashboard</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Veículos</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVehicles}</div>
            <p className="text-xs text-muted-foreground">Veículos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Realizados</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServices}</div>
            <p className="text-xs text-muted-foreground">Total de serviços</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Este Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servicesThisMonth}</div>
            <p className="text-xs text-muted-foreground">Serviços no mês atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Valor total faturado</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimos Veículos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {vehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum veículo cadastrado ainda.</p>
            ) : (
              <div className="space-y-2">
                {vehicles.slice(0, 5).map((vehicle) => (
                  <div key={vehicle.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{vehicle.license_plate}</p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.brand} {vehicle.model} ({vehicle.year})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum serviço registrado ainda.</p>
            ) : (
              <div className="space-y-2">
                {services.slice(0, 5).map((service) => (
                  <div key={service.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{service.service_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(service.created_at).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                    <p className="font-bold">€{service.total_amount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

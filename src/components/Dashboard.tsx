'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Car, Wrench, Users, TrendingUp, Building2, Calendar } from 'lucide-react'

interface Vehicle {
  id: number
  licenseplate: string
  make: string
  model: string
  year: number
  mileage?: number
  status?: string
  groupid?: string
  createdat?: string
}

interface Service {
  id: number
  vehicleid: number
  description: string
  cost?: number
  status?: string
  createdat?: string
}

interface GroupStats {
  groupid: string
  groupname: string
  totalVehicles: number
  totalServices: number
  monthlyServices: number
  totalRevenue: number
  monthlyRevenue: number
}

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [groupStats, setGroupStats] = useState<GroupStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      console.log('🔄 Iniciando carregamento de dados do dashboard...')

      // Carregar veículos da tabela correta
      console.log('📊 Buscando veículos...')
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles_correct')
        .select('*')
        .order('createdat', { ascending: false })

      if (vehiclesError) {
        console.error('❌ Erro ao carregar veículos:', vehiclesError)
        throw vehiclesError
      }
      
      console.log('✅ Veículos carregados:', vehiclesData?.length || 0)
      setVehicles(vehiclesData || [])

      // Carregar serviços
      console.log('📊 Buscando histórico de serviços...')
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('createdat', { ascending: false })

      if (servicesError) {
        console.error('❌ Erro ao carregar serviços:', servicesError)
        throw servicesError
      }
      
      console.log('✅ Serviços carregados:', servicesData?.length || 0)
      setServices(servicesData || [])

      // Carregar grupos
      const { data: groupsData } = await supabase
        .from('groups')
        .select('*')

      // Calcular estatísticas por grupo
      const statsMap = new Map<string, GroupStats>()
      const now = new Date()

      if (groupsData) {
        for (const group of groupsData) {
          const groupVehicles = vehiclesData?.filter(v => v.groupid === group.id) || []
          
          // Buscar serviços dos veículos deste grupo
          const vehicleIds = groupVehicles.map(v => v.id)
          const groupServices = servicesData?.filter(s => vehicleIds.includes(s.vehicleid)) || []
          
          // Serviços do mês atual
          const monthlyServices = groupServices.filter(service => {
            if (!service.createdat) return false
            const serviceDate = new Date(service.createdat)
            return serviceDate.getMonth() === now.getMonth() && serviceDate.getFullYear() === now.getFullYear()
          })

          // Receitas
          const totalRevenue = groupServices.reduce((sum, service) => sum + (service.cost || 0), 0)
          const monthlyRevenue = monthlyServices.reduce((sum, service) => sum + (service.cost || 0), 0)

          statsMap.set(group.id, {
            groupid: group.id,
            groupname: group.name,
            totalVehicles: groupVehicles.length,
            totalServices: groupServices.length,
            monthlyServices: monthlyServices.length,
            totalRevenue: totalRevenue,
            monthlyRevenue: monthlyRevenue
          })
        }
      }

      setGroupStats(Array.from(statsMap.values()))

      console.log('✅ Dashboard carregado com sucesso!')

    } catch (error: any) {
      console.error('❌ Erro ao carregar dados do dashboard:', error)
      console.error('📋 Detalhes do erro:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      })
      
      setVehicles([])
      setServices([])
      setGroupStats([])
      
      let errorMessage = 'Erro ao carregar dados do dashboard.'
      
      if (error?.code === 'PGRST116') {
        errorMessage = 'As tabelas necessárias não existem no banco de dados.'
      } else if (error?.message?.includes('JWT')) {
        errorMessage = 'Erro de autenticação. Faça login novamente.'
      } else if (error?.message) {
        errorMessage = `Erro: ${error.message}`
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Calcular estatísticas globais da plataforma
  const totalVehiclesPlatform = vehicles.length
  const totalServicesPlatform = services.length
  const totalRevenuePlatform = services.reduce((sum, service) => sum + (service.cost || 0), 0)
  
  const now = new Date()
  const servicesThisMonth = services.filter(service => {
    if (!service.createdat) return false
    const serviceDate = new Date(service.createdat)
    return serviceDate.getMonth() === now.getMonth() && serviceDate.getFullYear() === now.getFullYear()
  }).length

  const revenueThisMonth = services
    .filter(service => {
      if (!service.createdat) return false
      const serviceDate = new Date(service.createdat)
      return serviceDate.getMonth() === now.getMonth() && serviceDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, service) => sum + (service.cost || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando dados...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Dashboard - Visão Geral da Plataforma</h2>
      
      {/* Estatísticas Globais da Plataforma */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-[#ff8c00]">📊 Estatísticas Globais</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-[#ff8c00] border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Veículos (Plataforma)</CardTitle>
              <Car className="h-4 w-4 text-[#ff8c00]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#ff8c00]">{totalVehiclesPlatform}</div>
              <p className="text-xs text-muted-foreground">Todos os veículos cadastrados</p>
            </CardContent>
          </Card>

          <Card className="border-[#ff8c00] border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Serviços Totais (Plataforma)</CardTitle>
              <Wrench className="h-4 w-4 text-[#ff8c00]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#ff8c00]">{totalServicesPlatform}</div>
              <p className="text-xs text-muted-foreground">Todos os serviços realizados</p>
            </CardContent>
          </Card>

          <Card className="border-[#ff8c00] border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total (Plataforma)</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#ff8c00]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#ff8c00]">€{totalRevenuePlatform.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Faturamento total</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estatísticas Mensais da Plataforma */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-blue-600">📅 Estatísticas Mensais (Mês Atual)</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-blue-600 border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Serviços Este Mês</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{servicesThisMonth}</div>
              <p className="text-xs text-muted-foreground">Serviços realizados no mês atual</p>
            </CardContent>
          </Card>

          <Card className="border-blue-600 border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Este Mês</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">€{revenueThisMonth.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Faturamento do mês atual</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estatísticas por Oficina/Cliente */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-green-600">🏢 Estatísticas por Oficina/Cliente</h3>
        {groupStats.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Nenhum grupo/oficina cadastrado ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {groupStats.map((stat) => (
              <Card key={stat.groupid} className="border-green-600">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-green-600" />
                    {stat.groupname}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Veículos:</span>
                      <span className="font-bold">{stat.totalVehicles}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Serviços Totais:</span>
                      <span className="font-bold">{stat.totalServices}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Serviços Este Mês:</span>
                      <span className="font-bold text-blue-600">{stat.monthlyServices}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Receita Total:</span>
                      <span className="font-bold text-green-600">€{stat.totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Receita Este Mês:</span>
                      <span className="font-bold text-blue-600">€{stat.monthlyRevenue.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Últimos Veículos e Serviços */}
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
                      <p className="font-medium">{vehicle.licenseplate}</p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.make} {vehicle.model} ({vehicle.year})
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
                      <p className="font-medium">{service.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {service.createdat ? new Date(service.createdat).toLocaleDateString('pt-PT') : 'Data não disponível'}
                      </p>
                    </div>
                    <p className="font-bold">€{(service.cost || 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aviso sobre dados limpos */}
      <Card className="bg-green-50 border-green-400">
        <CardContent className="pt-6">
          <p className="text-sm text-green-800">
            ✅ <strong>Sistema Limpo:</strong> Todos os dados demo foram removidos. Novos usuários começam com estatísticas zeradas.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

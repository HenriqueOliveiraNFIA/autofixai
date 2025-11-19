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

interface Budget {
  id: number
  vehicleid: number
  clientname?: string
  servicetype?: string
  servicecategory?: string
  description?: string
  laborhours?: number
  laborrate?: number
  parts?: any[]
  subtotal?: number
  tax?: number
  discount?: number
  total?: number
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
  const [budgets, setBudgets] = useState<Budget[]>([])
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

      // Carregar orçamentos/serviços da tabela budgets
      console.log('📊 Buscando orçamentos/serviços...')
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .order('createdat', { ascending: false })

      if (budgetsError) {
        console.error('❌ Erro ao carregar orçamentos:', budgetsError)
        throw budgetsError
      }
      
      console.log('✅ Orçamentos carregados:', budgetsData?.length || 0)
      setBudgets(budgetsData || [])

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
          
          // Buscar orçamentos dos veículos deste grupo
          const vehicleIds = groupVehicles.map(v => v.id)
          const groupBudgets = budgetsData?.filter(b => vehicleIds.includes(b.vehicleid)) || []
          
          // Serviços do mês atual
          const monthlyBudgets = groupBudgets.filter(budget => {
            if (!budget.createdat) return false
            const budgetDate = new Date(budget.createdat)
            return budgetDate.getMonth() === now.getMonth() && budgetDate.getFullYear() === now.getFullYear()
          })

          // Receitas
          const totalRevenue = groupBudgets.reduce((sum, budget) => sum + (budget.total || 0), 0)
          const monthlyRevenue = monthlyBudgets.reduce((sum, budget) => sum + (budget.total || 0), 0)

          statsMap.set(group.id, {
            groupid: group.id,
            groupname: group.name,
            totalVehicles: groupVehicles.length,
            totalServices: groupBudgets.length,
            monthlyServices: monthlyBudgets.length,
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
      setBudgets([])
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
  const totalServicesPlatform = budgets.length
  const totalRevenuePlatform = budgets.reduce((sum, budget) => sum + (budget.total || 0), 0)
  
  const now = new Date()
  const servicesThisMonth = budgets.filter(budget => {
    if (!budget.createdat) return false
    const budgetDate = new Date(budget.createdat)
    return budgetDate.getMonth() === now.getMonth() && budgetDate.getFullYear() === now.getFullYear()
  }).length

  const revenueThisMonth = budgets
    .filter(budget => {
      if (!budget.createdat) return false
      const budgetDate = new Date(budget.createdat)
      return budgetDate.getMonth() === now.getMonth() && budgetDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, budget) => sum + (budget.total || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="text-base sm:text-lg">Carregando dados...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <h2 className="text-2xl sm:text-3xl font-bold">Dashboard - Visão Geral da Plataforma</h2>
      
      {/* Estatísticas Globais da Plataforma */}
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-semibold text-[#ff8c00]">📊 Estatísticas Globais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="border-[#ff8c00] border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total de Veículos (Plataforma)</CardTitle>
              <Car className="h-4 w-4 sm:h-5 sm:w-5 text-[#ff8c00]" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-[#ff8c00]">{totalVehiclesPlatform}</div>
              <p className="text-xs text-muted-foreground">Todos os veículos cadastrados</p>
            </CardContent>
          </Card>

          <Card className="border-[#ff8c00] border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Serviços Totais (Plataforma)</CardTitle>
              <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-[#ff8c00]" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-[#ff8c00]">{totalServicesPlatform}</div>
              <p className="text-xs text-muted-foreground">Todos os serviços realizados</p>
            </CardContent>
          </Card>

          <Card className="border-[#ff8c00] border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Receita Total (Plataforma)</CardTitle>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-[#ff8c00]" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-[#ff8c00]">€{totalRevenuePlatform.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Faturamento total</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estatísticas Mensais da Plataforma */}
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-semibold text-blue-600">📅 Estatísticas Mensais (Mês Atual)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Card className="border-blue-600 border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Serviços Este Mês</CardTitle>
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{servicesThisMonth}</div>
              <p className="text-xs text-muted-foreground">Serviços realizados no mês atual</p>
            </CardContent>
          </Card>

          <Card className="border-blue-600 border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Receita Este Mês</CardTitle>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">€{revenueThisMonth.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Faturamento do mês atual</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estatísticas por Oficina/Cliente */}
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-semibold text-green-600">🏢 Estatísticas por Oficina/Cliente</h3>
        {groupStats.length === 0 ? (
          <Card>
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <p className="text-sm text-muted-foreground">Nenhum grupo/oficina cadastrado ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {groupStats.map((stat) => (
              <Card key={stat.groupid} className="border-green-600">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    {stat.groupname}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-muted-foreground">Veículos:</span>
                      <span className="font-bold text-sm sm:text-base">{stat.totalVehicles}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-muted-foreground">Serviços Totais:</span>
                      <span className="font-bold text-sm sm:text-base">{stat.totalServices}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-muted-foreground">Serviços Este Mês:</span>
                      <span className="font-bold text-blue-600 text-sm sm:text-base">{stat.monthlyServices}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-muted-foreground">Receita Total:</span>
                      <span className="font-bold text-green-600 text-sm sm:text-base">€{stat.totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-muted-foreground">Receita Este Mês:</span>
                      <span className="font-bold text-blue-600 text-sm sm:text-base">€{stat.monthlyRevenue.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Últimos Veículos e Serviços */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Últimos Veículos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {vehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum veículo cadastrado ainda.</p>
            ) : (
              <div className="space-y-2">
                {vehicles.slice(0, 5).map((vehicle) => (
                  <div key={vehicle.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate">{vehicle.licenseplate}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
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
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Últimos Serviços</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {budgets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum serviço registrado ainda.</p>
            ) : (
              <div className="space-y-2">
                {budgets.slice(0, 5).map((budget) => (
                  <div key={budget.id} className="flex items-center justify-between border-b pb-2 last:border-b-0 gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate">
                        {budget.servicetype || 'Serviço'} - {budget.clientname || 'Cliente'}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {budget.createdat ? new Date(budget.createdat).toLocaleDateString('pt-PT') : 'Data não disponível'}
                      </p>
                    </div>
                    <p className="font-bold text-sm sm:text-base whitespace-nowrap">€{(budget.total || 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aviso sobre dados limpos */}
      <Card className="bg-green-50 border-green-400">
        <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-green-800">
            ✅ <strong>Sistema Limpo:</strong> Todos os dados demo foram removidos. Novos usuários começam com estatísticas zeradas.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

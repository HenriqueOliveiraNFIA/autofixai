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
  user_id?: string
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
  user_id?: string
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      console.log('🔄 Iniciando carregamento de dados do dashboard...')

      // 1. Obter usuário autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('❌ Erro ao obter usuário:', userError)
        alert('Você precisa estar logado para acessar o dashboard.')
        return
      }

      console.log('✅ Usuário autenticado:', user.id)
      setCurrentUserId(user.id)

      // 2. Carregar TODOS os veículos (filtrar no cliente)
      console.log('📊 Buscando veículos...')
      const { data: allVehiclesData, error: vehiclesError } = await supabase
        .from('vehicles_correct')
        .select('*')
        .order('createdat', { ascending: false })

      if (vehiclesError) {
        console.error('❌ Erro ao carregar veículos:', vehiclesError)
        throw vehiclesError
      }

      // Filtrar veículos do usuário atual no cliente
      const userVehicles = allVehiclesData?.filter(v => v.user_id === user.id) || []
      console.log('✅ Veículos do usuário carregados:', userVehicles.length)
      setVehicles(userVehicles)

      // 3. Carregar TODOS os orçamentos (filtrar no cliente)
      console.log('📊 Buscando orçamentos/serviços...')
      const { data: allBudgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .order('createdat', { ascending: false })

      if (budgetsError) {
        console.error('❌ Erro ao carregar orçamentos:', budgetsError)
        throw budgetsError
      }

      // Filtrar orçamentos do usuário atual no cliente
      const userBudgets = allBudgetsData?.filter(b => b.user_id === user.id) || []
      console.log('✅ Orçamentos do usuário carregados:', userBudgets.length)
      setBudgets(userBudgets)

      // 4. Carregar TODOS os grupos (filtrar no cliente)
      const { data: allGroupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')

      let userGroups = allGroupsData || []
      if (!groupsError && allGroupsData) {
        userGroups = allGroupsData.filter(g => g.user_id === user.id)
      }

      // 5. Calcular estatísticas por grupo
      const statsMap = new Map<string, GroupStats>()
      const now = new Date()

      if (userGroups.length > 0) {
        for (const group of userGroups) {
          const groupVehicles = userVehicles.filter(v => v.groupid === group.id)
          
          // Buscar orçamentos dos veículos deste grupo
          const vehicleIds = groupVehicles.map(v => v.id)
          const groupBudgets = userBudgets.filter(b => vehicleIds.includes(b.vehicleid))
          
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

  // Calcular estatísticas globais APENAS do usuário atual
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold">Dashboard - Minha Oficina</h2>
        {currentUserId && (
          <span className="text-xs sm:text-sm text-muted-foreground bg-green-100 px-3 py-1 rounded-full">
            🔒 Dados Privados
          </span>
        )}
      </div>
      
      {/* Estatísticas Globais da Oficina do Usuário */}
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-semibold text-[#ff8c00]">📊 Estatísticas da Minha Oficina</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="border-[#ff8c00] border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total de Veículos</CardTitle>
              <Car className="h-4 w-4 sm:h-5 sm:w-5 text-[#ff8c00]" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-[#ff8c00]">{totalVehiclesPlatform}</div>
              <p className="text-xs text-muted-foreground">Veículos cadastrados na sua oficina</p>
            </CardContent>
          </Card>

          <Card className="border-[#ff8c00] border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Serviços Totais</CardTitle>
              <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-[#ff8c00]" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-[#ff8c00]">{totalServicesPlatform}</div>
              <p className="text-xs text-muted-foreground">Serviços realizados na sua oficina</p>
            </CardContent>
          </Card>

          <Card className="border-[#ff8c00] border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Receita Total</CardTitle>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-[#ff8c00]" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-[#ff8c00]">€{totalRevenuePlatform.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Faturamento total da sua oficina</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estatísticas Mensais da Oficina */}
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

      {/* Estatísticas por Grupo/Cliente */}
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-semibold text-green-600">🏢 Estatísticas por Grupo/Cliente</h3>
        {groupStats.length === 0 ? (
          <Card>
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <p className="text-sm text-muted-foreground">Nenhum grupo/cliente cadastrado ainda.</p>
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

      {/* Aviso sobre segurança */}
      <Card className="bg-green-50 border-green-400">
        <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-green-800">
            🔒 <strong>Dados Protegidos:</strong> Você está visualizando apenas os dados da sua oficina. Outros usuários não podem ver suas informações.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

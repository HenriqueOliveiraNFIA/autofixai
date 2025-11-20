'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Car, Wrench, Users, TrendingUp, Building2, Calendar, User } from 'lucide-react'
import { toast } from 'sonner'

interface Vehicle {
  id: number
  licenseplate: string
  make: string
  model: string
  year: number
  mileage?: number
  status?: string
  groupid?: string
  user_id?: string
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
  user_id?: string
  createdat?: string
}

interface UserProfile {
  id: string
  auth_id: string
  nome: string
  email: string
  foto_perfil?: string
  nome_oficina: string
  descricao_oficina?: string
  morada: string
  codigo_postal?: string
  cidade: string
  telefone: string
  website?: string
  horario_funcionamento?: string
  data_criacao?: string
}

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      // Obter usuário autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        toast.error('❌ Você precisa estar autenticado')
        setLoading(false)
        return
      }

      console.log('✅ Usuário autenticado:', user.id)
      setUserId(user.id)

      // Carregar dados do usuário
      await loadDashboardData(user.id)
    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error)
      toast.error('Erro ao verificar autenticação')
      setLoading(false)
    }
  }

  const loadDashboardData = async (authId: string) => {
    try {
      setLoading(true)

      console.log('🔄 Carregando dados do dashboard para usuário:', authId)

      // Carregar perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, auth_id, nome, email, foto_perfil, nome_oficina, descricao_oficina, morada, codigo_postal, cidade, telefone, website, horario_funcionamento, data_criacao')
        .eq('auth_id', authId)
        .single()

      if (profileError) {
        if (profileError.code !== 'PGRST116') {
          console.error('❌ Erro ao carregar perfil:', profileError)
        }
      } else {
        console.log('✅ Perfil carregado:', profileData)
        setUserProfile(profileData)
      }

      // Carregar veículos do usuário
      console.log('📊 Buscando veículos do usuário...')
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles_correct')
        .select('id, licenseplate, make, model, year, mileage, status, groupid, user_id, createdat')
        .eq('user_id', authId)
        .order('createdat', { ascending: false })

      if (vehiclesError) {
        console.error('❌ Erro ao carregar veículos:', vehiclesError)
      } else {
        console.log('✅ Veículos carregados:', vehiclesData?.length || 0)
        setVehicles(vehiclesData || [])
      }

      // Carregar orçamentos/serviços do usuário
      console.log('📊 Buscando orçamentos/serviços do usuário...')
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('id, vehicleid, clientname, servicetype, servicecategory, description, laborhours, laborrate, parts, subtotal, tax, discount, total, status, user_id, createdat')
        .eq('user_id', authId)
        .order('createdat', { ascending: false })

      if (budgetsError) {
        console.error('❌ Erro ao carregar orçamentos:', budgetsError)
      } else {
        console.log('✅ Orçamentos carregados:', budgetsData?.length || 0)
        setBudgets(budgetsData || [])
      }

      console.log('✅ Dashboard carregado com sucesso!')

    } catch (error: any) {
      console.error('❌ Erro ao carregar dados do dashboard:', error)
      toast.error('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Calcular estatísticas do usuário
  const totalVehicles = vehicles.length
  const totalServices = budgets.length
  const totalRevenue = budgets.reduce((sum, budget) => sum + (budget.total || 0), 0)
  
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
      <h2 className="text-2xl sm:text-3xl font-bold">Dashboard - Minha Oficina</h2>
      
      {/* Informação do Usuário */}
      {userId && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4 p-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-blue-800">
                  {userProfile?.nome || 'Usuário'}
                </p>
                <p className="text-xs text-blue-600">
                  {userProfile?.nome_oficina || 'Configure seu perfil'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card de Perfil da Oficina */}
      {userProfile && (
        <Card className="border-[#ff8c00] border-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Building2 className="h-5 w-5 text-[#ff8c00]" />
              {userProfile.nome_oficina}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-2">
              {userProfile.descricao_oficina && (
                <p className="text-sm text-gray-600">{userProfile.descricao_oficina}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <p><strong>📍 Morada:</strong> {userProfile.morada}, {userProfile.cidade}</p>
                <p><strong>📞 Telefone:</strong> {userProfile.telefone}</p>
                {userProfile.email && <p><strong>📧 Email:</strong> {userProfile.email}</p>}
                {userProfile.website && <p><strong>🌐 Website:</strong> {userProfile.website}</p>}
                {userProfile.horario_funcionamento && (
                  <p className="sm:col-span-2"><strong>🕒 Horário:</strong> {userProfile.horario_funcionamento}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Estatísticas Totais */}
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-semibold text-[#ff8c00]">📊 Estatísticas Totais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="border-[#ff8c00] border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total de Veículos</CardTitle>
              <Car className="h-4 w-4 sm:h-5 sm:w-5 text-[#ff8c00]" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-[#ff8c00]">{totalVehicles}</div>
              <p className="text-xs text-muted-foreground">Veículos cadastrados</p>
            </CardContent>
          </Card>

          <Card className="border-[#ff8c00] border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Serviços Totais</CardTitle>
              <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-[#ff8c00]" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-[#ff8c00]">{totalServices}</div>
              <p className="text-xs text-muted-foreground">Serviços realizados</p>
            </CardContent>
          </Card>

          <Card className="border-[#ff8c00] border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Receita Total</CardTitle>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-[#ff8c00]" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-[#ff8c00]">€{totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Faturamento total</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estatísticas Mensais */}
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

      {/* Aviso sobre isolamento de dados */}
      <Card className="bg-green-50 border-green-400">
        <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-green-800">
            ✅ <strong>Dados Isolados:</strong> Você está vendo apenas os seus próprios dados. Cada usuário tem acesso exclusivo às suas informações.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

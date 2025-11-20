'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Building2, Mail, Phone, MapPin, Save, User, Globe, Clock, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface UserProfile {
  id?: string
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

export default function ProfileSettings() {
  const [profile, setProfile] = useState<UserProfile>({
    auth_id: '',
    nome: '',
    email: '',
    nome_oficina: '',
    morada: '',
    cidade: '',
    telefone: ''
  })
  const [loading, setLoading] = useState(false)
  const [hasProfile, setHasProfile] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    checkAuthAndLoadProfile()
  }, [])

  const checkAuthAndLoadProfile = async () => {
    try {
      // Obter usuário autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        toast.error('❌ Você precisa estar autenticado para acessar o perfil')
        return
      }

      console.log('✅ Usuário autenticado:', user.id)
      setUserId(user.id)

      // Buscar perfil do usuário usando auth_id
      await loadProfile(user.id)
    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error)
      toast.error('Erro ao verificar autenticação')
    }
  }

  const loadProfile = async (authId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, auth_id, nome, email, foto_perfil, nome_oficina, descricao_oficina, morada, codigo_postal, cidade, telefone, website, horario_funcionamento, data_criacao')
        .eq('auth_id', authId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('📝 Nenhum perfil encontrado - usuário pode criar um novo')
          setHasProfile(false)
          setProfile(prev => ({ ...prev, auth_id: authId }))
        } else {
          throw error
        }
      } else if (data) {
        console.log('✅ Perfil carregado:', data)
        setProfile(data)
        setHasProfile(true)
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar perfil:', error)
      
      // Se a tabela não existir, informar o usuário
      if (error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
        toast.error('⚠️ A tabela de perfis precisa ser criada no Supabase. Por favor, execute o SQL fornecido no dashboard do Supabase.')
      } else {
        toast.error('Erro ao carregar perfil')
      }
    }
  }

  const handleSaveProfile = async () => {
    if (!userId) {
      toast.error('❌ Você precisa estar autenticado')
      return
    }

    try {
      setLoading(true)

      // Validações
      if (!profile.nome?.trim()) {
        toast.error('❌ Por favor, preencha seu nome')
        return
      }
      if (!profile.email?.trim()) {
        toast.error('❌ Por favor, preencha o email')
        return
      }
      if (!profile.nome_oficina?.trim()) {
        toast.error('❌ Por favor, preencha o nome da oficina')
        return
      }
      if (!profile.telefone?.trim()) {
        toast.error('❌ Por favor, preencha o telefone')
        return
      }
      if (!profile.morada?.trim()) {
        toast.error('❌ Por favor, preencha a morada')
        return
      }
      if (!profile.cidade?.trim()) {
        toast.error('❌ Por favor, preencha a cidade')
        return
      }

      if (hasProfile && profile.id) {
        // Atualizar perfil existente
        const { error } = await supabase
          .from('profiles')
          .update({
            nome: profile.nome,
            email: profile.email,
            foto_perfil: profile.foto_perfil,
            nome_oficina: profile.nome_oficina,
            descricao_oficina: profile.descricao_oficina,
            morada: profile.morada,
            codigo_postal: profile.codigo_postal,
            cidade: profile.cidade,
            telefone: profile.telefone,
            website: profile.website,
            horario_funcionamento: profile.horario_funcionamento
          })
          .eq('auth_id', userId)

        if (error) throw error
        toast.success('✅ Perfil atualizado com sucesso!')
      } else {
        // Criar novo perfil
        const { data, error } = await supabase
          .from('profiles')
          .insert([{
            auth_id: userId,
            nome: profile.nome,
            email: profile.email,
            foto_perfil: profile.foto_perfil,
            nome_oficina: profile.nome_oficina,
            descricao_oficina: profile.descricao_oficina,
            morada: profile.morada,
            codigo_postal: profile.codigo_postal,
            cidade: profile.cidade,
            telefone: profile.telefone,
            website: profile.website,
            horario_funcionamento: profile.horario_funcionamento
          }])
          .select('id, auth_id, nome, email, foto_perfil, nome_oficina, descricao_oficina, morada, codigo_postal, cidade, telefone, website, horario_funcionamento, data_criacao')
          .single()

        if (error) throw error
        
        setProfile(data)
        setHasProfile(true)
        toast.success('✅ Perfil criado com sucesso!')
      }

      await loadProfile(userId)
    } catch (error: any) {
      console.error('❌ Erro ao salvar perfil:', error)
      
      if (error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
        toast.error('⚠️ A tabela de perfis não existe. Execute o SQL de criação no Supabase.')
      } else {
        toast.error(`❌ Erro ao salvar perfil: ${error?.message || 'Erro desconhecido'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold">Perfil da Oficina</h2>
      </div>

      {/* Informação sobre o usuário autenticado */}
      {userId && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4 p-4">
            <p className="text-sm text-blue-800">
              👤 <strong>ID do Usuário:</strong> {userId}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Informações Pessoais */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff8c00]" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="nome" className="flex items-center gap-2 text-xs sm:text-sm">
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                Nome Completo *
              </Label>
              <Input
                id="nome"
                value={profile.nome}
                onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
                placeholder="Ex: João Silva"
                className="border-gray-300 focus:border-[#ff8c00] focus:ring-[#ff8c00] text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-xs sm:text-sm">
                <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="contato@oficina.com"
                className="border-gray-300 focus:border-[#ff8c00] focus:ring-[#ff8c00] text-sm"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="foto_perfil" className="flex items-center gap-2 text-xs sm:text-sm">
                <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                URL da Foto de Perfil
              </Label>
              <Input
                id="foto_perfil"
                value={profile.foto_perfil || ''}
                onChange={(e) => setProfile({ ...profile, foto_perfil: e.target.value })}
                placeholder="https://exemplo.com/foto.jpg"
                className="border-gray-300 focus:border-[#ff8c00] focus:ring-[#ff8c00] text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações da Oficina */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff8c00]" />
            Informações da Oficina
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nome_oficina" className="flex items-center gap-2 text-xs sm:text-sm">
                <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
                Nome da Oficina *
              </Label>
              <Input
                id="nome_oficina"
                value={profile.nome_oficina}
                onChange={(e) => setProfile({ ...profile, nome_oficina: e.target.value })}
                placeholder="Ex: AutoFix Oficina"
                className="border-gray-300 focus:border-[#ff8c00] focus:ring-[#ff8c00] text-sm"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descricao_oficina" className="flex items-center gap-2 text-xs sm:text-sm">
                Descrição da Oficina
              </Label>
              <Textarea
                id="descricao_oficina"
                value={profile.descricao_oficina || ''}
                onChange={(e) => setProfile({ ...profile, descricao_oficina: e.target.value })}
                placeholder="Descreva sua oficina, serviços oferecidos, etc."
                className="border-gray-300 focus:border-[#ff8c00] focus:ring-[#ff8c00] text-sm min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone" className="flex items-center gap-2 text-xs sm:text-sm">
                <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                Telefone *
              </Label>
              <Input
                id="telefone"
                value={profile.telefone}
                onChange={(e) => setProfile({ ...profile, telefone: e.target.value })}
                placeholder="+351 912 345 678"
                className="border-gray-300 focus:border-[#ff8c00] focus:ring-[#ff8c00] text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2 text-xs sm:text-sm">
                <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                Website
              </Label>
              <Input
                id="website"
                value={profile.website || ''}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                placeholder="https://www.minhaoficina.com"
                className="border-gray-300 focus:border-[#ff8c00] focus:ring-[#ff8c00] text-sm"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="morada" className="flex items-center gap-2 text-xs sm:text-sm">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                Morada *
              </Label>
              <Input
                id="morada"
                value={profile.morada}
                onChange={(e) => setProfile({ ...profile, morada: e.target.value })}
                placeholder="Rua Principal, 123"
                className="border-gray-300 focus:border-[#ff8c00] focus:ring-[#ff8c00] text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo_postal" className="flex items-center gap-2 text-xs sm:text-sm">
                Código Postal
              </Label>
              <Input
                id="codigo_postal"
                value={profile.codigo_postal || ''}
                onChange={(e) => setProfile({ ...profile, codigo_postal: e.target.value })}
                placeholder="1000-001"
                className="border-gray-300 focus:border-[#ff8c00] focus:ring-[#ff8c00] text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade" className="flex items-center gap-2 text-xs sm:text-sm">
                Cidade *
              </Label>
              <Input
                id="cidade"
                value={profile.cidade}
                onChange={(e) => setProfile({ ...profile, cidade: e.target.value })}
                placeholder="Lisboa"
                className="border-gray-300 focus:border-[#ff8c00] focus:ring-[#ff8c00] text-sm"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="horario_funcionamento" className="flex items-center gap-2 text-xs sm:text-sm">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                Horário de Funcionamento
              </Label>
              <Input
                id="horario_funcionamento"
                value={profile.horario_funcionamento || ''}
                onChange={(e) => setProfile({ ...profile, horario_funcionamento: e.target.value })}
                placeholder="Seg-Sex: 9h-18h | Sáb: 9h-13h"
                className="border-gray-300 focus:border-[#ff8c00] focus:ring-[#ff8c00] text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pt-4 border-t">
            <Button 
              onClick={handleSaveProfile}
              disabled={loading}
              className="bg-[#ff8c00] hover:bg-[#e67e00] text-white text-sm w-full sm:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : hasProfile ? 'Atualizar Perfil' : 'Criar Perfil'}
            </Button>
            
            {hasProfile && profile.data_criacao && (
              <p className="text-xs sm:text-sm text-gray-500">
                Perfil criado em: {new Date(profile.data_criacao).toLocaleDateString('pt-PT')}
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mt-4">
            <p className="text-xs sm:text-sm text-blue-800">
              <strong>💡 Dica:</strong> Mantenha suas informações atualizadas para facilitar o contato com seus clientes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card de Instruções SQL */}
      <Card className="bg-yellow-50 border-yellow-400">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg text-yellow-800">
            ⚠️ Configuração Necessária no Supabase
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <p className="text-sm text-yellow-800 mb-4">
            Se você ainda não criou a tabela <code className="bg-yellow-200 px-1 rounded">profiles</code>, execute o SQL abaixo no SQL Editor do Supabase:
          </p>
          <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto">
{`CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id TEXT UNIQUE NOT NULL,
  nome TEXT,
  email TEXT,
  foto_perfil TEXT,
  nome_oficina TEXT,
  descricao_oficina TEXT,
  morada TEXT,
  codigo_postal TEXT,
  cidade TEXT,
  telefone TEXT,
  website TEXT,
  horario_funcionamento TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

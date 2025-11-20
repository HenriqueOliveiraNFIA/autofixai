'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, Upload } from 'lucide-react'

interface ProfileData {
  id?: string
  auth_id: string
  nome?: string
  email?: string
  foto_perfil?: string
  nome_oficina?: string
  descricao_oficina?: string
  morada?: string
  codigo_postal?: string
  cidade?: string
  telefone?: string
  website?: string
  horario_funcionamento?: string
}

export default function PerfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      router.push('/login')
      return
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', userId)
        .single()

      if (data) {
        setProfile(data)
      } else {
        // Criar perfil se não existir
        const newProfile: ProfileData = {
          auth_id: userId,
          email: localStorage.getItem('userEmail') || ''
        }
        setProfile(newProfile)
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    try {
      if (profile.id) {
        // Atualizar perfil existente
        await supabase
          .from('profiles')
          .update(profile)
          .eq('auth_id', profile.auth_id)
      } else {
        // Inserir novo perfil
        await supabase
          .from('profiles')
          .insert(profile)
      }

      alert('Perfil salvo com sucesso!')
      loadProfile()
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      alert('Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof ProfileData, value: string) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff8c00] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Perfil da Oficina</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Dados da Oficina</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Foto de Perfil */}
            <div className="space-y-2">
              <Label>Foto de Perfil</Label>
              <div className="flex items-center space-x-4">
                {profile?.foto_perfil ? (
                  <img src={profile.foto_perfil} alt="Perfil" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-2xl">
                      {profile?.nome_oficina?.charAt(0) || 'O'}
                    </span>
                  </div>
                )}
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Foto
                </Button>
              </div>
            </div>

            {/* Informações Pessoais */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Responsável</Label>
                <Input
                  id="nome"
                  value={profile?.nome || ''}
                  onChange={(e) => updateField('nome', e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Informações da Oficina */}
            <div className="space-y-2">
              <Label htmlFor="nome_oficina">Nome da Oficina</Label>
              <Input
                id="nome_oficina"
                value={profile?.nome_oficina || ''}
                onChange={(e) => updateField('nome_oficina', e.target.value)}
                placeholder="Nome da sua oficina"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao_oficina">Descrição da Oficina</Label>
              <Textarea
                id="descricao_oficina"
                value={profile?.descricao_oficina || ''}
                onChange={(e) => updateField('descricao_oficina', e.target.value)}
                placeholder="Descreva sua oficina..."
                rows={4}
              />
            </div>

            {/* Endereço */}
            <div className="space-y-2">
              <Label htmlFor="morada">Morada</Label>
              <Input
                id="morada"
                value={profile?.morada || ''}
                onChange={(e) => updateField('morada', e.target.value)}
                placeholder="Rua, número"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo_postal">Código Postal</Label>
                <Input
                  id="codigo_postal"
                  value={profile?.codigo_postal || ''}
                  onChange={(e) => updateField('codigo_postal', e.target.value)}
                  placeholder="0000-000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={profile?.cidade || ''}
                  onChange={(e) => updateField('cidade', e.target.value)}
                  placeholder="Sua cidade"
                />
              </div>
            </div>

            {/* Contactos */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={profile?.telefone || ''}
                  onChange={(e) => updateField('telefone', e.target.value)}
                  placeholder="+351 000 000 000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profile?.website || ''}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://suaoficina.pt"
                />
              </div>
            </div>

            {/* Horário */}
            <div className="space-y-2">
              <Label htmlFor="horario_funcionamento">Horário de Funcionamento</Label>
              <Textarea
                id="horario_funcionamento"
                value={profile?.horario_funcionamento || ''}
                onChange={(e) => updateField('horario_funcionamento', e.target.value)}
                placeholder="Ex: Segunda a Sexta: 9h-18h"
                rows={3}
              />
            </div>

            {/* Botão Salvar */}
            <Button 
              className="w-full bg-[#ff8c00] hover:bg-[#e67e00]"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Perfil'}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

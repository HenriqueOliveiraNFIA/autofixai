'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Building2, Mail, Phone, MapPin, Save, User } from 'lucide-react'

interface WorkshopProfile {
  id?: number
  name: string
  email: string
  phone: string
  address: string
  created_at?: string
}

export default function ProfileSettings() {
  const [profile, setProfile] = useState<WorkshopProfile>({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [loading, setLoading] = useState(false)
  const [hasProfile, setHasProfile] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Nenhum perfil encontrado ainda')
          setHasProfile(false)
        } else {
          throw error
        }
      } else if (data) {
        setProfile(data)
        setHasProfile(true)
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setLoading(true)

      // Validações
      if (!profile.name.trim()) {
        alert('❌ Por favor, preencha o nome da oficina')
        return
      }
      if (!profile.email.trim()) {
        alert('❌ Por favor, preencha o email')
        return
      }
      if (!profile.phone.trim()) {
        alert('❌ Por favor, preencha o telefone')
        return
      }
      if (!profile.address.trim()) {
        alert('❌ Por favor, preencha o endereço')
        return
      }

      if (hasProfile && profile.id) {
        // Atualizar perfil existente
        const { error } = await supabase
          .from('workshops')
          .update({
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            address: profile.address
          })
          .eq('id', profile.id)

        if (error) throw error
        alert('✅ Perfil atualizado com sucesso!')
      } else {
        // Criar novo perfil
        const { data, error } = await supabase
          .from('workshops')
          .insert([{
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            address: profile.address
          }])
          .select()
          .single()

        if (error) throw error
        
        setProfile(data)
        setHasProfile(true)
        alert('✅ Perfil criado com sucesso!')
      }

      loadProfile()
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error)
      alert(`❌ Erro ao salvar perfil: ${error?.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Perfil da Oficina</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#ff8c00]" />
            Informações da Oficina
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome da Oficina *
              </Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Ex: AutoFix Oficina"
                className="border-gray-300 focus:border-[#ff8c00] focus:ring-[#ff8c00]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="contato@oficina.com"
                className="border-gray-300 focus:border-[#ff8c00] focus:ring-[#ff8c00]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefone *
              </Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+351 912 345 678"
                className="border-gray-300 focus:border-[#ff8c00] focus:ring-[#ff8c00]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Endereço *
              </Label>
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="Rua Principal, 123, Lisboa"
                className="border-gray-300 focus:border-[#ff8c00] focus:ring-[#ff8c00]"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t">
            <Button 
              onClick={handleSaveProfile}
              disabled={loading}
              className="bg-[#ff8c00] hover:bg-[#e67e00] text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : hasProfile ? 'Atualizar Perfil' : 'Criar Perfil'}
            </Button>
            
            {hasProfile && profile.created_at && (
              <p className="text-sm text-gray-500">
                Perfil criado em: {new Date(profile.created_at).toLocaleDateString('pt-PT')}
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Dica:</strong> Mantenha suas informações atualizadas para facilitar o contato com seus clientes.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estatísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-[#ff8c00] to-[#e67e00] text-white p-6 rounded-lg shadow-lg">
              <p className="text-sm opacity-90">Total de Veículos</p>
              <p className="text-3xl font-bold mt-2">-</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
              <p className="text-sm opacity-90">Serviços Realizados</p>
              <p className="text-3xl font-bold mt-2">-</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
              <p className="text-sm opacity-90">Orçamentos Gerados</p>
              <p className="text-3xl font-bold mt-2">-</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">
            As estatísticas serão calculadas automaticamente conforme você usa o sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

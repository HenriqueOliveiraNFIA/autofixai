'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Simular login (substituir por autenticação real da Lasy.ai)
      if (email && password) {
        // Criar perfil automático se não existir
        const userId = 'user_' + Date.now()
        
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single()

        if (!existingProfile) {
          await supabase.from('profiles').insert({
            auth_id: userId,
            email: email,
            data_criacao: new Date().toISOString()
          })
        }

        // Salvar userId no localStorage
        localStorage.setItem('userId', existingProfile?.auth_id || userId)
        localStorage.setItem('userEmail', email)
        
        router.push('/dashboard')
      } else {
        setError('Por favor, preencha todos os campos')
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-[#ff8c00] rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">AF</span>
          </div>
          <CardTitle className="text-2xl">Entrar no AutoFix AI</CardTitle>
          <CardDescription>Acesse sua conta para gerenciar sua oficina</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-[#ff8c00] hover:bg-[#e67e00]"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <div className="text-center text-sm text-gray-600">
              Não tem conta?{' '}
              <button
                type="button"
                onClick={() => router.push('/register-workshop')}
                className="text-[#ff8c00] hover:underline"
              >
                Registrar oficina
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

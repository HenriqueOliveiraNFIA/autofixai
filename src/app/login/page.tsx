'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Diagnóstico detalhado das variáveis de ambiente
    console.log('🔍 DIAGNÓSTICO DE CONFIGURAÇÃO SUPABASE:');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ NÃO CONFIGURADA');
    console.log('ANON KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada (primeiros 20 chars): ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' : '❌ NÃO CONFIGURADA');
    
    // Verificar se o cliente Supabase foi criado corretamente
    if (supabase) {
      console.log('✅ Cliente Supabase criado');
      // @ts-ignore
      console.log('Supabase URL no cliente:', supabase.supabaseUrl || 'não disponível');
    } else {
      console.error('❌ Cliente Supabase NÃO foi criado!');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔐 Tentando fazer login...');
    console.log('Email:', email);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('📊 Resposta do Supabase:', { data, error: authError });

      if (authError) {
        console.error('❌ Erro de autenticação:', authError);
        throw authError;
      }

      console.log('✅ Login bem-sucedido!');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('❌ Erro capturado:', err);
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login da Oficina</CardTitle>
          <CardDescription>
            Acesse sua conta no AutoFix AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm font-medium">{error}</p>
                <p className="text-red-500 text-xs mt-1">
                  Verifique o console do navegador (F12) para mais detalhes
                </p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            Não tem conta? <a href="/register" className="text-blue-600 hover:underline">Cadastre-se</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

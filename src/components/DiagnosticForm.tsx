'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

interface DiagnosticResult {
  issue: string
  probability: number
  parts: string[]
  cost: number
  urgency: string
  actions: string[]
}

export default function DiagnosticForm() {
  const [symptoms, setSymptoms] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [loading, setLoading] = useState(false)

  const handleDiagnose = async () => {
    if (!symptoms.trim() || !licensePlate.trim()) return

    setLoading(true)

    try {
      // Buscar histórico do veículo para diagnóstico mais preciso
      const { data: history, error: historyError } = await supabase
        .from('repair_history')
        .select('*')
        .eq('licensePlate', licensePlate.toUpperCase())
        .order('date', { ascending: false })
        .limit(5)

      if (historyError) throw historyError

      // Lógica simples de diagnóstico baseada em sintomas (em produção seria AI real)
      const symptomKeywords = symptoms.toLowerCase()
      let diagnosticResults: DiagnosticResult[] = []

      if (symptomKeywords.includes('barulho') || symptomKeywords.includes('ruído')) {
        diagnosticResults.push({
          issue: 'Problema na suspensão dianteira',
          probability: 75,
          parts: ['Amortecedor dianteiro', 'Braço oscilante'],
          cost: 450,
          urgency: 'Alta',
          actions: ['Verificar alinhamento', 'Testar suspensão', 'Inspecionar freios']
        })
      }

      if (symptomKeywords.includes('freio') || symptomKeywords.includes('frei')) {
        diagnosticResults.push({
          issue: 'Falha no sistema de freios',
          probability: 80,
          parts: ['Pastilhas de freio', 'Disco de freio'],
          cost: 320,
          urgency: 'Crítica',
          actions: ['Verificar nível de fluido', 'Testar freio de mão', 'Inspecionar discos']
        })
      }

      if (symptomKeywords.includes('escapamento') || symptomKeywords.includes('fumo')) {
        diagnosticResults.push({
          issue: 'Problema no escapamento',
          probability: 65,
          parts: ['Catalisador', 'Tubo de escape'],
          cost: 280,
          urgency: 'Média',
          actions: ['Verificar emissões', 'Ouvir ruídos', 'Inspecionar soldas']
        })
      }

      if (symptomKeywords.includes('motor') || symptomKeywords.includes('não liga')) {
        diagnosticResults.push({
          issue: 'Problema no sistema elétrico',
          probability: 70,
          parts: ['Bateria', 'Alternador'],
          cost: 380,
          urgency: 'Alta',
          actions: ['Verificar bateria', 'Testar alternador', 'Inspecionar velas']
        })
      }

      if (diagnosticResults.length === 0) {
        diagnosticResults = [{
          issue: 'Diagnóstico inconclusivo',
          probability: 50,
          parts: ['Inspeção geral recomendada'],
          cost: 150,
          urgency: 'Baixa',
          actions: ['Realizar inspeção completa', 'Verificar fluidos', 'Testar sistemas elétricos']
        }]
      }

      // Salvar diagnóstico no banco
      const { error: saveError } = await supabase
        .from('diagnostics')
        .insert([{
          licensePlate: licensePlate.toUpperCase(),
          symptoms,
          results: diagnosticResults,
          createdAt: new Date().toISOString()
        }])

      if (saveError) {
        console.error('Erro ao salvar diagnóstico:', saveError)
        // Não falhar se não conseguir salvar, apenas logar
      }

      setResults(diagnosticResults)
    } catch (error) {
      console.error('Erro no diagnóstico:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Diagnóstico Inteligente</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">
                Matrícula do Veículo:
              </label>
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                placeholder="AA-12-BB"
                className="w-full p-2 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">
                Descreva os sintomas do veículo:
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Ex: Barulho estranho ao frear, luz no painel acesa, vibração no volante, motor não liga..."
                className="w-full p-3 border rounded-lg min-h-[100px] text-sm"
              />
            </div>
            <Button
              onClick={handleDiagnose}
              disabled={loading || !symptoms.trim() || !licensePlate.trim()}
              className="w-full text-sm"
            >
              {loading ? 'Analisando...' : 'Gerar Diagnóstico'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-lg sm:text-xl font-semibold px-4 sm:px-0">Possíveis Problemas Identificados:</h3>
          {results.map((result, index) => (
            <Card key={index}>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-base sm:text-lg">
                  <span className="flex-1">{result.issue}</span>
                  <span className={`px-2 py-1 rounded text-xs sm:text-sm whitespace-nowrap ${
                    result.probability > 80 ? 'bg-red-100 text-red-800' :
                    result.probability > 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {result.probability}% probabilidade
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">Peças Afetadas:</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                      {result.parts.map((part, i) => (
                        <li key={i}>{part}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">Informações:</h4>
                    <p className="text-xs sm:text-sm"><strong>Custo Estimado:</strong> €{result.cost}</p>
                    <p className="text-xs sm:text-sm"><strong>Urgência:</strong> {result.urgency}</p>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4">
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Ações Imediatas Recomendadas:</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                    {result.actions.map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

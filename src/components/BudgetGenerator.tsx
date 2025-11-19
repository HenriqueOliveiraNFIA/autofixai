'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

interface BudgetItem {
  description: string
  partsCost: number
  notes: string
}

interface Budget {
  items: BudgetItem[]
  totalLabor: number
  totalParts: number
  totalTime: number
  subtotal: number
  ivaPercentage: number
  ivaAmount: number
  totalCost: number
  currency: string
}

export default function BudgetGenerator() {
  const [items, setItems] = useState<BudgetItem[]>([
    {
      description: '',
      partsCost: 0,
      notes: ''
    }
  ])
  const [currency, setCurrency] = useState('EUR')
  const [clientName, setClientName] = useState('')
  const [vehicleInfo, setVehicleInfo] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [ivaPercentage, setIvaPercentage] = useState(23) // IVA padrão em Portugal
  const [totalHours, setTotalHours] = useState(0)
  const [hourlyRate, setHourlyRate] = useState(45)
  const [saving, setSaving] = useState(false)

  const addItem = () => {
    setItems([...items, {
      description: '',
      partsCost: 0,
      notes: ''
    }])
  }

  const updateItem = (index: number, field: keyof BudgetItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const calculateTotals = (): Budget => {
    const totalLabor = totalHours * hourlyRate
    const totalParts = items.reduce((sum, item) => sum + item.partsCost, 0)
    const totalTime = totalHours
    const subtotal = totalLabor + totalParts
    const ivaAmount = subtotal * (ivaPercentage / 100)
    const totalCost = subtotal + ivaAmount

    return {
      items,
      totalLabor,
      totalParts,
      totalTime,
      subtotal,
      ivaPercentage,
      ivaAmount,
      totalCost,
      currency
    }
  }

  const saveBudget = async () => {
    if (!licensePlate.trim()) {
      alert('Por favor, insira a matrícula do veículo')
      return
    }

    setSaving(true)
    try {
      const budget = calculateTotals()

      const { error } = await supabase
        .from('budgets')
        .insert([{
          licensePlate: licensePlate.toUpperCase(),
          clientName: clientName || null,
          vehicleInfo: vehicleInfo || null,
          totalLabor: budget.totalLabor,
          totalParts: budget.totalParts,
          totalHours: budget.totalTime,
          hourlyRate: hourlyRate,
          subtotal: budget.subtotal,
          ivaPercentage: budget.ivaPercentage,
          ivaAmount: budget.ivaAmount,
          totalCost: budget.totalCost,
          currency: budget.currency,
          items: budget.items
        }])

      if (error) throw error

      alert('Orçamento salvo com sucesso no histórico do veículo!')
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error)
      alert('Erro ao salvar orçamento. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const budget = calculateTotals()

  const exportBudget = (format: 'pdf' | 'csv' | 'txt') => {
    const content = generateExportContent(budget, format)

    if (format === 'txt') {
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `orcamento-${licensePlate || 'veiculo'}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      alert(`Exportação para ${format.toUpperCase()} será implementada em produção`)
    }
  }

  const generateExportContent = (budget: Budget, format: string): string => {
    const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'R$'

    if (format === 'txt') {
      return `
ORÇAMENTO AUTO FIX AI
Cliente: ${clientName || 'Não informado'}
Veículo: ${vehicleInfo || 'Não informado'}
Matrícula: ${licensePlate || 'Não informado'}
Data: ${new Date().toLocaleDateString('pt-PT')}

MÃO DE OBRA:
- Horas: ${budget.totalTime}h
- Valor/Hora: ${currencySymbol}${hourlyRate}
- Total Mão de Obra: ${currencySymbol}${budget.totalLabor.toFixed(2)}

MATERIAIS/PEÇAS:
${budget.items.map((item, index) => `
${index + 1}. ${item.description}
   - Custo: ${currencySymbol}${item.partsCost}
   - Observações: ${item.notes}
`).join('')}

TOTAIS:
- Mão de obra: ${currencySymbol}${budget.totalLabor.toFixed(2)}
- Peças/Materiais: ${currencySymbol}${budget.totalParts.toFixed(2)}
- Subtotal: ${currencySymbol}${budget.subtotal.toFixed(2)}
- IVA (${budget.ivaPercentage}%): ${currencySymbol}${budget.ivaAmount.toFixed(2)}
- TOTAL: ${currencySymbol}${budget.totalCost.toFixed(2)}
      `.trim()
    }

    return ''
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerador de Orçamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Nome do Cliente:</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Nome do cliente"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Matrícula do Veículo:</label>
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                className="w-full p-2 border rounded"
                placeholder="AA-12-BB"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Informações do Veículo:</label>
              <input
                type="text"
                value={vehicleInfo}
                onChange={(e) => setVehicleInfo(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Marca, modelo, matrícula"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">IVA (%):</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={ivaPercentage}
                onChange={(e) => setIvaPercentage(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border rounded"
                placeholder="23"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Moeda:</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="p-2 border rounded"
              >
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dólar ($)</option>
                <option value="BRL">Real (R$)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mão de Obra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Horas Totais:</label>
              <input
                type="number"
                step="0.5"
                value={totalHours}
                onChange={(e) => setTotalHours(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border rounded"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Valor/Hora:</label>
              <input
                type="number"
                step="5"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border rounded"
                placeholder="45"
              />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Total Mão de Obra: {(totalHours * hourlyRate).toFixed(2)} {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'R$'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Materiais/Peças
            <Button onClick={addItem}>Adicionar Item</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Descrição:</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Descrição do material/peça"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Custo:</label>
                    <input
                      type="number"
                      step="10"
                      value={item.partsCost}
                      onChange={(e) => updateItem(index, 'partsCost', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Observações:</label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => updateItem(index, 'notes', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Observações"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Subtotal: {item.partsCost.toFixed(2)} {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'R$'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo do Orçamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Mão de obra:</span>
                <span>{budget.totalLabor.toFixed(2)} {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'R$'}</span>
              </div>
              <div className="flex justify-between">
                <span>Peças/Materiais:</span>
                <span>{budget.totalParts.toFixed(2)} {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'R$'}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Subtotal:</span>
                <span>{budget.subtotal.toFixed(2)} {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'R$'}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA ({budget.ivaPercentage}%):</span>
                <span>{budget.ivaAmount.toFixed(2)} {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'R$'}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>TOTAL:</span>
                <span>{budget.totalCost.toFixed(2)} {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'R$'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Tempo total estimado:</span>
                <span>{budget.totalTime.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between">
                <span>Itens de materiais:</span>
                <span>{items.length}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            <Button onClick={saveBudget} disabled={saving || !licensePlate.trim()}>
              {saving ? 'Salvando...' : 'Salvar Orçamento'}
            </Button>
            <Button onClick={() => exportBudget('pdf')} variant="outline">
              Exportar PDF
            </Button>
            <Button onClick={() => exportBudget('csv')} variant="outline">
              Exportar CSV
            </Button>
            <Button onClick={() => exportBudget('txt')} variant="outline">
              Exportar TXT
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
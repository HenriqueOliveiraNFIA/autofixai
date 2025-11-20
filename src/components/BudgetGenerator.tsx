'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, Shield, FileText } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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
  const [prefillNotice, setPrefillNotice] = useState(false)

  // Campos de histórico de serviço
  const [serviceType, setServiceType] = useState('avaria')
  const [serviceCategory, setServiceCategory] = useState('')
  const [problemDescription, setProblemDescription] = useState('')
  const [warranty, setWarranty] = useState(false)

  useEffect(() => {
    // Verificar se há dados pré-preenchidos da Agenda
    const prefillData = localStorage.getItem('budgetPrefillData')
    if (prefillData) {
      try {
        const data = JSON.parse(prefillData)
        
        // Preencher campos básicos
        setLicensePlate(data.licensePlate || '')
        setVehicleInfo(data.vehicleInfo || '')
        setTotalHours(data.workHours || 0)
        setHourlyRate(data.hourlyRate || 45)

        // Preencher campos de histórico
        setServiceType(data.serviceType || 'avaria')
        setServiceCategory(data.serviceCategory || '')
        setProblemDescription(data.problemDescription || '')
        setWarranty(data.warranty || false)

        // Preencher peças
        if (data.parts && data.parts.length > 0) {
          const budgetItems = data.parts.map((part: any) => ({
            description: part.description || '',
            partsCost: part.price || 0,
            notes: part.notes || ''
          }))
          setItems(budgetItems)
        }

        // Adicionar descrição do problema como primeira peça se não houver peças
        if (data.problemDescription && (!data.parts || data.parts.length === 0)) {
          setItems([{
            description: data.problemDescription,
            partsCost: 0,
            notes: 'Problema reportado'
          }])
        }

        // Mostrar notificação
        setPrefillNotice(true)
        setTimeout(() => setPrefillNotice(false), 5000)

        // Limpar dados do localStorage
        localStorage.removeItem('budgetPrefillData')
      } catch (error) {
        console.error('Erro ao carregar dados pré-preenchidos:', error)
      }
    }
  }, [])

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

      // Preparar dados do histórico de serviço para salvar dentro do campo items (JSONB)
      const itemsWithServiceInfo = {
        items: budget.items,
        serviceInfo: {
          type: serviceType,
          category: serviceCategory,
          description: problemDescription,
          warranty: warranty
        }
      }

      const { data, error } = await supabase
        .from('budgets')
        .insert([{
          licenseplate: licensePlate.toUpperCase(),
          clientname: clientName || null,
          vehicleinfo: vehicleInfo || null,
          totallabor: budget.totalLabor,
          totalparts: budget.totalParts,
          totalhours: budget.totalTime,
          hourlyrate: hourlyRate,
          subtotal: budget.subtotal,
          ivapercentage: budget.ivaPercentage,
          ivaamount: budget.ivaAmount,
          totalcost: budget.totalCost,
          currency: budget.currency,
          items: itemsWithServiceInfo
        }])
        .select()

      if (error) {
        throw error
      }

      alert('Orçamento salvo com sucesso no histórico do veículo!')
      setItems([{ description: '', partsCost: 0, notes: '' }])
      setClientName('')
      setVehicleInfo('')
      setLicensePlate('')
      setTotalHours(0)
      setServiceType('avaria')
      setServiceCategory('')
      setProblemDescription('')
      setWarranty(false)
      
    } catch (error: any) {
      alert(`Erro ao salvar orçamento: ${error?.message || 'Erro desconhecido'}`)
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

INFORMAÇÕES DO SERVIÇO:
- Tipo: ${serviceType}
- Categoria: ${serviceCategory || 'Não especificada'}
- Garantia: ${warranty ? 'Sim' : 'Não'}
- Descrição: ${problemDescription || 'Não especificada'}

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
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Notificação de preenchimento automático */}
      {prefillNotice && (
        <Card className="border-green-500 border-2 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              <p className="font-semibold">Dados preenchidos automaticamente da Agenda de Trabalho!</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Gerador de Folha de Obra</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Nome do Cliente:</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full p-2 border rounded text-sm"
                placeholder="Nome do cliente"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Matrícula do Veículo:</label>
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                className="w-full p-2 border rounded text-sm"
                placeholder="AA-12-BB"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Informações do Veículo:</label>
              <input
                type="text"
                value={vehicleInfo}
                onChange={(e) => setVehicleInfo(e.target.value)}
                className="w-full p-2 border rounded text-sm"
                placeholder="Marca, modelo, matrícula"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">IVA (%):</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={ivaPercentage}
                onChange={(e) => setIvaPercentage(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border rounded text-sm"
                placeholder="23"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Moeda:</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="p-2 border rounded text-sm w-full"
              >
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dólar ($)</option>
                <option value="BRL">Real (R$)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Informações de Serviço */}
      <Card className="border-amber-300 border-2">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            Informações do Serviço
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="service_type">Tipo de Serviço *</Label>
              <select
                id="service_type"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full p-2 border rounded text-sm mt-1"
              >
                <option value="avaria">Avaria</option>
                <option value="revisao">Revisão</option>
                <option value="garantia">Garantia</option>
                <option value="manutencao">Manutenção Preventiva</option>
                <option value="inspecao">Inspeção</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <Label htmlFor="service_category">Categoria do Serviço</Label>
              <input
                id="service_category"
                type="text"
                value={serviceCategory}
                onChange={(e) => setServiceCategory(e.target.value)}
                className="w-full p-2 border rounded text-sm mt-1"
                placeholder="Ex: Motor, Suspensão, Elétrica..."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="problem_desc">Descrição Detalhada do Problema</Label>
            <Textarea
              id="problem_desc"
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="Descreva o problema e a solução aplicada para o histórico..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="warranty"
              checked={warranty}
              onChange={(e) => setWarranty(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="warranty" className="flex items-center gap-2 cursor-pointer">
              <Shield className="w-4 h-4 text-green-600" />
              Serviço em Garantia
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Mão de Obra</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Horas Totais:</label>
              <input
                type="number"
                step="0.5"
                value={totalHours}
                onChange={(e) => setTotalHours(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border rounded text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Valor/Hora:</label>
              <input
                type="number"
                step="5"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border rounded text-sm"
                placeholder="45"
              />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-xs sm:text-sm text-gray-600">
              Total Mão de Obra: {(totalHours * hourlyRate).toFixed(2)} {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'R$'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-base sm:text-lg">
            <span>Materiais/Peças</span>
            <Button onClick={addItem} className="text-sm w-full sm:w-auto">Adicionar Item</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border rounded-lg p-3 sm:p-4">
                <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1">Descrição:</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="w-full p-2 border rounded text-sm"
                      placeholder="Descrição do material/peça"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1">Custo:</label>
                    <input
                      type="number"
                      step="10"
                      value={item.partsCost}
                      onChange={(e) => updateItem(index, 'partsCost', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1">Observações:</label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => updateItem(index, 'notes', e.target.value)}
                      className="w-full p-2 border rounded text-sm"
                      placeholder="Observações"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="text-xs sm:text-sm text-gray-600">
                    Subtotal: {item.partsCost.toFixed(2)} {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'R$'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="text-xs sm:text-sm w-full sm:w-auto"
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
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Resumo da Folha de Obra</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Mão de obra:</span>
                <span>{budget.totalLabor.toFixed(2)} {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'R$'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Peças/Materiais:</span>
                <span>{budget.totalParts.toFixed(2)} {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'R$'}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-sm">
                <span>Subtotal:</span>
                <span>{budget.subtotal.toFixed(2)} {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'R$'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IVA ({budget.ivaPercentage}%):</span>
                <span>{budget.ivaAmount.toFixed(2)} {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'R$'}</span>
              </div>
              <div className="flex justify-between font-semibold text-base sm:text-lg border-t pt-2">
                <span>TOTAL:</span>
                <span>{budget.totalCost.toFixed(2)} {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'R$'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tempo total estimado:</span>
                <span>{budget.totalTime.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Itens de materiais:</span>
                <span>{items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tipo de serviço:</span>
                <span className="font-semibold">{serviceType}</span>
              </div>
              {warranty && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Shield className="w-4 h-4" />
                  <span className="font-semibold">Em Garantia</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-4 sm:mt-6">
            <Button onClick={saveBudget} disabled={saving || !licensePlate.trim()} className="text-sm flex-1 sm:flex-none">
              {saving ? 'Salvando...' : 'Salvar Folha de Obra'}
            </Button>
            <Button onClick={() => exportBudget('pdf')} variant="outline" className="text-sm flex-1 sm:flex-none">
              Exportar PDF
            </Button>
            <Button onClick={() => exportBudget('csv')} variant="outline" className="text-sm flex-1 sm:flex-none">
              Exportar CSV
            </Button>
            <Button onClick={() => exportBudget('txt')} variant="outline" className="text-sm flex-1 sm:flex-none">
              Exportar TXT
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

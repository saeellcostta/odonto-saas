# Tipos de Documentos - Referência do Site Original

## Documentos disponíveis no Prontuário:
1. **Atestado** - Documento médico para justificar ausência
2. **Receituário** - Prescrição de medicamentos
3. **Termo de Consentimento** - Autorização do paciente para procedimentos
4. **Contrato** - Contrato de prestação de serviços

Vou analisar cada um para entender a estrutura.


## 1. ATESTADO

### Campos do formulário:
- **Profissional**: Dropdown para selecionar o dentista responsável
- **Tipo de Atestado**: Radio buttons
  - Atestado de dias (quantidade de dias de afastamento)
  - Presença na consulta (apenas comparecimento)
- **Data**: Campo de data (padrão: data atual)
- **Quantidade de dias**: Campo numérico (apenas para atestado de dias)
- **Incluir CID**: Checkbox (requer autorização do paciente)

### Botões:
- Cancelar
- Salvar e Imprimir


## 2. RECEITUÁRIO

O formulário de receituário é simples e direto, contendo os seguintes campos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Profissional | Dropdown | Seleção do dentista responsável pela prescrição |
| Data | Date picker | Data da receita (padrão: data atual) |
| Prescrição | Textarea | Campo de texto livre para digitar os medicamentos e posologia |

Botões disponíveis: Cancelar e Salvar e Imprimir.


## 3. TERMO DE CONSENTIMENTO

O termo de consentimento permite que o paciente autorize formalmente a realização de procedimentos odontológicos. Estrutura do formulário:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Profissional | Dropdown | Seleção do dentista responsável |
| Data | Date picker | Data do termo (padrão: data atual) |
| Procedimento | Dropdown + Input | Pode selecionar de uma lista ou digitar procedimento personalizado |
| Procedimento personalizado | Text input | Campo para digitar procedimento não listado |

Botões disponíveis: Cancelar e Salvar e Imprimir.


## 4. CONTRATO

O contrato é o documento mais completo, formalizando a prestação de serviços odontológicos. Estrutura do formulário:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Profissional | Dropdown | Seleção do dentista responsável |
| Data | Date picker | Data do contrato (padrão: data atual) |
| Procedimentos | Textarea | Descrição detalhada dos procedimentos a serem realizados |
| Valor Total | Number input | Valor total do tratamento em R$ |
| Forma de Pagamento | Text input | Ex: "3x no cartão", "à vista", "6x sem juros" |
| Observações | Textarea | Campo para observações adicionais e cláusulas especiais |

Botões disponíveis: Cancelar e Salvar e Imprimir.

---

## Resumo dos Documentos

| Documento | Finalidade | Campos principais |
|-----------|------------|-------------------|
| Atestado | Justificar ausência do paciente | Profissional, Tipo (dias/presença), Data, Dias, CID |
| Receituário | Prescrever medicamentos | Profissional, Data, Prescrição |
| Termo de Consentimento | Autorizar procedimentos | Profissional, Data, Procedimento |
| Contrato | Formalizar tratamento | Profissional, Data, Procedimentos, Valor, Pagamento, Observações |

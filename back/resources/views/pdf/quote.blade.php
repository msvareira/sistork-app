<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orçamento #{{ $quote->id }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.5;
            font-size: 12px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 20px;
            border-radius: 8px;
        }
        
        .company-name {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 8px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        
        .company-tagline {
            font-size: 14px;
            color: #64748b;
            font-style: italic;
            margin-bottom: 10px;
        }
        
        .company-info {
            font-size: 11px;
            color: #475569;
            line-height: 1.4;
        }
        
        .quote-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            background: #f1f5f9;
            padding: 15px;
            border-radius: 6px;
            border-left: 5px solid #2563eb;
        }
        
        .quote-title {
            font-size: 28px;
            font-weight: bold;
            color: #1e293b;
            margin: 0;
        }
        
        .quote-number {
            font-size: 18px;
            color: #2563eb;
            font-weight: bold;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 25px;
        }
        
        .info-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .info-card-title {
            font-size: 14px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .info-row {
            display: flex;
            margin-bottom: 8px;
        }
        
        .info-label {
            font-weight: bold;
            min-width: 100px;
            color: #475569;
        }
        
        .info-value {
            color: #1e293b;
            flex: 1;
        }
        
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-pending { background-color: #fef3c7; color: #92400e; }
        .status-approved { background-color: #dbeafe; color: #1e40af; }
        .status-in_progress { background-color: #fde68a; color: #d97706; }
        .status-completed { background-color: #d1fae5; color: #065f46; }
        .status-rejected { background-color: #fee2e2; color: #dc2626; }
        .status-expired { background-color: #f3f4f6; color: #6b7280; }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e293b;
            margin: 25px 0 15px 0;
            padding: 10px 0;
            border-bottom: 2px solid #2563eb;
            position: relative;
        }
        
        .section-title:before {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 50px;
            height: 2px;
            background: #60a5fa;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .items-table th {
            background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
            color: white;
            padding: 12px 10px;
            text-align: left;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .items-table td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 11px;
        }
        
        .items-table tbody tr:hover {
            background-color: #f8fafc;
        }
        
        .items-table tbody tr:last-child td {
            border-bottom: none;
        }
        
        .items-table .text-right {
            text-align: right;
            font-weight: bold;
        }
        
        .items-table .text-center {
            text-align: center;
        }
        
        .total-section {
            margin-top: 25px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
        }
        
        .total-label {
            font-weight: bold;
            color: #475569;
        }
        
        .total-value {
            font-weight: bold;
            color: #1e293b;
            min-width: 120px;
            text-align: right;
        }
        
        .grand-total {
            font-size: 18px;
            color: #2563eb;
            border-top: 2px solid #2563eb;
            padding-top: 12px;
            margin-top: 12px;
            background: white;
            padding: 15px;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
        }
        
        .notes-section {
            margin-top: 25px;
            background: #fffbeb;
            border: 1px solid #fed7aa;
            border-radius: 8px;
            padding: 15px;
            border-left: 5px solid #f59e0b;
        }
        
        .notes-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .notes-content {
            color: #451a03;
            line-height: 1.6;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
        }
        
        .footer-info {
            margin-bottom: 5px;
        }
        
        .no-items {
            text-align: center;
            color: #64748b;
            font-style: italic;
            padding: 30px;
            background: #f8fafc;
            border-radius: 8px;
            border: 2px dashed #cbd5e1;
        }
        
        .currency {
            color: #059669;
            font-weight: bold;
        }
        
        .item-description {
            font-weight: 500;
            color: #1e293b;
        }
        
        .part-code {
            font-family: 'Courier New', monospace;
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
        }
        
        @media print {
            body { margin: 0; }
            .header { page-break-after: avoid; }
            .info-grid { page-break-inside: avoid; }
            .items-table { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">🏍️ SisTork</div>
        <div class="company-tagline">Sua Oficina de Confiança</div>
        <div class="company-info">
            📍 Rua das Oficinas, 123 - Centro - Cidade/UF - CEP: 12345-678<br>
            📞 (11) 9999-9999 • ✉️ contato@sistork.com.br<br>
            🌐 www.sistork.com.br
        </div>
    </div>

    <div class="quote-header">
        <div class="quote-title">Orçamento</div>
        <div class="quote-number">#{{ str_pad($quote->id, 6, '0', STR_PAD_LEFT) }}</div>
    </div>

    <div class="info-grid">
        <div class="info-card">
            <div class="info-card-title">📋 Informações do Orçamento</div>
            <div class="info-row">
                <div class="info-label">Data:</div>
                <div class="info-value">{{ $quote->created_at->format('d/m/Y H:i') }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Válido até:</div>
                <div class="info-value">{{ \Carbon\Carbon::parse($quote->expires_at)->format('d/m/Y') }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Status:</div>
                <div class="info-value">
                    <span class="status-badge status-{{ $quote->status }}">
                        @switch($quote->status)
                            @case('pending') Pendente @break
                            @case('approved') Aprovado @break
                            @case('in_progress') Em Andamento @break
                            @case('completed') Concluído @break
                            @case('rejected') Rejeitado @break
                            @case('expired') Expirado @break
                            @default {{ $quote->status }}
                        @endswitch
                    </span>
                </div>
            </div>
        </div>

        <div class="info-card">
            <div class="info-card-title">👤 Dados do Cliente</div>
            <div class="info-row">
                <div class="info-label">Nome:</div>
                <div class="info-value">{{ $quote->client->name }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Telefone:</div>
                <div class="info-value">{{ $quote->client->phone }}</div>
            </div>
            @if($quote->client->motorcycle_model)
            <div class="info-row">
                <div class="info-label">Moto:</div>
                <div class="info-value">{{ $quote->client->motorcycle_model }}</div>
            </div>
            @endif
            @if($quote->client->license_plate)
            <div class="info-row">
                <div class="info-label">Placa:</div>
                <div class="info-value">{{ $quote->client->license_plate }}</div>
            </div>
            @endif
        </div>
    </div>

    @if($quote->quoteServices->count() > 0)
    <div class="section-title">🔧 Serviços</div>
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 50%;">Descrição</th>
                <th class="text-center" style="width: 10%;">Qtd</th>
                <th class="text-right" style="width: 20%;">Valor Unit.</th>
                <th class="text-right" style="width: 20%;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($quote->quoteServices as $service)
            <tr>
                <td class="item-description">{{ $service->description }}</td>
                <td class="text-center">{{ $service->quantity }}</td>
                <td class="text-right currency">R$ {{ number_format($service->unit_price, 2, ',', '.') }}</td>
                <td class="text-right currency">R$ {{ number_format($service->total, 2, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    @if($quote->quoteParts->count() > 0)
    <div class="section-title">🔩 Peças</div>
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 40%;">Peça</th>
                <th style="width: 15%;">Código</th>
                <th class="text-center" style="width: 10%;">Qtd</th>
                <th class="text-right" style="width: 17.5%;">Valor Unit.</th>
                <th class="text-right" style="width: 17.5%;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($quote->quoteParts as $quotePart)
            <tr>
                <td class="item-description">{{ $quotePart->part->name ?? 'Peça não encontrada' }}</td>
                <td><span class="part-code">{{ $quotePart->part->internal_code ?? '-' }}</span></td>
                <td class="text-center">{{ $quotePart->quantity }}</td>
                <td class="text-right currency">R$ {{ number_format($quotePart->unit_price, 2, ',', '.') }}</td>
                <td class="text-right currency">R$ {{ number_format($quotePart->total, 2, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    @if($quote->quoteServices->count() === 0 && $quote->quoteParts->count() === 0)
    <div class="no-items">
        📭 Nenhum serviço ou peça encontrado neste orçamento.
    </div>
    @endif

    <div class="total-section">
        @php
            $servicesTotal = $quote->quoteServices->sum('total');
            $partsTotal = $quote->quoteParts->sum('total');
        @endphp
        
        @if($quote->quoteServices->count() > 0)
        <div class="total-row">
            <div class="total-label">🔧 Subtotal Serviços:</div>
            <div class="total-value currency">R$ {{ number_format($servicesTotal, 2, ',', '.') }}</div>
        </div>
        @endif
        
        @if($quote->quoteParts->count() > 0)
        <div class="total-row">
            <div class="total-label">🔩 Subtotal Peças:</div>
            <div class="total-value currency">R$ {{ number_format($partsTotal, 2, ',', '.') }}</div>
        </div>
        @endif
        
        <div class="total-row grand-total">
            <div class="total-label">💰 TOTAL GERAL:</div>
            <div class="total-value currency">R$ {{ number_format($quote->total, 2, ',', '.') }}</div>
        </div>
    </div>

    @if($quote->notes)
    <div class="notes-section">
        <div class="notes-title">📝 Observações</div>
        <div class="notes-content">{{ $quote->notes }}</div>
    </div>
    @endif

    <div class="footer">
        <div class="footer-info">
            <strong>⏰ Validade:</strong> Este orçamento é válido até {{ \Carbon\Carbon::parse($quote->expires_at)->format('d/m/Y') }}
        </div>
        <div class="footer-info">
            <strong>📄 Documento:</strong> Orçamento #{{ str_pad($quote->id, 6, '0', STR_PAD_LEFT) }} gerado em {{ now()->format('d/m/Y H:i:s') }}
        </div>
        <div class="footer-info">
            🏍️ <strong>SisTork</strong> - Sistema de Gestão para Oficinas | Desenvolvido para sua conveniência
        </div>
    </div>
</body>
</html>

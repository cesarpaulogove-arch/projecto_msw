
import jsPDF from "jspdf";

export interface ItemPDFCotacao {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: string | number;
  originalUnitPrice?: string | number | null;
  total: string | number;
}

export interface DadosPDFCotacao {
  id: string;
  quoteNumber: string;

  customerType?: "INDIVIDUAL" | "COMPANY" | null;
  customerName: string;
  company?: string | null;
  nuit?: string | null;

  phone: string;
  email?: string | null;
  address?: string | null;

  subtotalOriginal?: string | number | null;
  discountTotal?: string | number | null;
  total: string | number;
  currency?: string;

  notes?: string | null;
  validUntil?: string | null;
  createdAt: string;

  items: ItemPDFCotacao[];
}

const COR = {
  azul: [7, 27, 45] as [number, number, number],
  ciano: [6, 182, 212] as [number, number, number],
  cinza: [100, 116, 139] as [number, number, number],
  claro: [241, 245, 249] as [number, number, number],
  escuro: [15, 23, 42] as [number, number, number],
  desconto: [16, 150, 100] as [number, number, number],
};

const MARGEM = 15;

function numeroSeguro(
  valor: string | number | null | undefined
): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function moeda(
  valor: string | number,
  currency = "MZN"
): string {
  try {
    return new Intl.NumberFormat("pt-MZ", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeroSeguro(valor));
  } catch {
    return `${numeroSeguro(valor).toFixed(2)} ${currency}`;
  }
}

function dataFormatada(data?: string | null): string {
  if (!data) return "—";

  const convertida = new Date(data);

  if (Number.isNaN(convertida.getTime())) return "—";

  return new Intl.DateTimeFormat("pt-MZ", {
    timeZone: "Africa/Maputo",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(convertida);
}

function textoSeguro(valor?: string | null): string {
  return valor?.trim() || "Não indicado";
}

async function carregarCarimbo(): Promise<string | null> {
  try {
    const resposta = await fetch("/msw_carrimbo.png");

    if (!resposta.ok) return null;

    const blob = await resposta.blob();

    return await new Promise((resolve, reject) => {
      const leitor = new FileReader();

      leitor.onload = () => {
        resolve(
          typeof leitor.result === "string"
            ? leitor.result
            : null
        );
      };

      leitor.onerror = () => {
        reject(new Error("Erro ao carregar carimbo."));
      };

      leitor.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Não foi possível carregar o carimbo:", error);
    return null;
  }
}

export async function gerarPDFCotacao(
  dados: DadosPDFCotacao
): Promise<void> {
  if (
    !dados ||
    !dados.quoteNumber ||
    !dados.items?.length
  ) {
    throw new Error("Os dados da cotação estão incompletos.");
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const larguraPagina = pdf.internal.pageSize.getWidth();
  const alturaPagina = pdf.internal.pageSize.getHeight();
  const larguraUtil = larguraPagina - MARGEM * 2;
  const moedaCotacao = dados.currency || "MZN";

  let y = 15;

  // =====================================================
  // 1. CALCULAR DESCONTOS
  // =====================================================

  const produtosCalculados = dados.items.map((item) => {
    const quantidade = Math.max(
      0,
      numeroSeguro(item.quantity)
    );

    const precoFinal = Math.max(
      0,
      numeroSeguro(item.unitPrice)
    );

    const precoOriginalInformado =
      item.originalUnitPrice !== null &&
      item.originalUnitPrice !== undefined
        ? numeroSeguro(item.originalUnitPrice)
        : precoFinal;

    const precoOriginal = Math.max(
      precoFinal,
      precoOriginalInformado
    );

    const totalOriginal = precoOriginal * quantidade;

    const totalFinalInformado = Number(item.total);

    const totalFinal = Number.isFinite(totalFinalInformado)
      ? Math.max(0, totalFinalInformado)
      : precoFinal * quantidade;

    const desconto = Math.max(
      0,
      totalOriginal - totalFinal
    );

    return {
      ...item,
      quantidade,
      precoOriginal,
      precoFinal,
      totalOriginal,
      totalFinal,
      desconto,
      temDesconto: desconto > 0,
    };
  });

  const subtotalOriginalCalculado =
    produtosCalculados.reduce(
      (soma, item) => soma + item.totalOriginal,
      0
    );

  const subtotalFinalCalculado =
    produtosCalculados.reduce(
      (soma, item) => soma + item.totalFinal,
      0
    );

  const subtotalOriginalGuardado = numeroSeguro(
    dados.subtotalOriginal
  );

  const descontoGuardado = numeroSeguro(
    dados.discountTotal
  );

  const subtotalOriginal =
    subtotalOriginalGuardado > 0
      ? subtotalOriginalGuardado
      : subtotalOriginalCalculado;

  const descontoTotal =
    descontoGuardado > 0
      ? descontoGuardado
      : Math.max(
          0,
          subtotalOriginal - subtotalFinalCalculado
        );

  const totalPagar = Math.max(
    0,
    numeroSeguro(dados.total)
  );

  // =====================================================
  // 2. CARIMBO
  // =====================================================

  const imagemCarimboPromise = carregarCarimbo();

  // =====================================================
  // 3. CABEÇALHO
  // =====================================================

  function adicionarCabecalho() {
    pdf.setFillColor(...COR.azul);
    pdf.rect(0, 0, larguraPagina, 43, "F");

    pdf.setFillColor(...COR.ciano);
    pdf.rect(0, 43, larguraPagina, 2, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(23);

    pdf.text("MSW", MARGEM, 19);

    const larguraMSW = pdf.getTextWidth("MSW");

    pdf.setTextColor(...COR.ciano);
    pdf.text(" BUSINESS", MARGEM + larguraMSW, 19);

    pdf.setTextColor(220, 230, 240);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    pdf.text(
      "Tecnologia, componentes e soluções electronicas",
      MARGEM,
      26
    );

    pdf.setTextColor(...COR.ciano);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(17);

    pdf.text(
      "COTACAO",
      larguraPagina - MARGEM,
      16,
      { align: "right" }
    );

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    pdf.text(
      `Nº ${dados.quoteNumber}`,
      larguraPagina - MARGEM,
      24,
      { align: "right" }
    );

    pdf.text(
      `Emitida: ${dataFormatada(dados.createdAt)}`,
      larguraPagina - MARGEM,
      31,
      { align: "right" }
    );
  }

  // =====================================================
  // 4. RODAPÉ
  // =====================================================

  function adicionarRodape() {
    const rodapeY = alturaPagina - 15;

    pdf.setDrawColor(210, 220, 230);

    pdf.line(
      MARGEM,
      rodapeY - 7,
      larguraPagina - MARGEM,
      rodapeY - 7
    );

    pdf.setTextColor(...COR.azul);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);

    pdf.text(
      "MSW BUSINESS | CONTACTOS",
      larguraPagina / 2,
      rodapeY,
      { align: "center" }
    );

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...COR.cinza);

    pdf.text(
      "WhatsApp: 864 018 233",
      larguraPagina / 2,
      rodapeY + 4,
      { align: "center" }
    );

    pdf.text(
      "Alto-Mae, cruzamento entre a Av. Mario Nguabi e a Rua da Guine, Maputo.",
      larguraPagina / 2,
      rodapeY + 8,
      { align: "center" }
    );
  }

  // =====================================================
  // 5. PAGINAÇÃO
  // =====================================================

  function novaPagina() {
    pdf.addPage();
    adicionarCabecalho();
    y = 53;
  }

  function verificarEspaco(altura: number) {
    const limite = alturaPagina - 27;

    if (y + altura > limite) {
      novaPagina();
    }
  }

  adicionarCabecalho();
  y = 53;

  // =====================================================
  // 6. TÍTULOS
  // =====================================================

  function tituloSecao(titulo: string) {
    verificarEspaco(9);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...COR.azul);

    pdf.text(titulo, MARGEM, y);
    y += 7;
  }

  // =====================================================
  // 7. CLIENTE E LOJA
  // =====================================================

  tituloSecao("INFORMACOES DO CLIENTE E ESTABELECIMENTO");

  const larguraColuna = (larguraUtil - 10) / 2;
  const colunaEsquerda = MARGEM;
  const colunaDireita = MARGEM + larguraColuna + 10;

  const tipoCliente =
    dados.customerType === "COMPANY" || dados.company
      ? "Empresa"
      : "Pessoa individual";

  const dadosCliente = [
    `Tipo de cliente: ${tipoCliente}`,
    `Nome: ${textoSeguro(dados.customerName)}`,
    ...(tipoCliente === "Empresa"
      ? [
          `Empresa: ${textoSeguro(dados.company)}`,
          `NUIT: ${textoSeguro(dados.nuit)}`,
        ]
      : []),
    `Telefone: ${textoSeguro(dados.phone)}`,
    `Email: ${textoSeguro(dados.email)}`,
    `Endereco: ${textoSeguro(dados.address)}`,
  ];

  const dadosLoja = [
    "MSW BUSINESS",
    "Loja de componentes electronicos",
    "WhatsApp: 864 018 233",
    "Localizacao: Alto-Mae, Maputo",
    "Av. Mario Nguabi, cruzamento com",
    "a Rua da Guine.",
  ];

  pdf.setFillColor(...COR.claro);
  pdf.roundedRect(
    MARGEM,
    y,
    larguraUtil,
    43,
    2,
    2,
    "F"
  );

  pdf.setDrawColor(210, 220, 230);

  pdf.line(
    larguraPagina / 2,
    y + 4,
    larguraPagina / 2,
    y + 39
  );

  function escreverColuna(
    linhas: string[],
    x: number,
    largura: number
  ) {
    let posicaoY = y + 7;

    linhas.forEach((linha) => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...COR.escuro);

      const partes = pdf.splitTextToSize(linha, largura);
      pdf.text(partes, x, posicaoY);

      posicaoY += partes.length * 4 + 1;
    });

    return posicaoY;
  }

  const fimCliente = escreverColuna(
    dadosCliente,
    colunaEsquerda + 4,
    larguraColuna - 8
  );

  escreverColuna(
    dadosLoja,
    colunaDireita,
    larguraColuna - 4
  );

  y += Math.max(43, fimCliente - y + 5) + 7;

  // =====================================================
  // 8. INFORMAÇÃO DA COTAÇÃO
  // =====================================================

  tituloSecao("INFORMACAO DA COTACAO");

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...COR.escuro);

  pdf.text(
    `Numero: ${dados.quoteNumber}`,
    MARGEM,
    y
  );

  pdf.text(
    `Emissao: ${dataFormatada(dados.createdAt)}`,
    MARGEM + 85,
    y
  );

  y += 6;

  pdf.text(
    `Validade: ${dataFormatada(dados.validUntil)}`,
    MARGEM,
    y
  );

  y += 10;

  // =====================================================
  // 9. TABELA DE PRODUTOS
  // =====================================================

  tituloSecao("PRODUTOS E SERVICOS");

  const colunas = {
    produto: MARGEM + 2,
    quantidade: MARGEM + 91,
    original: MARGEM + 127,
    unitario: MARGEM + 158,
    total: larguraPagina - MARGEM - 2,
  };

  function cabecalhoTabela() {
    pdf.setFillColor(...COR.azul);
    pdf.rect(MARGEM, y - 5, larguraUtil, 10, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);

    pdf.text("PRODUTO", colunas.produto, y + 1);

    pdf.text(
      "QTD.",
      colunas.quantidade,
      y + 1,
      { align: "center" }
    );

    pdf.text(
      "PRECO BASE",
      colunas.original,
      y + 1,
      { align: "right" }
    );

    pdf.text(
      "PRECO FINAL",
      colunas.unitario,
      y + 1,
      { align: "right" }
    );

    pdf.text(
      "TOTAL",
      colunas.total,
      y + 1,
      { align: "right" }
    );

    y += 10;
  }

  cabecalhoTabela();

  // =====================================================
  // 10. PRODUTOS E DESCONTOS INDIVIDUAIS
  // =====================================================

  produtosCalculados.forEach((item) => {
    const nomeProduto = pdf.splitTextToSize(
      item.productName,
      75
    );

    const alturaLinha = Math.max(
      9,
      nomeProduto.length * 4 + 4
    );

    verificarEspaco(alturaLinha + 12);

    if (y === 53) {
      tituloSecao("PRODUTOS E SERVICOS");
      cabecalhoTabela();
    }

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...COR.escuro);

    pdf.text(nomeProduto, colunas.produto, y + 2);

    pdf.text(
      String(item.quantidade),
      colunas.quantidade,
      y + 2,
      { align: "center" }
    );

    pdf.setTextColor(...COR.cinza);

    pdf.text(
      moeda(item.precoOriginal, moedaCotacao),
      colunas.original,
      y + 2,
      { align: "right" }
    );

    pdf.setFont(
      "helvetica",
      item.temDesconto ? "bold" : "normal"
    );

    pdf.setTextColor(
      ...(item.temDesconto ? COR.desconto : COR.escuro)
    );

    pdf.text(
      moeda(item.precoFinal, moedaCotacao),
      colunas.unitario,
      y + 2,
      { align: "right" }
    );

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...COR.azul);

    pdf.text(
      moeda(item.totalFinal, moedaCotacao),
      colunas.total,
      y + 2,
      { align: "right" }
    );

    y += alturaLinha;

    if (item.temDesconto) {
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(7);
      pdf.setTextColor(...COR.desconto);

      pdf.text(
        `Desconto aplicado: ${moeda(item.desconto, moedaCotacao)}`,
        colunas.produto,
        y
      );

      y += 4;
    }

    pdf.setDrawColor(225, 232, 240);

    pdf.line(
      MARGEM,
      y,
      larguraPagina - MARGEM,
      y
    );

    y += 3;
  });

  // =====================================================
  // 11. RESUMO FINANCEIRO
  // =====================================================

  const alturaResumo = descontoTotal > 0 ? 34 : 24;

  verificarEspaco(alturaResumo + 12);

  y += 5;

  const larguraResumo = 85;
  const xResumo = larguraPagina - MARGEM - larguraResumo;

  pdf.setFillColor(...COR.claro);

  pdf.roundedRect(
    xResumo,
    y,
    larguraResumo,
    alturaResumo,
    2,
    2,
    "F"
  );

  let resumoY = y + 7;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...COR.cinza);

  pdf.text("Subtotal original", xResumo + 5, resumoY);

  pdf.text(
    moeda(subtotalOriginal, moedaCotacao),
    xResumo + larguraResumo - 5,
    resumoY,
    { align: "right" }
  );

  resumoY += 7;

  if (descontoTotal > 0) {
    pdf.setTextColor(...COR.desconto);
    pdf.setFont("helvetica", "bold");

    pdf.text("Desconto total", xResumo + 5, resumoY);

    pdf.text(
      `- ${moeda(descontoTotal, moedaCotacao)}`,
      xResumo + larguraResumo - 5,
      resumoY,
      { align: "right" }
    );

    resumoY += 7;
  }

  pdf.setDrawColor(210, 220, 230);

  pdf.line(
    xResumo + 5,
    resumoY - 3,
    xResumo + larguraResumo - 5,
    resumoY - 3
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...COR.azul);

  pdf.text("TOTAL", xResumo + 5, resumoY + 4);

  pdf.text(
    moeda(totalPagar, moedaCotacao),
    xResumo + larguraResumo - 5,
    resumoY + 4,
    { align: "right" }
  );

  y += alturaResumo + 7;

  // =====================================================
  // 12. OBSERVAÇÕES
  // =====================================================

  if (dados.notes?.trim()) {
    const observacoes = pdf.splitTextToSize(
      dados.notes.trim(),
      larguraUtil - 4
    );

    verificarEspaco(observacoes.length * 4 + 14);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...COR.azul);

    pdf.text("OBSERVACOES", MARGEM, y);

    y += 6;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...COR.cinza);

    pdf.text(observacoes, MARGEM, y);

    y += observacoes.length * 4 + 7;
  }

  // =====================================================
  // 13. VALIDADE
  // =====================================================

  const mensagem = dados.validUntil
    ? `Esta cotacao e valida ate ${dataFormatada(dados.validUntil)}.`
    : "Consulte a data de validade indicada nesta cotacao.";

  const mensagemLinhas = pdf.splitTextToSize(
    mensagem,
    larguraUtil
  );

  verificarEspaco(mensagemLinhas.length * 4 + 10);

  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8);
  pdf.setTextColor(...COR.cinza);

  pdf.text(
    mensagemLinhas,
    larguraPagina / 2,
    y,
    { align: "center" }
  );

  y += mensagemLinhas.length * 4 + 10;

  // =====================================================
  // 14. CARIMBO
  // =====================================================

  const imagemCarimbo = await imagemCarimboPromise;

  const larguraCarimbo = 45;
  const alturaCarimbo = 29;

  if (y + alturaCarimbo > alturaPagina - 23) {
    novaPagina();
  }

  if (imagemCarimbo) {
    const xCarimbo =
      (larguraPagina - larguraCarimbo) / 2;

    pdf.addImage(
      imagemCarimbo,
      "PNG",
      xCarimbo,
      y,
      larguraCarimbo,
      alturaCarimbo
    );
  }

  // =====================================================
  // 15. RODAPÉ EM TODAS AS PÁGINAS
  // =====================================================

  const totalPaginas = pdf.getNumberOfPages();

  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    pdf.setPage(pagina);
    adicionarRodape();
  }

  // =====================================================
  // 16. GUARDAR PDF
  // =====================================================

  pdf.save(`Cotacao-${dados.quoteNumber}.pdf`);
}

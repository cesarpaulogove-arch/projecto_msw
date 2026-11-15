
import jsPDF from "jspdf";

export interface ItemPDFCotacao {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: string | number;
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
};

const MARGEM = 15;

function moeda(valor: string | number): string {
  return new Intl.NumberFormat("pt-MZ", {
    style: "currency",
    currency: "MZN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0);
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

      leitor.onerror = () => reject(new Error("Erro ao carregar carimbo."));

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
  if (!dados || !dados.quoteNumber || !dados.items?.length) {
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

  let y = 15;

  // Carregar carimbo.
  const imagemCarimboPromise = carregarCarimbo();

  // Cabeçalho.
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

    pdf.text("COTACAO", larguraPagina - MARGEM, 16, {
      align: "right",
    });

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

  // Rodapé.
  function adicionarRodape() {
    const rodapeY = alturaPagina - 15;

    pdf.setDrawColor(210, 220, 230);
    pdf.line(MARGEM, rodapeY - 7, larguraPagina - MARGEM, rodapeY - 7);

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

  // Nova página.
  function novaPagina() {
    pdf.addPage();
    adicionarCabecalho();
    y = 53;
  }

  // Verificar espaço disponível para o conteúdo.
  function verificarEspaco(altura: number) {
    const limite = alturaPagina - 27;

    if (y + altura > limite) {
      novaPagina();
    }
  }

  adicionarCabecalho();
  y = 53;

  // Título da secção.
  function tituloSecao(titulo: string) {
    verificarEspaco(9);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...COR.azul);

    pdf.text(titulo, MARGEM, y);

    y += 7;
  }

  // Dados do cliente e da loja.
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

  // Informação da cotação.
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

  // Tabela de produtos.
  tituloSecao("PRODUTOS E SERVICOS");

  const colunas = {
    produto: MARGEM + 2,
    quantidade: MARGEM + 104,
    unitario: MARGEM + 130,
    total: larguraPagina - MARGEM - 2,
  };

  function cabecalhoTabela() {
    pdf.setFillColor(...COR.azul);

    pdf.rect(
      MARGEM,
      y - 5,
      larguraUtil,
      10,
      "F"
    );

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);

    pdf.text("PRODUTO", colunas.produto, y + 1);

    pdf.text("QTD.", colunas.quantidade, y + 1, {
      align: "center",
    });

    pdf.text("PRECO UNIT.", colunas.unitario, y + 1, {
      align: "right",
    });

    pdf.text("TOTAL", colunas.total, y + 1, {
      align: "right",
    });

    y += 10;
  }

  cabecalhoTabela();

  dados.items.forEach((item) => {
    const nomeProduto = pdf.splitTextToSize(
      item.productName,
      88
    );

    const alturaLinha = Math.max(9, nomeProduto.length * 4 + 4);

    verificarEspaco(alturaLinha + 3);

    // Repetir cabeçalho caso tenha sido criada nova página.
    if (y === 53) {
      tituloSecao("PRODUTOS E SERVICOS");
      cabecalhoTabela();
    }

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...COR.escuro);

    pdf.text(nomeProduto, colunas.produto, y + 2);

    pdf.text(
      String(item.quantity),
      colunas.quantidade,
      y + 2,
      { align: "center" }
    );

    pdf.text(
      moeda(item.unitPrice),
      colunas.unitario,
      y + 2,
      { align: "right" }
    );

    pdf.setFont("helvetica", "bold");

    pdf.text(
      moeda(item.total),
      colunas.total,
      y + 2,
      { align: "right" }
    );

    y += alturaLinha;

    pdf.setDrawColor(225, 232, 240);
    pdf.line(MARGEM, y, larguraPagina - MARGEM, y);

    y += 2;
  });

  // Total.
  verificarEspaco(20);

  y += 5;

  pdf.setFillColor(...COR.claro);
  pdf.roundedRect(
    larguraPagina - MARGEM - 75,
    y,
    75,
    16,
    2,
    2,
    "F"
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...COR.azul);

  pdf.text("TOTAL", larguraPagina - MARGEM - 70, y + 10);

  pdf.setFontSize(11);
  pdf.text(
    moeda(dados.total),
    larguraPagina - MARGEM - 4,
    y + 10,
    { align: "right" }
  );

  y += 25;

  // Observações.
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

  // Mensagem de validade.
  const mensagem =
    "Esta cotacao e valida por 5 dias apos a emissao.";

  verificarEspaco(10);

  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8);
  pdf.setTextColor(...COR.cinza);

  pdf.text(mensagem, larguraPagina / 2, y, {
    align: "center",
  });

  y += 10;

  // Carimbo no final do documento.
  const imagemCarimbo = await imagemCarimboPromise;

  const larguraCarimbo = 45;
  const alturaCarimbo = 29;

  // Se não houver espaço suficiente, criar uma nova página.
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

  // Rodapé em todas as páginas.
  const totalPaginas = pdf.getNumberOfPages();

  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    pdf.setPage(pagina);
    adicionarRodape();
  }

  // Nome do ficheiro.
  const nomeFicheiro = `Cotacao-${dados.quoteNumber}.pdf`;

  pdf.save(nomeFicheiro);
}

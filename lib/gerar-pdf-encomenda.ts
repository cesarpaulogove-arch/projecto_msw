
import jsPDF from "jspdf";

export interface ItemPDFEncomenda {
  nome: string;
  quantidade: number;
  preco: number;
  precoOriginal?: number | null;
  total: number;
}

export interface DadosPDFEncomenda {
  id: string;
  orderNumber: string;
  estado: string;
  customerType: "INDIVIDUAL" | "COMPANY";
  cliente: string;
  empresa?: string | null;
  nuit?: string | null;
  telefone: string;
  email?: string | null;
  endereco: string;
  distrito?: string | null;
  observacoes?: string | null;
  produtos: ItemPDFEncomenda[];
  entrega: number;
  total: number;
  data: string | Date;
}

const formatarPreco = (valor: number) =>
  `${valor.toLocaleString("pt-MZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MT`;

const formatarData = (data: string | Date) =>
  new Date(data).toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Maputo",
  });

async function carregarImagem(
  caminho: string
): Promise<string | null> {
  try {
    const resposta = await fetch(caminho);

    if (!resposta.ok) return null;

    const blob = await resposta.blob();

    return await new Promise((resolve, reject) => {
      const leitor = new FileReader();

      leitor.onload = () =>
        resolve(leitor.result as string);

      leitor.onerror = () =>
        reject(new Error("Erro ao carregar imagem"));

      leitor.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function gerarPDFEncomenda(
  dados: DadosPDFEncomenda
): Promise<void> {
  const pdf = new jsPDF("p", "mm", "a4");

  const larguraPagina = pdf.internal.pageSize.getWidth();
  const alturaPagina = pdf.internal.pageSize.getHeight();

  const margem = 15;
  const larguraConteudo = larguraPagina - margem * 2;

  const azulEscuro: [number, number, number] = [7, 27, 45];
  const azul: [number, number, number] = [15, 75, 120];
  const cinzento: [number, number, number] = [90, 90, 90];
  const verde: [number, number, number] = [22, 130, 75];

  const alturaRodape = 23;
  const limiteConteudo = alturaPagina - 65;

  const larguraColuna = (larguraConteudo - 12) / 2;
  const colunaEsquerda = margem;
  const colunaDireita = margem + larguraColuna + 12;

  let y = 49;

  const imagemCarimboPromise =
    carregarImagem("/msw_carrimbo.png");

  const temEntrega =
    typeof dados.distrito === "string" &&
    dados.distrito.trim() !== "" &&
    !["A COMBINAR", "N/A"].includes(
      dados.distrito.trim().toUpperCase()
    );

  // =====================================================
  // CÁLCULO DOS DESCONTOS
  // =====================================================

  const calculosProdutos = dados.produtos.map((produto) => {
    const precoOriginal =
      typeof produto.precoOriginal === "number" &&
      Number.isFinite(produto.precoOriginal) &&
      produto.precoOriginal > produto.preco
        ? produto.precoOriginal
        : produto.preco;

    const totalOriginal =
      precoOriginal * produto.quantidade;

    const totalAtual =
      Number.isFinite(produto.total)
        ? Math.max(0, produto.total)
        : produto.preco * produto.quantidade;

    const desconto = Math.max(
      0,
      totalOriginal - totalAtual
    );

    const temDesconto = desconto > 0;

    const percentagem =
      totalOriginal > 0
        ? Math.round((desconto / totalOriginal) * 100)
        : 0;

    return {
      ...produto,
      precoOriginal,
      totalOriginal,
      totalAtual,
      desconto,
      temDesconto,
      percentagem,
    };
  });

  const subtotalOriginal = calculosProdutos.reduce(
    (total, produto) => total + produto.totalOriginal,
    0
  );

  const subtotalAtual = calculosProdutos.reduce(
    (total, produto) => total + produto.totalAtual,
    0
  );

  const descontoTotal = calculosProdutos.reduce(
    (total, produto) => total + produto.desconto,
    0
  );

  const temDesconto = descontoTotal > 0;

  const percentagemPoupada =
    subtotalOriginal > 0
      ? Math.round(
          (descontoTotal / subtotalOriginal) * 100
        )
      : 0;

  // =====================================================
  // CUSTO DE ENTREGA E TOTAL A PAGAR
  // =====================================================

  const custoEntrega = temEntrega
    ? Math.max(0, Number(dados.entrega) || 0)
    : 0;

  // Total dos produtos já com desconto + entrega
  const totalPagar = subtotalAtual + custoEntrega;

  // =====================================================
  // CABEÇALHO
  // =====================================================

  const adicionarCabecalho = () => {
    pdf.setFillColor(...azulEscuro);
    pdf.rect(0, 0, larguraPagina, 38, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);

    pdf.text("MSW BUSINESS", margem, 17);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    pdf.text("COMPROVATIVO DE COMPRA", margem, 25);

    pdf.setFontSize(9);

    pdf.text(
      `Referência: ${dados.orderNumber}`,
      larguraPagina - margem,
      17,
      { align: "right" }
    );

    pdf.text(
      `Data: ${formatarData(dados.data)}`,
      larguraPagina - margem,
      25,
      { align: "right" }
    );

    pdf.setTextColor(0, 0, 0);

    y = 49;
  };

  const adicionarNovaPagina = () => {
    pdf.addPage();
    adicionarCabecalho();
  };

  // =====================================================
  // CONTROLO DO ESPAÇO
  // =====================================================

  const verificarEspaco = (altura: number): boolean => {
    if (y + altura > limiteConteudo) {
      adicionarNovaPagina();
      return true;
    }

    return false;
  };

  // =====================================================
  // TEXTO AUTOMÁTICO
  // =====================================================

  const adicionarTexto = (
    texto: string,
    x: number,
    largura: number,
    tamanho = 9,
    cor: [number, number, number] = [0, 0, 0]
  ) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(tamanho);
    pdf.setTextColor(...cor);

    const linhas = pdf.splitTextToSize(texto, largura);

    const altura = linhas.length * 4 + 1.5;

    verificarEspaco(altura);

    pdf.text(linhas, x, y);

    y += altura;
  };

  const adicionarLinha = () => {
    verificarEspaco(7);

    pdf.setDrawColor(210, 210, 210);

    pdf.line(
      margem,
      y,
      larguraPagina - margem,
      y
    );

    y += 6;
  };

  adicionarCabecalho();

  // =====================================================
  // INFORMAÇÕES DO CLIENTE E DA LOJA
  // =====================================================

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...azul);

  pdf.text("INFORMAÇÕES", margem, y);

  y += 8;

  const inicioColunas = y;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...azul);

  pdf.text(
    "DADOS DO CLIENTE",
    colunaEsquerda,
    y
  );

  let yCliente = y + 6;

  const dadosCliente = [
    `Cliente: ${dados.cliente}`,
    ...(dados.customerType === "COMPANY"
      ? [
          `Empresa: ${dados.empresa || "-"}`,
          `NUIT: ${dados.nuit || "-"}`,
        ]
      : []),
    `Telefone: ${dados.telefone}`,
    `Email: ${dados.email || "-"}`,
    ...(temEntrega
      ? [
          `Endereço: ${dados.endereco || "-"}`,
          `Zona: ${dados.distrito}`,
        ]
      : ["Modalidade: Levantamento na loja"]),
  ];

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);

  for (const texto of dadosCliente) {
    const linhas = pdf.splitTextToSize(
      texto,
      larguraColuna
    );

    pdf.text(linhas, colunaEsquerda, yCliente);

    yCliente += linhas.length * 4 + 1.5;
  }

  // DADOS DA LOJA

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...azul);

  pdf.text(
    "MSW BUSINESS",
    colunaDireita,
    y
  );

  let yLoja = y + 6;

  const dadosLoja = [
    "Loja de componentes electrónicos",
    "WhatsApp: 864 018 233",
    "Localização: Alto-Maé, Maputo",
    "Av. Mário Nguabi, cruzamento com a Rua da Guiné.",
  ];

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);

  for (const texto of dadosLoja) {
    const linhas = pdf.splitTextToSize(
      texto,
      larguraColuna
    );

    pdf.text(linhas, colunaDireita, yLoja);

    yLoja += linhas.length * 4 + 1.5;
  }

  const fimColunas = Math.max(yCliente, yLoja);

  pdf.setDrawColor(210, 210, 210);

  pdf.line(
    margem + larguraColuna + 6,
    inicioColunas - 2,
    margem + larguraColuna + 6,
    fimColunas + 1
  );

  y = fimColunas + 5;

  adicionarLinha();

  // =====================================================
  // PRODUTOS DA COMPRA
  // =====================================================

  const tituloProdutos = () => {
    verificarEspaco(17);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...azul);

    pdf.text(
      "PRODUTOS DA COMPRA",
      margem,
      y
    );

    y += 8;
  };

  // Colunas da tabela
  const colunaProduto = margem + 2;
  const colunaQuantidade = 105;
  const colunaOriginal = 125;
  const colunaPreco = 158;
  const colunaTotal = larguraPagina - margem - 2;

  const cabecalhoTabela = () => {
    verificarEspaco(12);

    pdf.setFillColor(...azulEscuro);

    pdf.rect(
      margem,
      y - 4.5,
      larguraConteudo,
      8,
      "F"
    );

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);

    pdf.text("Produto", colunaProduto, y);
    pdf.text("Qtd.", colunaQuantidade, y);
    pdf.text("Normal", colunaOriginal, y);

    pdf.text(
      "Actual",
      colunaPreco,
      y
    );

    pdf.text(
      "Total",
      colunaTotal,
      y,
      { align: "right" }
    );

    y += 7;

    pdf.setTextColor(0, 0, 0);
  };

  tituloProdutos();
  cabecalhoTabela();

  for (const produto of calculosProdutos) {
    const nomeLinhas = pdf.splitTextToSize(
      produto.nome,
      colunaQuantidade - colunaProduto - 8
    );

    const alturaLinha = Math.max(
      produto.temDesconto ? 11 : 8,
      nomeLinhas.length * 4 + 2
    );

    if (y + alturaLinha + 3 > limiteConteudo) {
      adicionarNovaPagina();

      tituloProdutos();
      cabecalhoTabela();
    }

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(0, 0, 0);

    pdf.text(nomeLinhas, colunaProduto, y);

    pdf.text(
      String(produto.quantidade),
      colunaQuantidade,
      y
    );

    // PREÇO ORIGINAL

    pdf.setTextColor(
      produto.temDesconto ? 120 : 0,
      produto.temDesconto ? 120 : 0,
      produto.temDesconto ? 120 : 0
    );

    pdf.text(
      formatarPreco(produto.precoOriginal),
      colunaOriginal,
      y,
      { align: "right" }
    );

    // PREÇO ACTUAL

    if (produto.temDesconto) {
      pdf.setTextColor(...verde);
    } else {
      pdf.setTextColor(0, 0, 0);
    }

    pdf.text(
      formatarPreco(produto.preco),
      colunaPreco,
      y,
      { align: "right" }
    );

    // TOTAL EFECTIVO DA LINHA

    pdf.setTextColor(0, 0, 0);

    pdf.text(
      formatarPreco(produto.totalAtual),
      colunaTotal,
      y,
      { align: "right" }
    );

    // DESCONTO POR PRODUTO

    if (produto.temDesconto) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6);
      pdf.setTextColor(...verde);

      pdf.text(
        `Desconto: ${formatarPreco(produto.desconto)} (${produto.percentagem}%)`,
        colunaProduto,
        y + 5
      );
    }

    y += alturaLinha;

    pdf.setDrawColor(225, 225, 225);

    pdf.line(
      margem,
      y,
      larguraPagina - margem,
      y
    );

    y += 3;
  }

  // =====================================================
  // RESUMO FINANCEIRO DA COMPRA
  // =====================================================

  const alturaResumo =
    31 +
    7 * (
      (temDesconto ? 1 : 0) +
      (temEntrega ? 1 : 0)
    );

  y += 3;

  verificarEspaco(alturaResumo + 5);

  // Fundo do resumo

  pdf.setFillColor(240, 244, 248);

  pdf.roundedRect(
    margem,
    y - 5,
    larguraConteudo,
    alturaResumo,
    2,
    2,
    "F"
  );

  // 1. Valor original

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...cinzento);

  pdf.text(
    "Valor dos produtos sem desconto:",
    margem + 4,
    y
  );

  pdf.text(
    formatarPreco(subtotalOriginal),
    larguraPagina - margem - 4,
    y,
    { align: "right" }
  );

  y += 7;

  // 2. Desconto aplicado

  if (temDesconto) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...verde);

    pdf.text(
      "Desconto aplicado:",
      margem + 4,
      y
    );

    pdf.text(
      `- ${formatarPreco(descontoTotal)}`,
      larguraPagina - margem - 4,
      y,
      { align: "right" }
    );

    y += 7;
  }

  // 3. Valor dos produtos com desconto

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...azul);

  pdf.text(
    "Valor dos produtos com desconto:",
    margem + 4,
    y
  );

  pdf.text(
    formatarPreco(subtotalAtual),
    larguraPagina - margem - 4,
    y,
    { align: "right" }
  );

  y += 7;

  // 4. Custo de entrega

  if (temEntrega) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...cinzento);

    pdf.text(
      "Custo de entrega:",
      margem + 4,
      y
    );

    pdf.text(
      formatarPreco(custoEntrega),
      larguraPagina - margem - 4,
      y,
      { align: "right" }
    );

    y += 7;
  }

  // 5. Total final a pagar

  y += 2;

  pdf.setFillColor(...azulEscuro);

  pdf.roundedRect(
    margem + 2,
    y - 4,
    larguraConteudo - 4,
    14,
    2,
    2,
    "F"
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);

  pdf.text(
    "TOTAL A PAGAR",
    margem + 6,
    y + 5
  );

  pdf.text(
    formatarPreco(totalPagar),
    larguraPagina - margem - 6,
    y + 5,
    { align: "right" }
  );

  y += 18;

  // =====================================================
  // INFORMAÇÃO DE ENTREGA OU LEVANTAMENTO
  // =====================================================

  verificarEspaco(23);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...azulEscuro);

  pdf.text(
    temEntrega
      ? "INFORMAÇÃO DE ENTREGA"
      : "LEVANTAMENTO NO ESTABELECIMENTO",
    margem,
    y
  );

  y += 6;

  const textoEntrega = temEntrega
    ? `A compra será entregue na zona ${dados.distrito}. Custo de entrega: ${formatarPreco(custoEntrega)}.`
    : "Caso não pretenda o serviço de entrega, poderá deslocar-se ao nosso estabelecimento para levantar a sua compra. Para mais informações, contacte-nos através do WhatsApp 864 018 233.";

  adicionarTexto(
    textoEntrega,
    margem,
    larguraConteudo,
    8
  );

  // =====================================================
  // OBSERVAÇÕES
  // =====================================================

  if (dados.observacoes?.trim()) {
    verificarEspaco(12);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...azulEscuro);

    pdf.text("OBSERVAÇÕES", margem, y);

    y += 6;

    adicionarTexto(
      dados.observacoes.trim(),
      margem,
      larguraConteudo,
      8
    );
  }

  // =====================================================
  // MENSAGEM FINAL
  // =====================================================

  const mensagemFinal =
    "Agradecemos a preferência. A nossa equipa entrará em contacto para confirmar os detalhes da compra.";

  adicionarTexto(
    mensagemFinal,
    margem,
    larguraConteudo,
    8,
    cinzento
  );

  // =====================================================
  // CARIMBO NA ÚLTIMA PÁGINA
  // =====================================================

  const imagemCarimbo = await imagemCarimboPromise;

  if (imagemCarimbo) {
    const larguraCarimbo = 45;
    const alturaCarimbo = 28;

    const posicaoCarimboY = alturaPagina - 61;

    pdf.addImage(
      imagemCarimbo,
      "PNG",
      (larguraPagina - larguraCarimbo) / 2,
      posicaoCarimboY,
      larguraCarimbo,
      alturaCarimbo
    );
  }

  // =====================================================
  // RODAPÉ EM TODAS AS PÁGINAS
  // =====================================================

  const totalPaginas = pdf.getNumberOfPages();

  for (
    let pagina = 1;
    pagina <= totalPaginas;
    pagina++
  ) {
    pdf.setPage(pagina);

    pdf.setDrawColor(210, 210, 210);

    pdf.line(
      margem,
      alturaPagina - alturaRodape,
      larguraPagina - margem,
      alturaPagina - alturaRodape
    );

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...azulEscuro);

    pdf.text(
      "MSW BUSINESS | CONTACTOS",
      larguraPagina / 2,
      alturaPagina - 18,
      { align: "center" }
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...cinzento);

    pdf.text(
      "WhatsApp: 864 018 233",
      larguraPagina / 2,
      alturaPagina - 13,
      { align: "center" }
    );

    pdf.text(
      "Alto-Maé, cruzamento entre a Av. Mário Nguabi e a Rua da Guiné, Maputo.",
      larguraPagina / 2,
      alturaPagina - 8,
      { align: "center" }
    );
  }

  // =====================================================
  // GUARDAR PDF
  // =====================================================

  pdf.save(
    `Compra-${dados.orderNumber}.pdf`
  );
}


import jsPDF from "jspdf";

export interface ItemPDFEncomenda {
  nome: string;
  quantidade: number;
  preco: number;
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

async function carregarImagem(caminho: string): Promise<string | null> {
  try {
    const resposta = await fetch(caminho);

    if (!resposta.ok) return null;

    const blob = await resposta.blob();

    return await new Promise((resolve, reject) => {
      const leitor = new FileReader();

      leitor.onload = () => resolve(leitor.result as string);
      leitor.onerror = () => reject(new Error("Erro ao carregar imagem"));

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

  // Espaço reservado para o carimbo e rodapé.
  // O conteúdo não pode ultrapassar esta posição.
  const limiteConteudo = alturaPagina - 65;

  let y = 49;

  const imagemCarimboPromise = carregarImagem("/msw_carrimbo.png");

 const temEntrega =
  typeof dados.distrito === "string" &&
  dados.distrito.trim() !== "" &&
  !["A COMBINAR", "N/A"].includes(
    dados.distrito.trim().toUpperCase()
  );

  // CABEÇALHO
  const adicionarCabecalho = () => {
    pdf.setFillColor(...azulEscuro);
    pdf.rect(0, 0, larguraPagina, 38, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("MSW BUSINESS", margem, 17);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("COMPROVATIVO DE ENCOMENDA", margem, 25);

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

  // NOVA PÁGINA
  const adicionarNovaPagina = () => {
    pdf.addPage();
    adicionarCabecalho();
  };

  // VERIFICAR ESPAÇO DISPONÍVEL
  const verificarEspaco = (altura: number): boolean => {
    if (y + altura > limiteConteudo) {
      adicionarNovaPagina();
      return true;
    }

    return false;
  };

  // TEXTO COM QUEBRA AUTOMÁTICA
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

    pdf.text(linhas, x, y);

    y += linhas.length * 4 + 1.5;
  };

  // LINHA DIVISÓRIA
  const adicionarLinha = () => {
    pdf.setDrawColor(210, 210, 210);
    pdf.line(margem, y, larguraPagina - margem, y);
    y += 6;
  };

  adicionarCabecalho();

  // =====================================================
  // INFORMAÇÕES DO CLIENTE E DO ESTABELECIMENTO
  // =====================================================

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...azul);
  pdf.text("INFORMAÇÕES", margem, y);

  y += 8;

  const larguraColuna = (larguraConteudo - 12) / 2;
  const colunaEsquerda = margem;
  const colunaDireita = margem + larguraColuna + 12;

  const inicioColunas = y;

  // TÍTULO CLIENTE
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...azul);
  pdf.text("DADOS DO CLIENTE", colunaEsquerda, y);

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
    const linhas = pdf.splitTextToSize(texto, larguraColuna);

    pdf.text(linhas, colunaEsquerda, yCliente);
    yCliente += linhas.length * 4 + 1.5;
  }

  // TÍTULO DA LOJA
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...azul);
  pdf.text("MSW BUSINESS", colunaDireita, y);

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
    const linhas = pdf.splitTextToSize(texto, larguraColuna);

    pdf.text(linhas, colunaDireita, yLoja);
    yLoja += linhas.length * 4 + 1.5;
  }

  // SEPARADOR DINÂMICO
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
  // PRODUTOS ENCOMENDADOS
  // =====================================================

  verificarEspaco(17);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...azul);
  pdf.text("PRODUTOS ENCOMENDADOS", margem, y);

  y += 8;

  const colunaProduto = margem + 2;
  const colunaQuantidade = 112;
  const colunaPreco = 140;
  const colunaTotal = larguraPagina - margem - 2;

  const cabecalhoTabela = () => {
    pdf.setFillColor(...azulEscuro);
    pdf.rect(margem, y - 4.5, larguraConteudo, 8, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);

    pdf.text("Produto", colunaProduto, y);
    pdf.text("Qtd.", colunaQuantidade, y);
    pdf.text("Preço", colunaPreco, y);
    pdf.text("Total", colunaTotal, y, {
      align: "right",
    });

    y += 7;
    pdf.setTextColor(0, 0, 0);
  };

  cabecalhoTabela();

  for (const produto of dados.produtos) {
    const nomeLinhas = pdf.splitTextToSize(
      produto.nome,
      colunaQuantidade - colunaProduto - 8
    );

    const alturaLinha = Math.max(8, nomeLinhas.length * 4 + 2);

    const mudouPagina = verificarEspaco(alturaLinha + 3);

    if (mudouPagina) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(...azul);
      pdf.text("PRODUTOS ENCOMENDADOS", margem, y);

      y += 8;
      cabecalhoTabela();
    }

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);

    pdf.text(nomeLinhas, colunaProduto, y);
    pdf.text(String(produto.quantidade), colunaQuantidade, y);
    pdf.text(formatarPreco(produto.preco), colunaPreco, y);
    pdf.text(formatarPreco(produto.total), colunaTotal, y, {
      align: "right",
    });

    y += alturaLinha;

    pdf.setDrawColor(225, 225, 225);
    pdf.line(margem, y, larguraPagina - margem, y);

    y += 3;
  }

  // =====================================================
  // TOTAL DA ENCOMENDA
  // =====================================================

  verificarEspaco(21);

  y += 2;

  pdf.setFillColor(240, 244, 248);
  pdf.roundedRect(margem, y - 4, larguraConteudo, 15, 2, 2, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...azulEscuro);

  pdf.text("TOTAL DA ENCOMENDA", margem + 4, y + 5);
  pdf.text(
    formatarPreco(dados.total),
    larguraPagina - margem - 4,
    y + 5,
    { align: "right" }
  );

  y += 17;

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
    ? `A encomenda será entregue na zona ${dados.distrito}. Custo de entrega: ${formatarPreco(dados.entrega)}.`
    : "Caso não pretenda o serviço de entrega, poderá deslocar-se ao nosso estabelecimento para levantar a sua encomenda. Para mais informações, contacte-nos através do WhatsApp 864 018 233.";

  adicionarTexto(textoEntrega, margem, larguraConteudo, 8);

  // =====================================================
  // OBSERVAÇÕES
  // =====================================================

  if (dados.observacoes?.trim()) {
    verificarEspaco(15);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...azulEscuro);
    pdf.text("OBSERVAÇÕES", margem, y);

    y += 6;

    const observacoes = pdf.splitTextToSize(
      dados.observacoes,
      larguraConteudo
    );

    verificarEspaco(observacoes.length * 4 + 4);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    pdf.text(observacoes, margem, y);

    y += observacoes.length * 4 + 4;
  }

  // =====================================================
  // MENSAGEM FINAL
  // =====================================================

  verificarEspaco(12);

  const mensagemFinal =
    "Agradecemos a preferência. A nossa equipa entrará em contacto para confirmar os detalhes da encomenda.";

  const linhasMensagem = pdf.splitTextToSize(
    mensagemFinal,
    larguraConteudo
  );

  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8);
  pdf.setTextColor(...cinzento);
  pdf.text(linhasMensagem, margem, y);

  // =====================================================
  // CARIMBO NO FINAL DA ÚLTIMA PÁGINA
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

  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    pdf.setPage(pagina);

    pdf.setDrawColor(210, 210, 210);
    pdf.line(
      margem,
      alturaPagina - 23,
      larguraPagina - margem,
      alturaPagina - 23
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

  pdf.save(`Encomenda-${dados.orderNumber}.pdf`);
}

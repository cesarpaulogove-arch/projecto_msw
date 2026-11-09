
import nodemailer from "nodemailer";

interface CampoNotificacao {
  nome: string;
  valor: string | number;
}

interface ItemNotificacao {
  nome: string;
  quantidade: number;
  preco?: string | number;
  subtotal?: string | number;
  iva?: string | number;
  total?: string | number;
}

interface NotificacaoEmail {
  tipo: "NOVA ENCOMENDA" | "NOVA COTACAO";
  referencia: string;
  cliente: string;
  campos: CampoNotificacao[];
  itens: ItemNotificacao[];
}

function escaparHTML(valor: string | number): string {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function enviarNotificacaoEmail(
  dados: NotificacaoEmail
): Promise<boolean> {
  const remetente = process.env.EMAIL_REMETENTE;
  const destinatario = process.env.EMAIL_DESTINO;
  const utilizador = process.env.EMAIL_SMTP_USER;
  const password = process.env.EMAIL_SMTP_PASSWORD;

  const host = process.env.EMAIL_SMTP_HOST || "smtp.gmail.com";
const porta = Number(process.env.EMAIL_SMTP_PORT || 587);

if (
  !remetente ||
  !destinatario ||
  !utilizador ||
  !password ||
  ![465, 587].includes(porta)
) {
  console.error(
    "NOTIFICAÇÃO EMAIL: Configuração SMTP incompleta ou inválida."
  );

  return false;
}
  const transporter = nodemailer.createTransport({
    host,
    port: porta,
    secure: porta === 465,
    requireTLS: porta === 587,

    auth: {
      user: utilizador,
      pass: password,
    },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  const camposHTML = dados.campos
    .map(
      (campo) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee;color:#555;">
            ${escaparHTML(campo.nome)}
          </td>
          <td style="padding:10px;border-bottom:1px solid #eee;font-weight:600;">
            ${escaparHTML(campo.valor)}
          </td>
        </tr>
      `
    )
    .join("");

  const itensHTML = dados.itens
    .map(
      (item) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee;">
            ${escaparHTML(item.nome)}
          </td>

          <td style="padding:10px;text-align:center;border-bottom:1px solid #eee;">
            ${escaparHTML(item.quantidade)}
          </td>

          <td style="padding:10px;text-align:right;border-bottom:1px solid #eee;">
            ${escaparHTML(item.preco ?? "-")}
          </td>

          <td style="padding:10px;text-align:right;border-bottom:1px solid #eee;">
            ${escaparHTML(item.subtotal ?? "-")}
          </td>

          <td style="padding:10px;text-align:right;border-bottom:1px solid #eee;">
            ${escaparHTML(item.iva ?? "-")}
          </td>

          <td style="padding:10px;text-align:right;border-bottom:1px solid #eee;">
            ${escaparHTML(item.total ?? "-")}
          </td>
        </tr>
      `
    )
    .join("");

  const textoCampos = dados.campos
    .map(
      (campo) => `${campo.nome}: ${campo.valor}`
    )
    .join("\n");

  const textoItens = dados.itens
    .map(
      (item) =>
        `${item.nome} | Quantidade: ${item.quantidade} | Preço: ${item.preco ?? "-"} | Subtotal: ${item.subtotal ?? "-"} | IVA: ${item.iva ?? "-"} | Total: ${item.total ?? "-"}`
    )
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:750px;margin:auto;color:#222;">

      <div style="background:#10251b;padding:25px;color:white;">
        <h2 style="margin:0;color:#d7ef4d;">MSW BUSINESS</h2>
        <p style="margin-bottom:0;">
          Notificação de actividade comercial
        </p>
      </div>

      <div style="padding:25px;border:1px solid #eee;">

        <h2>${escaparHTML(dados.tipo)}</h2>

        <p>
          Foi registado um novo pedido na plataforma MSW BUSINESS.
        </p>

        <p>
          <strong>Referência:</strong>
          ${escaparHTML(dados.referencia)}
        </p>

        <p>
          <strong>Cliente:</strong>
          ${escaparHTML(dados.cliente)}
        </p>

        <h3>Dados do pedido</h3>

        <table style="width:100%;border-collapse:collapse;">
          ${camposHTML}
        </table>

        <h3 style="margin-top:25px;">
          Produtos solicitados
        </h3>

        <table style="width:100%;border-collapse:collapse;font-size:12px;">

          <thead>
            <tr style="background:#f2f5ed;">
              <th style="padding:10px;text-align:left;">Produto</th>
              <th style="padding:10px;">Qtd.</th>
              <th style="padding:10px;text-align:right;">Preço</th>
              <th style="padding:10px;text-align:right;">Subtotal</th>
              <th style="padding:10px;text-align:right;">IVA</th>
              <th style="padding:10px;text-align:right;">Total</th>
            </tr>
          </thead>

          <tbody>
            ${itensHTML}
          </tbody>

        </table>

        <p style="margin-top:30px;color:#777;font-size:12px;">
          Esta é uma notificação automática da plataforma MSW BUSINESS.
        </p>

      </div>
    </div>
  `;

  const texto = `
MSW BUSINESS- ${dados.tipo}

Referência: ${dados.referencia}
Cliente: ${dados.cliente}

DADOS DO PEDIDO
${textoCampos}

PRODUTOS
${textoItens}
  `;

  try {
    const resultado = await transporter.sendMail({
      from: {
        name: "MSW BUSINESS",
        address: remetente,
      },

      to: destinatario,

      subject: `${dados.tipo} - ${dados.referencia}`,

      html,
      text: texto,
    });

    if (!resultado.accepted.length) {
      console.error(
        "NOTIFICAÇÃO EMAIL: Nenhum destinatário aceitou o email.",
        resultado.rejected
      );

      return false;
    }

    console.log(
      `NOTIFICAÇÃO EMAIL ENVIADA: ${dados.referencia}`
    );

    return true;

  } catch (error) {
    console.error(
      "ERRO AO ENVIAR NOTIFICAÇÃO SMTP:",
      error
    );

    return false;
  }
}

"use client";

/**
 * Tokenização de cartão no navegador.
 *
 * O número, o CVV e a validade vão direto para o Pagar.me com a chave pública.
 * O servidor do AgendamentoON recebe apenas o token de uso único.
 */

export type CardInput = {
  number: string;
  holderName: string;
  expMonth: string;
  expYear: string;
  cvv: string;
};

export class CardTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CardTokenError";
  }
}

export async function tokenizeCard(
  publicKey: string,
  card: CardInput,
): Promise<string> {
  if (!publicKey) {
    throw new CardTokenError(
      "Pagamento com cartão indisponível: a chave pública do Pagar.me não foi configurada.",
    );
  }

  const number = card.number.replace(/\D/g, "");
  const cvv = card.cvv.replace(/\D/g, "");
  const expMonth = card.expMonth.replace(/\D/g, "");
  const expYear = card.expYear.replace(/\D/g, "");
  const holderName = card.holderName.trim();

  if (number.length < 13 || number.length > 19) {
    throw new CardTokenError("Confira o número do cartão.");
  }
  if (holderName.length < 3) {
    throw new CardTokenError("Informe o nome impresso no cartão.");
  }
  if (Number(expMonth) < 1 || Number(expMonth) > 12) {
    throw new CardTokenError("Mês de validade inválido.");
  }
  if (expYear.length !== 4 && expYear.length !== 2) {
    throw new CardTokenError("Ano de validade inválido.");
  }
  if (cvv.length < 3 || cvv.length > 4) {
    throw new CardTokenError("CVV inválido.");
  }

  let response: Response;
  try {
    response = await fetch(
      `https://api.pagar.me/core/v5/tokens?appId=${encodeURIComponent(publicKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "card",
          card: {
            number,
            holder_name: holderName,
            exp_month: Number(expMonth),
            exp_year: expYear.length === 2 ? Number(`20${expYear}`) : Number(expYear),
            cvv,
          },
        }),
      },
    );
  } catch {
    throw new CardTokenError(
      "Não foi possível validar o cartão agora. Verifique sua conexão e tente novamente.",
    );
  }

  if (!response.ok) {
    throw new CardTokenError(
      "O Pagar.me recusou os dados do cartão. Confira número, validade e CVV.",
    );
  }

  const body = (await response.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) {
    throw new CardTokenError("Não foi possível tokenizar o cartão. Tente novamente.");
  }
  return body.id;
}

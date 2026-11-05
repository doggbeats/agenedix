import { randomUUID } from "node:crypto";
import { createInfinitePayLink, InfinitePayError } from "../src/lib/payments/infinitepay";

async function main() {
  const orderNsu = `agendamentoon-teste-${randomUUID()}`;
  try {
    const link = await createInfinitePayLink({
      orderNsu,
      amountCents: 100,
      description: "Teste de integracao AgendamentoON (nao pague)",
      redirectUrl: "http://localhost:3000/checkout/retorno",
      webhookUrl: "http://localhost:3000/api/webhooks/infinitepay",
    });
    console.log(JSON.stringify({ ok: true, orderNsu, url: link.url }, null, 2));
  } catch (error) {
    if (error instanceof InfinitePayError) {
      console.log(
        JSON.stringify(
          { ok: false, status: error.status, message: error.message, details: error.details },
          null,
          2,
        ),
      );
    } else {
      console.log(JSON.stringify({ ok: false, message: String(error) }, null, 2));
    }
  }
}

main();

async function main() {
  const apiKey = process.env.INFINITEPAY_API_KEY?.trim() ?? "";
  const orderNsu = `agendamentoon-teste-${Date.now()}`;
  const response = await fetch("https://api.checkout.infinitepay.io/links", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({
      order_nsu: orderNsu,
      redirect_url: "http://localhost:3000/checkout/retorno",
      webhook: { url: "http://localhost:3000/api/webhooks/infinitepay", events: ["paid"] },
      items: [
        {
          quantity: 1,
          price: 100,
          description: "Teste de integracao AgendamentoON (nao pague)",
        },
      ],
    }),
  });

  const text = await response.text();
  console.log(response.status);
  console.log(text.slice(0, 800));
}

main();

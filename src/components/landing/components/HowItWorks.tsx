import React from "react";

const steps = [
  {
    number: "01",
    title: "Crie a conta",
    description:
      "Escolha o plano, cadastre o estabelecimento e defina quem vai acessar o painel.",
  },
  {
    number: "02",
    title: "Configure a operação",
    description:
      "Serviços, profissionais, jornada, pausas, bloqueios e horários de funcionamento.",
  },
  {
    number: "03",
    title: "Compartilhe o link",
    description:
      "Coloque na bio, no WhatsApp e no Google. O cliente escolhe o horário e agenda sozinho.",
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="como-funciona" className="border-b border-line bg-surface py-20 sm:py-28">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="eyebrow">Como funciona</p>
          <h2 className="display-title mt-4 text-3xl text-ink sm:text-4xl lg:text-[44px]">
            Da conta criada ao primeiro horário.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            O primeiro acesso é guiado em cinco etapas. Você não precisa configurar tudo
            antes de começar a testar.
          </p>
        </div>

        <ol className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-0">
          {steps.map((step, index) => (
            <li
              key={step.number}
              className={`relative sm:px-7 ${
                index < steps.length - 1 ? "sm:border-r sm:border-line" : ""
              } ${index === 0 ? "sm:pl-0" : ""}`}
            >
              <span className="font-mono text-[11px] font-medium tracking-[0.18em] text-brand">
                {step.number}
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold tracking-tight text-ink">
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-muted">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

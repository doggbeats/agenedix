"use client";

import React, { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { supportWhatsAppUrl } from "@/lib/public-config";
import { FAQ_ITEMS } from "../data/mockData";

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const supportUrl = supportWhatsAppUrl(
    "Olá! Tenho uma dúvida sobre o AgendamentoON.",
  );

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="border-b border-line bg-surface py-20 sm:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow">Dúvidas</p>
          <h2 className="display-title mt-4 text-3xl text-ink sm:text-4xl">
            O que costuma aparecer antes do teste.
          </h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted">
            Respostas diretas sobre cobrança, configuração e o que o sistema faz ou não
            faz no dia a dia.
          </p>

          {supportUrl && (
            <a
              href={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-[10px] border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-slate-300"
            >
              <MessageCircle className="h-4 w-4 text-brand" aria-hidden />
              Falar com o suporte
            </a>
          )}
        </div>

        <div className="divide-y divide-line border-t border-line">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;

            return (
              <div key={item.q}>
                <h3>
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-start justify-between gap-6 py-5 text-left"
                  >
                    <span className="text-[14px] font-semibold leading-relaxed text-ink sm:text-[15px]">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`mt-0.5 h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    />
                  </button>
                </h3>

                {isOpen && (
                  <div
                    id={panelId}
                    className="animate-in fade-in slide-in-from-top-1 max-w-2xl pb-5 pr-8 text-[13px] leading-relaxed text-slate-600"
                  >
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

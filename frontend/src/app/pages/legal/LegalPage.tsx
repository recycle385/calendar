import { ArrowLeft, FileCheck2, MessageCircle, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { Footer } from "../../../shared/ui/Footer";
import { Header } from "../../../shared/ui/Header";
import { shellClass } from "../../../shared/ui/styles";
import { useAuth } from "../../providers/AuthProvider";
import type { LegalDocument } from "./legalDocuments";

interface LegalPageProps {
  document: LegalDocument;
}

export function LegalPage({ document }: LegalPageProps) {
  const { logout, status, user } = useAuth();
  const isPrivacy = document.kind === "privacy";
  const DocumentIcon = isPrivacy ? ShieldCheck : FileCheck2;

  return (
    <div className="min-h-screen bg-[linear-gradient(145deg,#f7fbff_0%,#fff_42%,#f4f8ff_100%)]">
      <Header
        isAuthenticated={status === "authenticated"}
        displayName={user?.nickname}
        onLogout={logout}
      />

      <main className={`${shellClass} py-12 max-md:py-8`}>
        <Link
          className="mb-7 inline-flex items-center gap-2 text-[15px] font-bold text-[#667b9b] transition-colors hover:text-brand-500"
          to="/"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          홈으로 돌아가기
        </Link>

        <header className="relative overflow-hidden rounded-[28px] border border-[#dce8f6] bg-white px-[clamp(24px,5vw,64px)] py-[clamp(36px,6vw,70px)] shadow-[0_22px_55px_rgba(55,96,150,0.09)]">
          <div className="relative z-10 max-w-[760px]">
            <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-500">
              <DocumentIcon size={28} strokeWidth={2.2} aria-hidden="true" />
            </div>
            <p className="mb-3 text-xs font-black tracking-[0.24em] text-[#5d77a0]">
              {document.eyebrow}
            </p>
            <h1 className="m-0 text-[clamp(36px,5vw,54px)] font-black tracking-[-0.06em] text-ink-900">
              {document.title}
            </h1>
            <p className="mt-5 mb-0 text-[clamp(16px,2vw,19px)] leading-[1.75] text-[#647895]">
              {document.description}
            </p>
            <p className="mt-6 mb-0 inline-flex rounded-full bg-[#f1f6fd] px-4 py-2 text-sm font-bold text-[#526d94]">
              시행일 · {document.effectiveDate}
            </p>
          </div>
          <span
            className="absolute -right-24 -bottom-36 size-[360px] rounded-full bg-[radial-gradient(circle,#d9eaff_0%,rgba(232,243,255,0)_70%)]"
            aria-hidden="true"
          />
        </header>

        <div className="mt-8 grid grid-cols-[250px_minmax(0,1fr)] items-start gap-7 max-[900px]:grid-cols-1">
          <aside className="sticky top-[96px] rounded-[18px] border border-[#e0eaf5] bg-white p-5 shadow-[0_14px_34px_rgba(65,104,153,0.06)] max-[900px]:static">
            <p className="mt-0 mb-3 text-xs font-black tracking-[0.18em] text-[#8799b4]">
              CONTENTS
            </p>
            <nav
              className="grid gap-1 max-[900px]:grid-cols-2 max-sm:grid-cols-1"
              aria-label={`${document.title} 목차`}
            >
              {document.sections.map((section) => (
                <a
                  className="rounded-[10px] px-3 py-2.5 text-sm font-bold leading-[1.45] text-[#596f90] transition-colors hover:bg-brand-50 hover:text-brand-500"
                  href={`#${section.id}`}
                  key={section.id}
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <article className="min-w-0 rounded-[22px] border border-[#e0eaf5] bg-white px-[clamp(22px,5vw,54px)] py-[clamp(28px,5vw,52px)] shadow-[0_18px_46px_rgba(65,104,153,0.07)]">
            <div className="mb-9 rounded-2xl border border-[#dce9fa] bg-[#f4f8ff] px-5 py-4 text-[15px] leading-7 text-[#526b90]">
              {document.notice}
            </div>

            <div className="grid gap-0">
              {document.sections.map((section, index) => (
                <section
                  className={`scroll-mt-28 py-9 first:pt-0 last:pb-0 ${index < document.sections.length - 1 ? "border-b border-[#e8eef6]" : ""}`}
                  id={section.id}
                  key={section.id}
                >
                  <h2 className="mt-0 mb-5 text-[clamp(20px,2.4vw,25px)] font-black tracking-[-0.04em] text-[#17345f]">
                    {section.title}
                  </h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p
                      className="my-0 text-[16px] leading-[1.9] text-[#596d8b] [&+&]:mt-3"
                      key={paragraph}
                    >
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets ? (
                    <ul className="my-0 grid gap-3 pl-5 text-[16px] leading-[1.8] text-[#596d8b] marker:text-brand-500">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>

            <div className="mt-11 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#102650] px-6 py-5 text-white">
              <div>
                <p className="m-0 text-sm font-bold text-[#bcd0ef]">더 궁금한 점이 있나요?</p>
                <p className="mt-1 mb-0 text-[17px] font-extrabold">GitHub에서 문의를 남겨주세요.</p>
              </div>
              <a
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-white px-5 text-sm font-extrabold text-[#17345f] transition-transform hover:-translate-y-px"
                href="https://github.com/recycle385/calendar/issues"
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={17} aria-hidden="true" />
                문의하기
              </a>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}

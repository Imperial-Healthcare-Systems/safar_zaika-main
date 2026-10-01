import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Accordion, Badge } from "@/components/ui";
import { ContactForm, PartnerCta } from "@/components/info/InfoExtras";
import { infoPages, infoSlugs } from "@/data/infoPages";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return infoSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = infoPages[slug];
  return page ? { title: page.title, description: page.intro } : {};
}

export default async function InfoPage({ params }: Props) {
  const { slug } = await params;
  const page = infoPages[slug];
  if (!page) notFound();

  return (
    <>
      <PageHeader compact title={page.title} description={page.intro}>
        {page.draft && (
          <Badge tone="gold" className="mt-6">
            Draft — placeholder for the prototype
          </Badge>
        )}
      </PageHeader>
      <article className="container-x py-12 sm:py-16">
        <div className="max-w-3xl text-[17px] leading-relaxed text-cocoa-800">
          {page.sections.map((s) => (
            <section key={s.heading} className="mt-10 first:mt-0">
              <h2 className="font-display text-2xl text-cocoa-900 sm:text-3xl">{s.heading}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-4">
                  {p}
                </p>
              ))}
            </section>
          ))}
          {page.faqs && (
            <section className="mt-12">
              <h2 className="font-display text-2xl text-cocoa-900 sm:text-3xl">Frequently asked</h2>
              <Accordion items={page.faqs} className="mt-4" />
            </section>
          )}
          {slug === "contact" && <ContactForm />}
          {slug === "partner" && <PartnerCta />}
        </div>
      </article>
    </>
  );
}

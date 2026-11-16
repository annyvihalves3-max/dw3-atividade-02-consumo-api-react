import Head from "next/head";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import HomeContent from "@/components/HomeContent";

export default function Home() {
  return (
    <>
      <Head>
        <title>Roteiros Brasil</title>
        <meta
          name="description"
          content="Catálogo de destinos turísticos com dados da API da Wikipédia"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Menu />
        <HomeContent />
      </main>
      <Footer />
    </>
  );
}

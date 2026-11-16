import Head from "next/head";
import { useRouter } from "next/router";
import Container from "@/components/Container";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";
import DetailsContent from "@/components/DetailsContent";

// Página de detalhes ("/destino/[id]"): busca o item na API pelo identificador
export default function Destino() {
  const router = useRouter();
  // O id só existe depois que o router estiver pronto
  const { id } = router.query;

  return (
    <>
      <Head>
        <title>Detalhes do destino | Roteiros Brasil</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Menu />
        <Container>
          <DetailsContent id={id} />
        </Container>
      </main>
      <Footer />
    </>
  );
}

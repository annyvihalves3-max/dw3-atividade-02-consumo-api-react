import styles from "@/components/Footer/Footer.module.css";

const Footer = () => {
  return (
    <footer>
      <div className={styles.footerContent}>
        <p>Roteiros Brasil &copy; 2026</p>
        <p>Dados e imagens: Wikipédia (CC BY-SA)</p>
      </div>
    </footer>
  );
};

export default Footer;

import styles from "./Loading.module.css";

const Loading = ({ loading }) => {
  if (!loading) return null;
  return (
    <div className={styles.loadingContainer} role="status">
      <div className={styles.spinner} />
      <p>Carregando destinos...</p>
    </div>
  );
};

export default Loading;

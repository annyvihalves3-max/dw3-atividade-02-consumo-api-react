import { useState } from "react";
import Link from "next/link";
import { FaBars, FaCompass } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import styles from "@/components/Menu/Menu.module.css";

const Menu = () => {
  const [isActive, setIsActive] = useState(false);

  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.logo}>
        <FaCompass />
        <span>
          Roteiros<strong>Brasil</strong>
        </span>
      </Link>

      <ul className={`${styles.menuItems} ${isActive ? styles.active : ""}`}>
        <li>
          <Link href="/" onClick={() => setIsActive(false)}>
            Início
          </Link>
        </li>
      </ul>

      <i className={styles.menuIcon} onClick={() => setIsActive(!isActive)}>
        {isActive ? <IoClose /> : <FaBars />}
      </i>
    </nav>
  );
};

export default Menu;

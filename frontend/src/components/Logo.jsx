import { Link } from '../lib/router.jsx';

export default function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Signature Liquor Store home">
      <span className="logo-mark">S</span>
      <span className="logo-text">
        <b>Signature</b>
        <span>Liquor Store</span>
      </span>
    </Link>
  );
}

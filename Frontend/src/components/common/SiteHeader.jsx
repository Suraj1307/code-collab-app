import { Link } from "react-router-dom"

export function SiteHeader() {
  return <header className="site-header"><Link className="brand" to="/"><span className="brand-mark">C</span>Code Collab</Link><nav className="site-nav"><Link to="/">Home</Link></nav></header>
}

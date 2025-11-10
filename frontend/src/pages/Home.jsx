import ProductList from "../components/ProductList";

export default function Home() {
  return (
    <div>
      <h1 style={{ textAlign: "center", marginTop: "1rem" }}>
        🏬 Bienvenido al Centro Comercial TEI
      </h1>
      <ProductList />
    </div>
  );
}

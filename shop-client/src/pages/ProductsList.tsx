import { useEffect, useState } from "react";
import { fetchProducts } from "../api/products-api";
import Loader from "../components/Loader";
import ProductCard from "../components/ProductCard";

type Product = {
  id: string;
  title: string;
  price: number;
  image?: string;
  commentsCount: number;
};

const ProductsList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  
  useEffect(() => {
  fetchProducts()
    .then(data => setProducts(data))
    .finally(() => setLoading(false));
}, []);


  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) &&
    (!priceFrom || p.price >= Number(priceFrom)) &&
    (!priceTo || p.price <= Number(priceTo))
  );

  return (
    <div style={{ padding: "20px" }}>
      <h1>Список товаров ({products.length})</h1>

      <div>
        <input placeholder="Поиск по названию" value={search} onChange={e => setSearch(e.target.value)} />
        <input placeholder="Цена от" type="number" value={priceFrom} onChange={e => setPriceFrom(e.target.value)} />
        <input placeholder="Цена до" type="number" value={priceTo} onChange={e => setPriceTo(e.target.value)} />
      </div>

      {loading ? <Loader /> : filtered.map(p => <ProductCard key={p.id} {...p} />)}
    </div>
  );
};

export default ProductsList;
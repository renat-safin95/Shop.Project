import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStats } from "../api/products-api";
import Loader from "../components/Loader";

const Home = () => {
  const [stats, setStats] = useState<{ count: number; totalPrice: number } | null>(null);
  const navigate = useNavigate();

//   useEffect(() => {
//   fetchStats().then(data => setStats(data));
// }, []);

  useEffect(() => {
    console.log("Home component: Starting fetchStats...");
    fetchStats()
      .then(data => {
        console.log("Home component: fetchStats success, data:", data);
        setStats({
          count: Number(data.count || 0),
          totalPrice: Number(data.totalPrice || 0),
        });
      })
      .catch(err => {
        console.error("Home component: fetchStats error", err);
        setStats({ count: 0, totalPrice: 0 });
      });
  }, []);


  if (!stats) return <Loader />;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Shop.Client</h1>
      <p>
        В базе данных находится {stats.count} товаров общей стоимостью {stats.totalPrice}
      </p>
      <button onClick={() => navigate("/products-list")}>Перейти к списку товаров</button>
      <button onClick={() => window.open("/admin", "_blank")}>
        Перейти в систему администрирования
      </button>
    </div>
  );
};

export default Home;

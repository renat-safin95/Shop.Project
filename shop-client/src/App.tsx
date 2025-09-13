import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ProductsList from "./pages/ProductsList";
import ProductDetails from "./pages/ProductDetails";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products-list" element={<ProductsList />} />
        <Route path="/:id" element={<ProductDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
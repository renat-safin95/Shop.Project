import { useNavigate } from "react-router-dom";

type Props = {
  id: string;
  title: string;
  price: number;
  image?: string;
  commentsCount: number;
};

const ProductCard = ({ id, title, price, image, commentsCount }: Props) => {
  const navigate = useNavigate();
  return (
    <div style={{ cursor: "pointer", margin: "10px 0" }} onClick={() => navigate(`/${id}`)}>
      <h3>{title}</h3>
      <img src={image || "/placeholder.png"} alt={title} width={100} />
      <p>Цена: {price}</p>
      <p>Комментарии: {commentsCount}</p>
    </div>
  );
};

export default ProductCard;
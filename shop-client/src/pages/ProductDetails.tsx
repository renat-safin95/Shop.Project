import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchProductById, fetchComments, addComment } from "../api/products-api";
import Loader from "../components/Loader";
import CommentForm from "../components/CommentForm";

type Comment = { title: string; email: string; body: string };

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchProductById(id), fetchComments(id)]).then(([prodRes, commentsRes]) => {
      setProduct(prodRes.data);
      setComments(commentsRes.data);
      setLoading(false);
    });
  }, [id]);

  const handleAddComment = (comment: Comment) => {
    if (!id) return;
    addComment(id, comment).then(res => setComments(prev => [...prev, res.data]));
  };

  if (loading) return <Loader />;
  if (!product) return <p>Товар не найден</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>{product.title}</h1>
      <img src={product.image || "/placeholder.png"} alt={product.title} width={200} />
      <p>{product.description}</p>
      <p>Цена: {product.price}</p>

      <h3>Комментарии</h3>
      {comments.map((c, idx) => (
        <div key={idx}>
          <h4>{c.title}</h4>
          <p>{c.email}</p>
          <p>{c.body}</p>
        </div>
      ))}

      <h3>Добавить комментарий</h3>
      <CommentForm onSubmit={handleAddComment} />
    </div>
  );
};

export default ProductDetails;
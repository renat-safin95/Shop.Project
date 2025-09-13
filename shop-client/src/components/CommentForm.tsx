import { useState } from "react";

type Props = {
  onSubmit: (comment: { title: string; email: string; body: string }) => void;
};

const CommentForm = ({ onSubmit }: Props) => {
  const [form, setForm] = useState({ title: "", email: "", body: "" });

  const handleSubmit = () => {
    if (!form.title || !form.email || !form.body) return;
    onSubmit(form);
    setForm({ title: "", email: "", body: "" });
  };

  return (
    <div>
      <input placeholder="Заголовок" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
      <input placeholder="E-mail" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
      <textarea placeholder="Текст" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
      <button onClick={handleSubmit}>Сохранить</button>
    </div>
  );
};

export default CommentForm;
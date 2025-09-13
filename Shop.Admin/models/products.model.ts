import axios from "axios";
import { IProduct, IProductFilterPayload } from "@Shared/types";
import { IProductEditData } from "../types";
import { API_HOST } from "./const";

export async function getProducts(): Promise<IProduct[]> {
  const { data } = await axios.get<IProduct[]>(`${API_HOST}/products`);
  return data || [];
}

export async function searchProducts(
  filter: IProductFilterPayload
): Promise<IProduct[]> {
  const { data } = await axios.get<IProduct[]>(
    `${API_HOST}/products/search`,
    { params: filter }
  );
  return data || [];
}

export async function getProduct(
  id: string
): Promise<IProduct | null> {
  try {
    const { data } = await axios.get<IProduct>(
      `${API_HOST}/products/${id}`
    );

    const { data: relatedProducts } = await axios.get<IProduct[]>(
      `${API_HOST}/products/${id}/related`
    );

    return {
      ...data,
      related: relatedProducts
    };
  } catch (e) {
    return null;
  }
}

export async function getRelatedProducts(productId: string): Promise<IProduct[]> {
  const { data } = await axios.get<IProduct[]>(`${API_HOST}/products/${productId}/related`);
  return data || [];
}

export async function addRelatedProducts(productId: string, relatedIds: string[]): Promise<void> {
  await axios.post(`${API_HOST}/products/${productId}/related/add`, { relatedIds });
}

export async function removeRelatedProducts(productId: string, relatedIds: string[]): Promise<void> {
  await axios.post(`${API_HOST}/products/${productId}/related/remove`, { relatedIds });
}

export async function removeProduct(id: string): Promise<void> {
  await axios.delete(`${API_HOST}/products/${id}`);
}

function splitNewImages(str = ""): string[] {
  return str
    .split(/\r\n|,/g)
    .map(url => url.trim())
    .filter(url => url);
}

function compileIdsToRemove(data: string | string[]): string[] {
  if (typeof data === "string") return [data];
  return data;
}

export async function updateProduct(
  productId: string,
  formData: IProductEditData
): Promise<IProduct | null> {
  try {
    const { data: currentProduct } = await axios.get<IProduct>(`${API_HOST}/products/${productId}`);

    if (formData.commentsToRemove) {
      const commentsIdsToRemove = compileIdsToRemove(formData.commentsToRemove);
      const deleteActions = commentsIdsToRemove.map(commentId => 
        axios.delete(`${API_HOST}/comments/${commentId}`)
      );
      await Promise.all(deleteActions);
    }

    if (formData.imagesToRemove) {
      const imagesIdsToRemove = compileIdsToRemove(formData.imagesToRemove);
      await axios.post(`${API_HOST}/products/remove-images`, imagesIdsToRemove);
    }

    if (formData.newImages) {
      const urls = splitNewImages(formData.newImages);
      const images = urls.map(url => ({ url, main: false }));
      if (!currentProduct.thumbnail && images.length > 0) {
        images[0].main = true;
      }
      await axios.post(`${API_HOST}/products/add-images`, { productId, images });
    }

    if (formData.mainImage && formData.mainImage !== currentProduct.thumbnail?.id) {
      await axios.post(`${API_HOST}/products/update-thumbnail/${productId}`, {
        newThumbnailId: formData.mainImage
      });
    }

    if (formData.relatedToRemove) {
      const relatedIdsToRemove = compileIdsToRemove(formData.relatedToRemove);
      await removeRelatedProducts(productId, relatedIdsToRemove);
    }

    if (formData.relatedToAdd) {
      const relatedIdsToAdd = compileIdsToRemove(formData.relatedToAdd);
      await addRelatedProducts(productId, relatedIdsToAdd);
    }

    await axios.patch(`${API_HOST}/products/${productId}`, {
      title: formData.title,
      description: formData.description,
      price: Number(formData.price)
    });

    const updatedRelated = await getRelatedProducts(productId);
    return { ...currentProduct, related: updatedRelated };

  } catch (e) {
    console.log(e);
    return null;
  }
}

export async function createProduct(productData: {
  name: string;
  description: string;
  price: number;
}): Promise<IProduct> {
  const response = await axios.post<IProduct>(
    "http://localhost:3000/products",
    productData
  );
  return response.data;
}
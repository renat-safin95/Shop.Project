declare module 'express-session' {
  export interface SessionData {
    username?: string;
  }
}

export interface IProductEditData {
  title: string;
  description: string;
  price: string;
  mainImage: string;
  newImages?: string;
  commentsToRemove: string | string[];
  imagesToRemove: string | string[];
  relatedToAdd?: string | string[];
  relatedToRemove?: string | string[];
}

export interface INewProductData {
  name: string;
  description: string;
  price: number;
}

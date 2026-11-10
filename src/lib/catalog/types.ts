export type Variant = {
  id: string;
  title: string;
  price: number;
  available: boolean;
  quantity: number | null;
  sku: string | null;
  options: { name: string; value: string }[];
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  brand: string;
  type: string;
  tags: string[];
  priceMin: number;
  priceMax: number;
  available: boolean;
  totalInventory: number | null;
  imageUrl: string | null;
  images: { url: string; alt: string | null }[];
  variants: Variant[];
  // Attached from the review database, not Shopify. null = no reviews (or DB unavailable).
  rating: { average: number; count: number } | null;
};

export type Collection = {
  handle: string;
  title: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string | null;
};

export interface CatalogProvider {
  listProducts(): Promise<Product[]>;
  getProduct(handle: string): Promise<Product | null>;
  listCollections(): Promise<Collection[]>;
  getCollectionProducts(handle: string): Promise<Product[] | null>;
}

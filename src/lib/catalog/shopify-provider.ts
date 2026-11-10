import { shopifyFetch } from "@/lib/shopify";
import type { CatalogProvider, Collection, Product } from "./types";

const PRODUCT_FIELDS = `
  id handle title description vendor productType tags
  totalInventory availableForSale
  featuredImage { url }
  images(first: 8) { nodes { url altText } }
  priceRange {
    minVariantPrice { amount }
    maxVariantPrice { amount }
  }
  variants(first: 10) {
    nodes {
      id title sku availableForSale quantityAvailable
      price { amount }
      selectedOptions { name value }
    }
  }
`;

const COLLECTION_FIELDS = `handle title description image { url altText }`;

type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  vendor: string;
  productType: string;
  tags: string[];
  totalInventory: number | null;
  availableForSale: boolean;
  featuredImage: { url: string } | null;
  images: { nodes: { url: string; altText: string | null }[] };
  priceRange: {
    minVariantPrice: { amount: string };
    maxVariantPrice: { amount: string };
  };
  variants: {
    nodes: {
      id: string;
      title: string;
      sku: string | null;
      availableForSale: boolean;
      quantityAvailable: number | null;
      price: { amount: string };
      selectedOptions: { name: string; value: string }[];
    }[];
  };
};

type ShopifyCollection = {
  handle: string;
  title: string;
  description: string;
  image: { url: string; altText: string | null } | null;
};

function toProduct(p: ShopifyProduct): Product {
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    description: p.description,
    brand: p.vendor,
    type: p.productType,
    tags: p.tags,
    priceMin: Number(p.priceRange.minVariantPrice.amount),
    priceMax: Number(p.priceRange.maxVariantPrice.amount),
    available: p.availableForSale,
    totalInventory: p.totalInventory,
    imageUrl: p.featuredImage?.url ?? null,
    images: p.images.nodes.map((i) => ({ url: i.url, alt: i.altText })),
    variants: p.variants.nodes.map((v) => ({
      id: v.id,
      title: v.title,
      price: Number(v.price.amount),
      available: v.availableForSale,
      quantity: v.quantityAvailable,
      sku: v.sku,
      options: v.selectedOptions,
    })),
    rating: null,
  };
}

function toCollection(c: ShopifyCollection): Collection {
  return {
    handle: c.handle,
    title: c.title,
    description: c.description,
    imageUrl: c.image?.url ?? null,
    imageAlt: c.image?.altText ?? null,
  };
}

export const shopifyCatalog: CatalogProvider = {
  async listProducts() {
    const data = await shopifyFetch<{ products: { nodes: ShopifyProduct[] } }>(
      `query { products(first: 50) { nodes { ${PRODUCT_FIELDS} } } }`
    );
    return data.products.nodes.map(toProduct);
  },

  async getProduct(handle) {
    const data = await shopifyFetch<{ product: ShopifyProduct | null }>(
      `query ProductByHandle($handle: String!) {
        product(handle: $handle) { ${PRODUCT_FIELDS} }
      }`,
      { handle }
    );
    return data.product ? toProduct(data.product) : null;
  },

  async listCollections() {
    const data = await shopifyFetch<{ collections: { nodes: ShopifyCollection[] } }>(
      `query { collections(first: 50) { nodes { ${COLLECTION_FIELDS} } } }`
    );
    return data.collections.nodes.map(toCollection);
  },

  // Returns null when the collection doesn't exist or isn't published to this storefront.
  async getCollectionProducts(handle) {
    const data = await shopifyFetch<{
      collection: { products: { nodes: ShopifyProduct[] } } | null;
    }>(
      `query CollectionProducts($handle: String!) {
        collection(handle: $handle) {
          products(first: 24, sortKey: COLLECTION_DEFAULT) { nodes { ${PRODUCT_FIELDS} } }
        }
      }`,
      { handle }
    );
    return data.collection ? data.collection.products.nodes.map(toProduct) : null;
  },
};

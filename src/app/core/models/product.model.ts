export interface Product {
  id: string;
  name: string;
  ingredients: {
    ingredientId: string;
    quantity: number;
  }[];
}
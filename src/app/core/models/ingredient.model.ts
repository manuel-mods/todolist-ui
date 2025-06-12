export interface Ingredient {
  id: string;
  name: string;
  unit: 'unidad' | 'gramo' | 'kilo';
  pricePerUnit: number;
}
export interface Ingredient {
  id: string;
  name: string;
}

export type Category = 'doce' | 'salgado' | 'ambos';

export type DishType = 
  | 'pão' 
  | 'bolo' 
  | 'almoço' 
  | 'janta' 
  | 'suco' 
  | 'vitamina' 
  | 'sorvete' 
  | 'sobremesa' 
  | 'lanche'
  | 'todas';

export interface Recipe {
  title: string;
  description: string;
  ingredients: { name: string; amount: string }[];
  instructions: string[];
  type: string;
  prepTime: string;
  origin?: {
    country: string;
    region?: string;
  };
  category: 'doce' | 'salgado';
}

export type AIModel = 'gemini' | 'qwen';

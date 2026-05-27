import { GoogleGenAI, Type } from "@google/genai";
import { Recipe } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generateRecipe = async (
  ingredients: string[], 
  modelType: string,
  category: string = 'ambos',
  dishType: string = 'todas'
): Promise<Recipe[]> => {
  const categoryFilter = category !== 'ambos' ? `O prato deve ser obrigatoriamente ${category}.` : '';
  const typeFilter = dishType !== 'todas' ? `O tipo de prato deve ser ${dishType}.` : 'Pode ser qualquer tipo de prato (pão, bolo, almoço, janta, etc).';

  const prompt = `Você é um chef especialista internacional. 
Seu objetivo é sugerir receitas usando EXATAMENTE e APENAS os ingredientes fornecidos pelo usuário.
Não adicione ingredientes extras, exceto água ou sal se forem estritamente necessários para a estrutura básica.
Priorize receitas que usem o máximo dos ingredientes fornecidos.

Filtros solicitados:
- Categoria: ${category} (doce/salgado). ${categoryFilter}
- Tipo de Prato: ${dishType}. ${typeFilter}

Importante: Identifique a origem cultural da receita (País e Região, se possível).

Ingredientes disponíveis: ${ingredients.join(", ")}.

Retorne uma lista de até 3 receitas em formato JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING, enum: ['doce', 'salgado'] },
              type: { type: Type.STRING },
              ingredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    amount: { type: Type.STRING }
                  },
                  required: ['name', 'amount']
                }
              },
              instructions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              prepTime: { type: Type.STRING },
              origin: {
                type: Type.OBJECT,
                properties: {
                  country: { type: Type.STRING },
                  region: { type: Type.STRING }
                },
                required: ['country']
              }
            },
            required: ['title', 'description', 'category', 'type', 'ingredients', 'instructions', 'prepTime', 'origin']
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    let parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      if (parsed.recipes && Array.isArray(parsed.recipes)) {
        parsed = parsed.recipes;
      } else {
        parsed = [parsed];
      }
    }
    return parsed;
  } catch (error) {
    console.error("Erro ao gerar receita:", error);
    return [];
  }
};

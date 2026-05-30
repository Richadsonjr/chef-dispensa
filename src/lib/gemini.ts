import { Recipe } from "../types";

const getAPIKey = (): string => {
  const envKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY;
  if (envKey) return envKey;

  try {
    if (process.env.OPENROUTER_API_KEY) {
      return process.env.OPENROUTER_API_KEY;
    }
  } catch (e) {
    // ignorar em ambientes de navegador onde process não está definido
  }

  return "";
};

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

Retorne uma lista de até 3 receitas em formato JSON.
O JSON deve ser um array de objetos (ou um objeto contendo a propriedade "recipes" que é um array) onde cada objeto tem a seguinte estrutura exata:
{
  "title": "Nome do prato",
  "description": "Breve descrição",
  "category": "doce" ou "salgado",
  "type": "tipo de prato (ex: bolo, torta)",
  "prepTime": "tempo de preparo (ex: 45 min)",
  "origin": {
    "country": "país de origem",
    "region": "região de origem se aplicável"
  },
  "ingredients": [
    { "name": "nome do ingrediente", "amount": "quantidade" }
  ],
  "instructions": [
    "Passo 1...",
    "Passo 2..."
  ]
}

Responda APENAS com o JSON válido, sem qualquer bloco de código markdown, markdown tags ou texto adicional.`;

  const modelsToTry = [
    "openai/gpt-oss-120b:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "deepseek/deepseek-v4-flash:free",
    "openai/gpt-oss-120b:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "google/gemma-4-31b-it:free",
    "openai/gpt-oss-20b:free"
  ];

  const apiKey = getAPIKey();
  if (!apiKey) {
    throw new Error("Chave de API do OpenRouter não encontrada. Por favor, adicione a variável VITE_OPENROUTER_API_KEY nos Secrets do seu repositório GitHub (para o GitHub Pages) ou nas Configurações da plataforma.");
  }

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    console.log(`[OpenRouter] Tentando gerar receita com o modelo: ${currentModel} (Tentativa ${i + 1}/${modelsToTry.length})`);
    
    try {
      const url = "https://openrouter.ai/api/v1/chat/completions";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://github.com",
          "X-Title": "BakeMind"
        },
        body: JSON.stringify({
          model: currentModel,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(`OpenRouter Error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Resposta de conteúdo vazia.");
      }

      let parsed = cleanAndParseJSON(content);
      if (!Array.isArray(parsed)) {
        if (parsed.recipes && Array.isArray(parsed.recipes)) {
          parsed = parsed.recipes;
        } else {
          parsed = [parsed];
        }
      }
      
      console.log(`[OpenRouter] Sucesso ao gerar com o modelo: ${currentModel}`);
      return parsed;

    } catch (error: any) {
      console.warn(`[OpenRouter] Falha no modelo ${currentModel}:`, error);
    }
  }

  // Se todos falharem:
  throw new Error(
    "Por favor, volte mais tarde. Todos os modelos gratuitos de Inteligência Artificial estão temporariamente instáveis ou esgotaram seus limites de requisições."
  );
};

function cleanAndParseJSON(text: string): any {
  let cleaned = text.trim();
  
  // Se contiver delimitadores markdown de código, extrai o conteúdo de dentro deles
  if (cleaned.includes("```")) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      cleaned = match[1].trim();
    }
  }
  
  // Tratamento adicional para remover textos residuais antes/depois do JSON
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  const lastBrace = cleaned.lastIndexOf("}");
  const lastBracket = cleaned.lastIndexOf("]");
  
  let startIndex = -1;
  let endIndex = -1;
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIndex = firstBrace;
    endIndex = lastBrace;
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
    endIndex = lastBracket;
  }
  
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    cleaned = cleaned.substring(startIndex, endIndex + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Erro ao analisar JSON retornado:", cleaned);
    throw error;
  }
}

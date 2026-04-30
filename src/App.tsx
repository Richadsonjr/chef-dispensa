import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, Utensils, ChefHat, Timer, BookOpen, Sparkles, Brain, Cpu, Search, 
  CheckCircle2, Globe, MapPin, Candy, Beef, Filter, LayoutGrid
} from 'lucide-react';
import { Ingredient, Recipe, AIModel, Category, DishType } from './types';
import { generateRecipe } from './lib/gemini';
import { cn } from './lib/utils';

export default function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [model] = useState<AIModel>('qwen');
  const [category, setCategory] = useState<Category>('ambos');
  const [dishType, setDishType] = useState<DishType>('todas');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const addIngredient = () => {
    if (!inputValue.trim()) return;
    const newIngredient: Ingredient = {
      id: Math.random().toString(36).substr(2, 9),
      name: inputValue.trim().toLowerCase(),
    };
    setIngredients(prev => [...prev, newIngredient]);
    setInputValue('');
  };

  const removeIngredient = (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
  };

  const handleSearch = async () => {
    if (ingredients.length === 0) return;
    setLoading(true);
    const ingredientNames = ingredients.map(i => i.name);
    const results = await generateRecipe(ingredientNames, model, category, dishType);
    setRecipes(results);
    setLoading(false);
  };

  const dishTypes: { value: DishType; label: string }[] = [
    { value: 'todas', label: 'Todos os Tipos' },
    { value: 'pão', label: 'Pães' },
    { value: 'bolo', label: 'Bolos' },
    { value: 'almoço', label: 'Almoço' },
    { value: 'janta', label: 'Janta' },
    { value: 'suco', label: 'Sucos' },
    { value: 'vitamina', label: 'Vitaminas' },
    { value: 'sorvete', label: 'Sorvetes' },
    { value: 'sobremesa', label: 'Sobremesas' },
    { value: 'lanche', label: 'Lanches' },
  ];

  return (
    <div className="relative min-h-screen bg-[#faf7f2] font-sans text-slate-800 overflow-hidden">
      {/* Background Mesh Gradients */}
      <div className="mesh-gradient">
        <div className="mesh-amber"></div>
        <div className="mesh-emerald"></div>
        <div className="mesh-orange"></div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row h-screen min-h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full lg:w-96 flex flex-col gap-6 p-8 overflow-y-auto lg:h-full border-r border-white/20">
          <header className="flex items-center gap-3 px-2 mb-2">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
              <ChefHat className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 italic serif decoration-amber-400 underline decoration-4">BakeMind</h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Chef Inteligente</p>
            </div>
          </header>

          {/* Category & Type Selection */}
          <div className="frosted-glass rounded-[2rem] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-amber-500" />
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block">Filtros de Prato</label>
            </div>
            
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">Sabor</span>
                <div className="flex gap-2">
                  {[
                    { val: 'ambos', icon: Filter, label: 'Ambos' },
                    { val: 'doce', icon: Candy, label: 'Doce' },
                    { val: 'salgado', icon: Beef, label: 'Salgado' }
                  ].map((cat) => (
                    <button
                      key={cat.val}
                      onClick={() => setCategory(cat.val as Category)}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all",
                        category === cat.val ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" : "bg-white/40 text-slate-500 hover:bg-white/60"
                      )}
                    >
                      <cat.icon className="w-3.5 h-3.5" />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">Tipo</span>
                <div className="relative group">
                  <select
                    value={dishType}
                    onChange={(e) => setDishType(e.target.value as DishType)}
                    className="w-full bg-white/60 border border-white px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none transition-all cursor-pointer"
                  >
                    {dishTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="flex-1 frosted-glass rounded-[2rem] p-6 flex flex-col min-h-[300px]">
            <div className="flex justify-between items-center mb-6">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block">Minha Dispensa</label>
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">{ingredients.length} ITENS</span>
            </div>
            
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                placeholder="Ex: Trigo, Ovos..."
                className="flex-1 bg-white/60 border border-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <button 
                onClick={addIngredient}
                className="bg-amber-500 text-white p-2 rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/10 active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-wrap gap-2 content-start overflow-y-auto mb-6 pr-1 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {ingredients.map(ing => (
                  <motion.span
                    key={ing.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="px-3 py-1.5 bg-white rounded-xl text-[11px] font-bold border border-slate-100 shadow-sm flex items-center gap-2 group transition-all hover:border-red-100"
                  >
                    {ing.name}
                    <button onClick={() => removeIngredient(ing.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
            
            <div className="mt-auto">
              <button 
                onClick={handleSearch}
                disabled={ingredients.length === 0 || loading}
                className={cn(
                  "w-full py-5 rounded-[1.5rem] font-black text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-3 overflow-hidden group shadow-xl",
                  ingredients.length === 0 || loading 
                    ? "bg-slate-100 text-slate-300 cursor-not-allowed" 
                    : "bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-1 active:translate-y-0"
                )}
              >
                {loading ? <Cpu className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                {loading ? "PROCESSANDO..." : "BUSCAR RECEITA"}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col p-8 overflow-y-auto">
          <header className="flex flex-col md:flex-row md:items-end justify-between items-start gap-4 pb-6 border-b border-white/40 mb-10">
            <div>
              <h2 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">
                Sugestão Personalizada
              </h2>
              <p className="text-4xl font-serif text-slate-900 italic">Chef Vision: Descobrimos algo para você!</p>
            </div>
            
            {recipes.length > 0 && (
              <div className="flex items-center gap-4 px-6 py-3 frosted-glass rounded-2xl">
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Compatibilidade</p>
                  <p className="text-xl font-black text-emerald-600 tracking-tighter">TOTAL</p>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-emerald-500 bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            )}
          </header>

          <div className="flex-1 flex flex-col gap-10">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center p-12"
                >
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin mb-8" />
                    <ChefHat className="w-12 h-12 text-amber-500 absolute top-10 left-10 animate-bounce" />
                  </div>
                  <h3 className="text-2xl font-serif italic text-slate-400">O Chef está combinando sabores...</h3>
                </motion.div>
              ) : recipes.length > 0 ? (
                <div className="grid grid-cols-1 gap-8">
                  {recipes.map((recipe, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white/60 backdrop-blur-xl border border-white rounded-[3rem] shadow-2xl shadow-slate-200/40 overflow-hidden group hover:shadow-amber-500/10 transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row min-h-[450px]">
                        {/* Visual Section */}
                        <div className="lg:w-2/5 bg-amber-50/50 p-12 flex flex-col justify-center items-center text-center border-r border-white relative overflow-hidden shrink-0">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.1)_0%,transparent_70%)]"></div>
                          
                          <div className="w-56 h-56 rounded-full bg-white shadow-2xl flex items-center justify-center mb-10 relative z-10 group-hover:scale-105 transition-transform duration-700">
                             <div className="absolute inset-4 rounded-full border-2 border-dashed border-amber-200 animate-[spin_20s_linear_infinite]"></div>
                             <span className="text-8xl select-none group-hover:animate-wiggle">
                               {recipe.category === 'doce' ? '🍰' : '🍲'}
                             </span>
                          </div>
                          
                          <div className="relative z-10 space-y-4">
                            <h3 className="text-3xl font-serif font-black text-slate-900 leading-tight italic px-4">{recipe.title}</h3>
                            
                            <div className="inline-flex items-center gap-3 bg-white/80 px-4 py-2 rounded-full border border-white shadow-sm">
                              <div className="flex items-center gap-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                <Globe className="w-3 h-3 text-amber-500" />
                                {recipe.origin?.country}
                              </div>
                              {recipe.origin?.region && (
                                <>
                                  <div className="h-3 w-px bg-slate-200" />
                                  <div className="flex items-center gap-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                    <MapPin className="w-3 h-3 text-amber-500" />
                                    {recipe.origin.region}
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="flex gap-6 mt-6 text-slate-500">
                               <div className="flex flex-col text-left">
                                 <span className="text-[10px] uppercase font-black text-amber-500 tracking-widest">Preparo</span>
                                 <span className="text-lg font-black text-slate-700">{recipe.prepTime}</span>
                               </div>
                               <div className="w-px bg-slate-200 h-10 self-center" />
                               <div className="flex flex-col text-left">
                                 <span className="text-[10px] uppercase font-black text-amber-500 tracking-widest">Categoria</span>
                                 <span className="text-lg font-black text-slate-700 capitalize">{recipe.type}</span>
                               </div>
                            </div>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="lg:w-3/5 p-12 flex flex-col bg-white/40">
                          <div className="flex-1 space-y-8">
                             <div>
                               <h4 className="text-[11px] uppercase font-black text-slate-300 tracking-[0.2em] mb-6 flex items-center gap-3">
                                 <div className="h-px bg-slate-100 flex-1" />
                                 Modo de Preparo
                                 <div className="h-px bg-slate-100 flex-1" />
                               </h4>
                               <ul className="space-y-6">
                                 {recipe.instructions.slice(0, 4).map((step, sIdx) => (
                                   <li key={sIdx} className="flex gap-5 group/item">
                                     <span className="w-8 h-8 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-lg group-hover/item:bg-amber-500 transition-colors">
                                       {sIdx + 1}
                                     </span>
                                     <p className="text-[13px] text-slate-600 leading-relaxed italic font-medium pt-1">
                                       {step}
                                     </p>
                                   </li>
                                 ))}
                                 {recipe.instructions.length > 4 && (
                                   <p className="text-[10px] text-slate-400 font-bold ml-12 uppercase tracking-widest italic cursor-pointer hover:text-amber-500" onClick={() => setSelectedRecipe(recipe)}>
                                     + Clique para ver {recipe.instructions.length - 4} passos restantes
                                   </p>
                                 )}
                               </ul>
                             </div>
                          </div>

                          <div className="mt-10 pt-10 border-t border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xs shadow-lg">AI</div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 tracking-widest leading-none">Powered by</p>
                                <p className="text-xs font-black text-slate-900">Qwen 2.5</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setSelectedRecipe(recipe)}
                              className="bg-amber-50 text-amber-700 px-8 py-3 rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-amber-500 hover:text-white transition-all shadow-sm active:scale-95"
                            >
                              Ver Completa
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-center opacity-40 grayscale"
                >
                  <div className="relative mb-10">
                    <Utensils className="w-32 h-32 text-slate-200" />
                    <div className="absolute inset-x-0 bottom-0 h-4 bg-amber-500/10 blur-xl rounded-full" />
                  </div>
                  <h3 className="text-3xl font-serif italic text-slate-300">Escolha os itens da dispensa e filtros desejados.</h3>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Modal - Recipe Detail */}
      <AnimatePresence>
        {selectedRecipe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl"
            onClick={() => setSelectedRecipe(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-y-auto max-h-[90vh] custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-64 bg-slate-900 overflow-hidden">
                <img 
                  src={`https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=1200`} 
                  className="w-full h-full object-cover opacity-50 scale-105"
                  alt="Recipe Header"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <button 
                  onClick={() => setSelectedRecipe(null)}
                  className="absolute top-8 right-8 p-4 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-[1.5rem] transition-all text-white active:scale-95"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="absolute bottom-10 left-10">
                  <span className="bg-amber-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4 inline-block">{selectedRecipe.category}</span>
                  <h3 className="text-5xl font-serif italic text-white font-black">{selectedRecipe.title}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 p-12 gap-12">
                <div className="lg:col-span-1 space-y-10">
                  <div>
                    <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-300 mb-6 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      Ingredientes
                    </h4>
                    <div className="space-y-3">
                      {selectedRecipe.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100">
                          <span className="text-sm font-bold text-slate-600 capitalize">{ing.name}</span>
                          <span className="text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl">{ing.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-8 bg-amber-50/50 rounded-[2rem] border border-amber-100">
                    <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-amber-600/50 mb-6">Informações</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Origem</p>
                        <p className="text-sm font-bold text-slate-900">{selectedRecipe.origin?.country}</p>
                        <p className="text-[10px] font-medium text-slate-500 italic">{selectedRecipe.origin?.region}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Preparo</p>
                        <p className="text-sm font-bold text-slate-900">{selectedRecipe.prepTime}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-300 mb-8 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    Guia de Preparo
                  </h4>
                  <div className="space-y-8">
                    {selectedRecipe.instructions.map((step, i) => (
                      <div key={i} className="flex gap-8 group">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-12 h-12 rounded-3xl bg-slate-900 text-white font-black flex items-center justify-center text-lg shadow-xl group-hover:bg-amber-500 transition-colors">
                            {i + 1}
                          </div>
                          {i < selectedRecipe.instructions.length - 1 && (
                            <div className="w-0.5 h-full bg-slate-50 mt-4 group-hover:bg-amber-100 transition-colors" />
                          )}
                        </div>
                        <p className="text-lg text-slate-600 leading-relaxed font-medium serif italic pt-1">{step}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-16 pt-10 border-t border-slate-50 flex items-center justify-between">
                    <button 
                       onClick={() => window.print()}
                       className="flex items-center gap-3 text-slate-300 hover:text-slate-900 transition-all font-black uppercase text-[10px] tracking-widest px-6 py-3 rounded-2xl hover:bg-slate-50"
                    >
                      <BookOpen className="w-5 h-5 text-amber-500" /> Versão Para Impressão
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Receita IA Verificada</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.05);
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.1);
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

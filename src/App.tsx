import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, Utensils, ChefHat, Timer, BookOpen, Sparkles, Brain, Cpu, Search, 
  CheckCircle2, Globe, MapPin, Candy, Beef, Filter, LayoutGrid, Heart, Bookmark, Trash2, RefreshCw
} from 'lucide-react';
import jsPDF from 'jspdf';
import { Ingredient, Recipe, AIModel, Category, DishType } from './types';
import { generateRecipe } from './lib/gemini';
import { cn } from './lib/utils';

export default function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [model] = useState<AIModel>('gemini');
  const [category, setCategory] = useState<Category>('ambos');
  const [dishType, setDishType] = useState<DishType>('todas');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const [favorites, setFavorites] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('bakemind_favorites');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [viewMode, setViewMode] = useState<'search' | 'favorites'>('search');
  const [favSearchQuery, setFavSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('bakemind_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const handleToggleFavorite = (recipe: Recipe, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites(prev => {
      if (prev.some(f => f.title === recipe.title)) {
        return prev.filter(f => f.title !== recipe.title);
      }
      return [{ ...recipe, id: Date.now().toString() }, ...prev];
    });
  };

  const isFavorite = (title: string) => favorites.some(f => f.title === title);

  const filteredFavorites = favorites.filter(f => f.title.toLowerCase().includes(favSearchQuery.toLowerCase()));

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

  const handleDownloadPDF = () => {
    if (!selectedRecipe) return;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(22);
    doc.setTextColor(245, 158, 11); // Amber
    doc.text(selectedRecipe.title, 20, 20);
    
    // Meta
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    let y = 30;
    doc.text(`Tempo de Preparo: ${selectedRecipe.prepTime}`, 20, y);
    y += 6;
    if (selectedRecipe.origin?.country) {
        doc.text(`Origem: ${selectedRecipe.origin.country} ${selectedRecipe.origin.region ? `(${selectedRecipe.origin.region})` : ''}`, 20, y);
    }
    
    // Ingredients
    y += 15;
    doc.setFontSize(16);
    doc.setTextColor(50, 50, 50);
    doc.text("Ingredientes", 20, y);
    y += 10;
    
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    selectedRecipe.ingredients.forEach(ing => {
        doc.text(`• ${ing.name}: ${ing.amount}`, 25, y);
        y += 8;
    });
    
    // Instructions
    y += 10;
    
    // Check if we need a page break before instructions
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFontSize(16);
    doc.setTextColor(50, 50, 50);
    doc.text("Modo de Preparo", 20, y);
    y += 10;
    
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    selectedRecipe.instructions.forEach((step, index) => {
        const textLines = doc.splitTextToSize(`${index + 1}. ${step}`, 170);
        
        // Add new page if needed
        if (y + (textLines.length * 7) > 280) {
            doc.addPage();
            y = 20;
        }
        
        doc.text(textLines, 20, y);
        y += textLines.length * 7 + 3;
    });
    
    doc.save(`${selectedRecipe.title.replace(/[\s\W]+/g, '_').toLowerCase()}.pdf`);
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

  const renderRecipe = (recipe: Recipe, idx: number) => {
    const isFav = isFavorite(recipe.title);
    return (
      <motion.div
        key={recipe.id || idx}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.1 }}
        className="bg-white/60 backdrop-blur-xl border border-white rounded-[2rem] lg:rounded-[3rem] shadow-xl lg:shadow-2xl shadow-slate-200/40 overflow-hidden group hover:shadow-amber-500/10 transition-shadow relative"
      >
        <button 
          onClick={(e) => handleToggleFavorite(recipe, e)}
          className={cn(
            "absolute top-4 right-4 lg:top-6 lg:right-6 z-20 w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all backdrop-blur-md shadow-lg",
            isFav ? "bg-amber-500 text-white" : "bg-white/80 text-slate-400 hover:text-amber-500 hover:bg-white"
          )}
        >
          <Heart className={cn("w-5 h-5", isFav ? "fill-white" : "")} />
        </button>

        <div className="flex flex-col lg:flex-row lg:min-h-[450px]">
          {/* Visual Section */}
          <div className="lg:w-2/5 bg-amber-50/50 p-8 lg:p-12 flex flex-col justify-center items-center text-center border-b lg:border-b-0 lg:border-r border-white relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.1)_0%,transparent_70%)]"></div>
            
            <div className="w-40 h-40 lg:w-56 lg:h-56 rounded-full bg-white shadow-xl lg:shadow-2xl flex items-center justify-center mb-6 lg:mb-10 relative z-10 lg:group-hover:scale-105 transition-transform duration-700">
               <div className="absolute inset-2 lg:inset-4 rounded-full border-2 border-dashed border-amber-200 animate-[spin_20s_linear_infinite]"></div>
               <span className="text-6xl lg:text-8xl select-none lg:group-hover:animate-wiggle">
                 {recipe.category === 'doce' ? '🍰' : '🍲'}
               </span>
            </div>
            
            <div className="relative z-10 space-y-3 lg:space-y-4">
              <h3 className="text-2xl lg:text-3xl font-serif font-black text-slate-900 leading-tight italic px-2 lg:px-4">{recipe.title}</h3>
              
              <div className="inline-flex items-center gap-2 lg:gap-3 bg-white/80 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full border border-white shadow-sm flex-wrap max-w-[90%] mx-auto justify-center">
                <div className="flex items-center gap-1 text-[9px] lg:text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  <Globe className="w-3 h-3 text-amber-500" />
                  <span className="truncate max-w-[120px]">{recipe.origin?.country}</span>
                </div>
                {recipe.origin?.region && (
                  <>
                    <div className="h-3 w-px bg-slate-200" />
                    <div className="flex items-center gap-1 text-[9px] lg:text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      <MapPin className="w-3 h-3 text-amber-500" />
                      <span className="truncate max-w-[120px]">{recipe.origin.region}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-4 lg:gap-6 mt-4 lg:mt-6 text-slate-500 justify-center">
                 <div className="flex flex-col text-left">
                   <span className="text-[9px] lg:text-[10px] uppercase font-black text-amber-500 tracking-widest">Preparo</span>
                   <span className="text-base lg:text-lg font-black text-slate-700">{recipe.prepTime}</span>
                 </div>
                 <div className="w-px bg-slate-200 h-8 lg:h-10 self-center" />
                 <div className="flex flex-col text-left">
                   <span className="text-[9px] lg:text-[10px] uppercase font-black text-amber-500 tracking-widest">Categoria</span>
                   <span className="text-base lg:text-lg font-black text-slate-700 capitalize">{recipe.type}</span>
                 </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="lg:w-3/5 p-6 sm:p-8 lg:p-12 flex flex-col bg-white/40">
            <div className="flex-1 space-y-6 lg:space-y-8">
               <div>
                 <h4 className="text-[10px] lg:text-[11px] uppercase font-black text-slate-300 tracking-[0.2em] mb-4 lg:mb-6 flex items-center gap-3">
                   <div className="h-px bg-slate-200 lg:bg-slate-100 flex-1" />
                   Modo de Preparo
                   <div className="h-px bg-slate-200 lg:bg-slate-100 flex-1" />
                 </h4>
                 <ul className="space-y-4 lg:space-y-6">
                   {recipe.instructions.slice(0, 4).map((step, sIdx) => (
                     <li key={sIdx} className="flex gap-4 lg:gap-5 group/item">
                       <span className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-slate-900 text-white text-[10px] lg:text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-md lg:shadow-lg lg:group-hover/item:bg-amber-500 transition-colors">
                         {sIdx + 1}
                       </span>
                       <p className="text-xs lg:text-[13px] text-slate-600 leading-relaxed italic font-medium pt-0.5 lg:pt-1">
                         {step}
                       </p>
                     </li>
                   ))}
                   {recipe.instructions.length > 4 && (
                     <p className="text-[10px] text-slate-400 font-bold ml-10 lg:ml-13 uppercase tracking-widest italic cursor-pointer hover:text-amber-500" onClick={() => setSelectedRecipe(recipe)}>
                       + Clique para ver {recipe.instructions.length - 4} passos restantes
                     </p>
                   )}
                 </ul>
               </div>
            </div>

            <div className="mt-8 pt-6 lg:mt-10 lg:pt-10 border-t border-slate-200 lg:border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-[10px] lg:text-xs shadow-lg">AI</div>
                <div>
                  <p className="text-[9px] lg:text-[10px] font-black text-slate-400 tracking-widest leading-none">Powered by</p>
                  <p className="text-[10px] lg:text-xs font-black text-slate-900">Gemini 3.0 Flash</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRecipe(recipe)}
                className="w-full sm:w-auto bg-amber-50 text-amber-700 px-6 py-3 lg:px-8 lg:py-3 rounded-[1rem] lg:rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-amber-500 hover:text-white transition-all shadow-sm active:scale-95 text-center"
              >
                Ver Completa
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="relative min-h-screen bg-[#faf7f2] font-sans text-slate-800 lg:overflow-hidden">
      {/* Background Mesh Gradients */}
      <div className="mesh-gradient">
        <div className="mesh-amber"></div>
        <div className="mesh-emerald"></div>
        <div className="mesh-orange"></div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen lg:h-screen lg:overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full lg:w-96 flex flex-col gap-4 lg:gap-6 p-4 sm:p-6 lg:p-8 shrink-0 lg:h-full lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-white/20">
          <header className="flex items-center justify-between px-2 mb-2">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewMode('search')}>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-amber-500 rounded-xl lg:rounded-2xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                <ChefHat className="h-6 w-6 lg:h-7 lg:w-7" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 italic serif decoration-amber-400 underline decoration-4">BakeMind</h1>
                <p className="text-[9px] lg:text-[10px] uppercase tracking-widest font-bold text-slate-400">Chef Inteligente</p>
              </div>
            </div>
            <button 
              onClick={() => setViewMode(viewMode === 'favorites' ? 'search' : 'favorites')}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                viewMode === 'favorites' ? "bg-amber-100 text-amber-500 shadow-inner" : "bg-white/60 text-slate-400 hover:text-amber-500 hover:bg-white border border-white"
              )}
              title="Favoritos"
            >
              <Heart className={cn("w-5 h-5", viewMode === 'favorites' ? "fill-amber-500" : "")} />
            </button>
          </header>

          {/* Category & Type Selection */}
          <div className="frosted-glass rounded-[1.5rem] lg:rounded-[2rem] p-5 lg:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-amber-500" />
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block">Filtros de Prato</label>
            </div>
            
            <div className="space-y-4 lg:space-y-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 lg:mb-3 block">Sabor</span>
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
                        "flex-1 py-2 lg:py-2.5 rounded-xl text-[11px] lg:text-xs font-bold flex flex-col items-center gap-1 transition-all",
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
                <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 lg:mb-3 block">Tipo</span>
                <div className="relative group">
                  <select
                    value={dishType}
                    onChange={(e) => setDishType(e.target.value as DishType)}
                    className="w-full bg-white/60 border border-white px-3 py-2.5 lg:px-4 lg:py-3 rounded-xl text-[13px] lg:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none transition-all cursor-pointer"
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
          <div className="flex-1 frosted-glass rounded-[1.5rem] lg:rounded-[2rem] p-5 lg:p-6 flex flex-col min-h-[250px] lg:min-h-[300px]">
            <div className="flex justify-between items-center mb-4 lg:mb-6">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block">Minha Dispensa</label>
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">{ingredients.length} ITENS</span>
            </div>
            
            <div className="flex gap-2 mb-4 lg:mb-6">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                placeholder="Ex: Trigo, Ovos..."
                className="flex-1 bg-white/60 border border-white rounded-xl px-3 py-2 lg:px-4 text-[13px] lg:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <button 
                onClick={addIngredient}
                className="bg-amber-500 text-white p-2 lg:p-2.5 rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/10 active:scale-95 flex items-center justify-center shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-none lg:flex-1 flex flex-wrap gap-2 content-start min-h-[80px] lg:min-h-0 lg:overflow-y-auto mb-4 lg:mb-6 pr-1 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {ingredients.map(ing => (
                  <motion.span
                    key={ing.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="px-2.5 py-1 lg:px-3 lg:py-1.5 bg-white rounded-xl text-[11px] font-bold border border-slate-100 shadow-sm flex items-center gap-1.5 lg:gap-2 group transition-all hover:border-red-100"
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
                  "w-full py-4 lg:py-5 rounded-2xl lg:rounded-[1.5rem] font-black text-[11px] lg:text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 lg:gap-3 overflow-hidden group shadow-xl",
                  ingredients.length === 0 || loading 
                    ? "bg-slate-100 text-slate-300 cursor-not-allowed" 
                    : "bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-1 active:translate-y-0"
                )}
              >
                {loading ? <Cpu className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" /> : <Search className="w-4 h-4 lg:w-5 lg:h-5 group-hover:scale-110 transition-transform" />}
                {loading ? "PROCESSANDO..." : "BUSCAR RECEITA"}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 lg:overflow-y-auto w-full">
          {viewMode === 'search' ? (
            <header className="flex flex-col md:flex-row md:items-end justify-between items-start gap-4 pb-4 lg:pb-6 border-b border-white/40 mb-6 lg:mb-10 content-start">
              <div>
                <h2 className="text-[10px] lg:text-xs font-black text-amber-600 uppercase tracking-widest mb-1">
                  Sugestão Personalizada
                </h2>
                <p className="text-2xl lg:text-4xl font-serif text-slate-900 italic">Chef Vision: Descobrimos algo para você!</p>
              </div>
              
              {recipes.length > 0 && (
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 lg:gap-4">
                  <button
                    onClick={() => {
                      setRecipes([]);
                      setIngredients([]);
                      setInputValue('');
                    }}
                    className="flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 bg-white/60 hover:bg-white text-slate-500 hover:text-amber-600 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-widest border border-white transition-all shadow-sm active:scale-95 whitespace-nowrap"
                  >
                    <RefreshCw className="w-4 h-4 lg:w-5 lg:h-5" />
                    Nova Busca
                  </button>
                  <div className="flex items-center gap-3 lg:gap-4 px-4 py-2 lg:px-6 lg:py-3 frosted-glass rounded-2xl">
                    <div className="text-right">
                      <p className="text-[8px] lg:text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Compatibilidade</p>
                      <p className="text-lg lg:text-xl font-black text-emerald-600 tracking-tighter">TOTAL</p>
                    </div>
                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 border-emerald-500 bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6" />
                    </div>
                  </div>
                </div>
              )}
            </header>
          ) : (
            <header className="flex flex-col md:flex-row md:items-end justify-between items-start gap-4 pb-4 lg:pb-6 border-b border-white/40 mb-6 lg:mb-10 content-start">
              <div>
                <h2 className="text-[10px] lg:text-xs font-black text-amber-600 uppercase tracking-widest mb-1">
                  Seu Livro de Receitas
                </h2>
                <p className="text-2xl lg:text-4xl font-serif text-slate-900 italic">Receitas Favoritas</p>
              </div>
              
              <div className="w-full md:w-64 relative shrink-0">
                <input 
                  type="text" 
                  value={favSearchQuery}
                  onChange={(e) => setFavSearchQuery(e.target.value)}
                  placeholder="Pesquisar favoritos..."
                  className="w-full bg-white/60 border border-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 pl-10"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </header>
          )}

          <div className="flex-1 flex flex-col gap-6 lg:gap-10">
            <AnimatePresence mode="wait">
              {viewMode === 'favorites' ? (
                <motion.div
                  key="favorites"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pb-10 lg:pb-0"
                >
                  {filteredFavorites.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 lg:gap-8">
                      {filteredFavorites.map(renderRecipe)}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 grayscale py-20">
                      <Bookmark className="w-24 h-24 text-slate-300 mb-6" />
                      <h3 className="text-2xl font-serif italic text-slate-400">
                        {favSearchQuery ? 'Nenhuma receita encontrada.' : 'Nenhuma receita favorita.'}
                      </h3>
                    </div>
                  )}
                </motion.div>
              ) : loading ? (
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
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pb-10 lg:pb-0"
                >
                  <div className="grid grid-cols-1 gap-6 lg:gap-8">
                    {recipes.map(renderRecipe)}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center opacity-40 grayscale py-20"
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xl"
            onClick={() => setSelectedRecipe(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[1.5rem] lg:rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-y-auto max-h-[92vh] custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-48 sm:h-56 lg:h-64 bg-slate-900 overflow-hidden">
                <img 
                  src={`https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=1200`} 
                  className="w-full h-full object-cover opacity-50 scale-105"
                  alt="Recipe Header"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <div className="absolute top-4 right-4 lg:top-8 lg:right-8 flex gap-3">
                  <button 
                    onClick={(e) => handleToggleFavorite(selectedRecipe, e)}
                    className={cn(
                      "p-3 lg:p-4 backdrop-blur-md rounded-xl lg:rounded-[1.5rem] transition-all active:scale-95 shadow-lg",
                      isFavorite(selectedRecipe.title) ? "bg-amber-500/90 text-white hover:bg-amber-500" : "bg-white/20 hover:bg-white/40 text-white"
                    )}
                  >
                    <Heart className={cn("w-5 h-5 lg:w-6 lg:h-6", isFavorite(selectedRecipe.title) ? "fill-white" : "")} />
                  </button>
                  <button 
                    onClick={() => setSelectedRecipe(null)}
                    className="p-3 lg:p-4 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-xl lg:rounded-[1.5rem] transition-all text-white active:scale-95 shadow-lg"
                  >
                    <X className="w-5 h-5 lg:w-6 lg:h-6" />
                  </button>
                </div>
                <div className="absolute bottom-4 left-6 lg:bottom-10 lg:left-10 pr-6">
                  <span className="bg-amber-500 text-white px-2 py-1 lg:px-3 lg:py-1 rounded-lg text-[9px] lg:text-[10px] font-black uppercase tracking-widest mb-2 lg:mb-4 inline-block">{selectedRecipe.category}</span>
                  <h3 className="text-3xl lg:text-5xl font-serif italic text-white font-black leading-tight lg:leading-none">{selectedRecipe.title}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 p-6 sm:p-8 lg:p-12 gap-8 lg:gap-12">
                <div className="lg:col-span-1 space-y-8 lg:space-y-10">
                  <div>
                    <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-300 mb-4 lg:mb-6 flex items-center gap-2 lg:gap-3">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      Ingredientes
                    </h4>
                    <div className="space-y-2 lg:space-y-3">
                      {selectedRecipe.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center justify-between p-3 lg:p-4 bg-slate-50 rounded-xl lg:rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-md lg:hover:shadow-xl hover:shadow-slate-100">
                          <span className="text-[13px] lg:text-sm font-bold text-slate-600 capitalize pl-1">{ing.name}</span>
                          <span className="text-[11px] lg:text-xs font-black text-amber-600 bg-amber-50 px-2 lg:px-2.5 py-1 rounded-lg lg:rounded-xl ml-3 text-right">{ing.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-6 lg:p-8 bg-amber-50/50 rounded-2xl lg:rounded-[2rem] border border-amber-100">
                    <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-amber-600/50 mb-4 lg:mb-6">Informações</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Origem</p>
                        <p className="text-xs lg:text-sm font-bold text-slate-900">{selectedRecipe.origin?.country || 'Não info'}</p>
                        <p className="text-[9px] lg:text-[10px] font-medium text-slate-500 italic truncate">{selectedRecipe.origin?.region}</p>
                      </div>
                      <div>
                        <p className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Preparo</p>
                        <p className="text-xs lg:text-sm font-bold text-slate-900">{selectedRecipe.prepTime}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-300 mb-6 lg:mb-8 flex items-center gap-2 lg:gap-3">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    Guia de Preparo
                  </h4>
                  <div className="space-y-6 lg:space-y-8">
                    {selectedRecipe.instructions.map((step, i) => (
                      <div key={i} className="flex gap-4 lg:gap-8 group">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-xl lg:rounded-3xl bg-slate-900 text-white font-black flex items-center justify-center text-sm lg:text-lg shadow-md lg:shadow-xl lg:group-hover:bg-amber-500 transition-colors">
                            {i + 1}
                          </div>
                          {i < selectedRecipe.instructions.length - 1 && (
                            <div className="w-0.5 h-full bg-slate-100 lg:bg-slate-50 mt-2 lg:mt-4 group-hover:bg-amber-100 transition-colors" />
                          )}
                        </div>
                        <p className="text-sm lg:text-lg text-slate-600 leading-relaxed font-medium serif italic pt-1">{step}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 lg:mt-16 pt-6 lg:pt-10 border-t border-slate-100 lg:border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button 
                       onClick={handleDownloadPDF}
                       className="w-full sm:w-auto flex items-center justify-center gap-2 lg:gap-3 text-slate-600 lg:text-slate-500 hover:text-slate-900 transition-all font-black uppercase text-[10px] tracking-widest px-4 lg:px-6 py-3 rounded-xl lg:rounded-2xl bg-slate-50 border border-slate-200 lg:border-slate-100 hover:border-amber-200 hover:bg-amber-50"
                    >
                      <BookOpen className="w-4 h-4 lg:w-5 h-5 text-amber-500" /> Baixar PDF
                    </button>
                    <div className="flex items-center gap-2 lg:gap-3 justify-center w-full sm:w-auto">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 lg:w-6 lg:h-6" />
                      </div>
                      <p className="text-[9px] lg:text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Receita IA Verificada</p>
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

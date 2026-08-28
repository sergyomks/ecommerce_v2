import { useState } from "react";
import { X, Search } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleSearchBar } from "../../store/slices/popupSlice";

const SearchOverlay = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const dispatch = useDispatch();
  const { isSearchBarOpen } = useSelector((state) => state.popup);
  const navigate = useNavigate();

  if (!isSearchBarOpen) return null;
  const handleSearch = () => {
    if (searchQuery.trim() !== "") {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      dispatch(toggleSearchBar());

    }
  };

  return <>
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[hsla(var(--glass-bg-color))] backdrop-blur-md" >
        <div className="relative z-10 animate-slide-in-top">
          <div className="glass-panel m-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-primary">buscar productos</h2>
              <button onClick={() => dispatch(toggleSearchBar())} className="p-2 rounded-lg  glass-card hover:glow-on-hover animate-smooth">
                <X className="w-5 h-5 text-primary"></X>
              </button>
            </div>

            <div className="relative">
              <button onClick={handleSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground">
                <Search className="w-5 h-5 text-primary"></Search>
              </button>
              <input type="text" className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-lg focus:ring-2 focus:outline-none text-foreground placeholder:text-muted-foreground" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="buscar productos....." />
            </div>
              <div className="mt-6 text-center text-muted-foreground">
                <p>Comience a escribir para buscar el producto.</p>
              </div>
          </div>

        </div>
      </div>
    </div>
  </>;
};

export default SearchOverlay;

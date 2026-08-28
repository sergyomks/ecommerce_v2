import React, { useEffect } from "react";
import HeroSlider from "../components/Home/HeroSlider";
import CategoryGrid from "../components/Home/CategoryGrid";
import FlashSale from "../components/Home/FlashSale";
import TodayForYou from "../components/Home/TodayForYou";
import BestSellingStore from "../components/Home/BestSellingStore";
import { useDispatch, useSelector } from "react-redux";
import { buscarTodosProductos } from "../store/slices/productSlice";

const Index = () => {
  const dispatch = useDispatch();
  const { topRatedProducts, newProducts, products } = useSelector(
    (state) => state.product
  );
  const { categorias } = useSelector((state) => state.category);
  const catalog = products || [];
  const flashItems = (newProducts?.length ? newProducts : catalog).concat(
    newProducts?.length ? catalog.filter((p) => !newProducts.some((n) => n.id === p.id)) : []
  );

  useEffect(() => {
    dispatch(
      buscarTodosProductos({
        categoria: "",
        precio: "0-20000",
        buscar: "",
        calificaciones: "",
        disponible: "",
        pagina: 1,
        limite: 24,
      })
    );
  }, [dispatch]);

  return (
    <div className="store-page">
      <div className="store-wrap pt-4 pb-8">
        <HeroSlider />
        <CategoryGrid />
        <FlashSale products={flashItems} />
        <TodayForYou
          products={catalog}
          newProducts={newProducts || []}
          topRated={topRatedProducts || []}
        />
        <BestSellingStore categorias={categorias || []} products={catalog} />
      </div>
    </div>
  );
};

export default Index;

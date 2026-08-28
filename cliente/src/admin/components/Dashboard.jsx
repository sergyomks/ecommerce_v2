import Header from "./Header";
import MiniSummary from "./dashboard-components/MiniSummary";
import TopSellingProducts from "./dashboard-components/TopSellingProducts";
import Stats from "./dashboard-components/Stats";
import MonthlySalesChart from "./dashboard-components/MonthlySalesChart";
import OrdersChart from "./dashboard-components/OrdersChart";
import TopProductsChart from "./dashboard-components/TopProductsChart";
import FeaturedDuel from "./dashboard-components/FeaturedDuel";

const Dashboard = () => {
  return (
    <main className="admin-page">
      <Header />
      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-5">
        <div className="flex flex-col gap-5 min-w-0">
          <FeaturedDuel />
          <TopSellingProducts />
        </div>
        <div className="flex flex-col gap-5 min-w-0">
          <OrdersChart />
          <Stats />
          <MiniSummary />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <MonthlySalesChart />
        <TopProductsChart />
      </div>
    </main>
  );
};

export default Dashboard;

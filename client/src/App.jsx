import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import RetailerLogin from './pages/RetailerLogin'
import RetailerSignup from './pages/RetailerSignup'
import Search from './pages/Search'
import ProductDetail from './pages/ProductDetail'
import RetailerDashboard from './pages/RetailerDashboard'
import AddProduct from './pages/AddProduct'
import StoreProductDetail from './pages/StoreProductDetail'
import LowestPriceFinder from './pages/LowestPriceFinder'
import NearbyShops from './pages/NearbyShops'
import SmartRecommendations from './pages/SmartRecommendations'
import RetailerLanding from './pages/RetailerLanding'
import RetailerProducts from './pages/RetailerProducts'
import BarcodeScanner from './pages/BarcodeScanner'
import PriceManagement from './pages/PriceManagement'
import SalesInsights from './pages/SalesInsights'
import LocalReach from './pages/LocalReach'
import TrustedPlatform from './pages/TrustedPlatform'

function App() {
  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/retailer/login" element={<RetailerLogin />} />
          <Route path="/retailer/signup" element={<RetailerSignup />} />
          <Route path="/search" element={<Search />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/store/:shopId/product/:productId" element={<StoreProductDetail />} />
          <Route path="/retailer/dashboard" element={<RetailerDashboard />} />
          <Route path="/retailer/add-product" element={<AddProduct />} />
          <Route path="/retailer/products" element={<RetailerProducts />} />
          <Route path="/retailer/barcode-scanner" element={<BarcodeScanner />} />
          <Route path="/retailer/price-management" element={<PriceManagement />} />
          <Route path="/retailer/sales-insights" element={<SalesInsights />} />
          <Route path="/retailer/local-reach" element={<LocalReach />} />
          <Route path="/retailer/trusted-platform" element={<TrustedPlatform />} />
          <Route path="/lowest-price-finder" element={<LowestPriceFinder />} />
          <Route path="/nearby-shops" element={<NearbyShops />} />
          <Route path="/smart-recommendations" element={<SmartRecommendations />} />
          <Route path="/retailer-dashboard" element={<RetailerLanding />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

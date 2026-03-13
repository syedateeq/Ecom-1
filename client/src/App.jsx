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
        </Routes>
      </main>
    </div>
  )
}

export default App

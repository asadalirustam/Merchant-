import { useState, useEffect, useContext } from 'react';
import API from '../utils/api';
import { SettingsContext } from '../context/SettingsContext';
import { NotificationContext } from '../context/NotificationContext';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  QrCode,
  Download,
  Printer,
  X,
  Upload,
} from 'lucide-react';

const Products = () => {
  const { getCurrencySymbol } = useContext(SettingsContext);
  const { addToast } = useContext(NotificationContext);

  const currencySymbol = getCurrencySymbol();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'

  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [minimumStock, setMinimumStock] = useState(5);
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = `/products?page=${page}&limit=12&search=${searchTerm}&category=${selectedCategory}&stockStatus=${selectedStockStatus}`;
      const { data } = await API.get(url);
      if (data.success) {
        setProducts(data.data.products);
        setPages(data.data.pages);
      }
    } catch (error) {
      addToast('Error', 'Failed to retrieve product database', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await API.get('/categories');
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, selectedCategory, selectedStockStatus]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setSelectedProduct(null);
    setName('');
    setSku('');
    setBarcode('');
    setCategory(categories[0]?._id || '');
    setBrand('');
    setCostPrice(0);
    setSellingPrice(0);
    setDiscount(0);
    setQuantity(0);
    setMinimumStock(5);
    setDescription('');
    setImageFile(null);
    setImagePreview('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setModalMode('edit');
    setSelectedProduct(prod);
    setName(prod.name);
    setSku(prod.sku);
    setBarcode(prod.barcode || '');
    setCategory(prod.category?._id || '');
    setBrand(prod.brand || '');
    setCostPrice(prod.costPrice);
    setSellingPrice(prod.sellingPrice);
    setDiscount(prod.discount || 0);
    setQuantity(prod.quantity);
    setMinimumStock(prod.minimumStock || 5);
    setDescription(prod.description || '');
    setImageFile(null);
    setImagePreview(prod.productImage ? `http://localhost:5000${prod.productImage}` : '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !sku || !category || costPrice < 0 || sellingPrice < 0) {
      addToast('Validation Error', 'Please complete all required fields', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('sku', sku);
    formData.append('barcode', barcode || sku);
    formData.append('category', category);
    formData.append('brand', brand);
    formData.append('costPrice', costPrice);
    formData.append('sellingPrice', sellingPrice);
    formData.append('discount', discount);
    formData.append('quantity', quantity);
    formData.append('minimumStock', minimumStock);
    formData.append('description', description);
    if (imageFile) {
      formData.append('productImage', imageFile);
    }

    try {
      let res;
      if (modalMode === 'add') {
        res = await API.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await API.put(`/products/${selectedProduct._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (res.data.success) {
        addToast('Success', `Product ${modalMode === 'add' ? 'created' : 'updated'} successfully`, 'success');
        setIsModalOpen(false);
        fetchProducts();
      }
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const { data } = await API.delete(`/products/${id}`);
      if (data.success) {
        addToast('Success', 'Product deleted from registry', 'success');
        fetchProducts();
      }
    } catch (err) {
      addToast('Error', 'Failed to delete product', 'error');
    }
  };

  const openQrModal = (prod) => {
    setSelectedProduct(prod);
    setIsQrModalOpen(true);
  };

  const handlePrintQr = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - ${selectedProduct?.name}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; margin: 0; }
            img { width: 250px; height: 250px; }
            h2 { margin-top: 15px; margin-bottom: 5px; font-size: 18px; }
            p { color: #666; font-size: 14px; margin: 0; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <img src="${selectedProduct?.qrCode}" />
          <h2>${selectedProduct?.name}</h2>
          <p>SKU: ${selectedProduct?.sku}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
            <Package className="w-7 h-7 text-indigo-500" />
            Inventory Stock Items
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Manage products catalog, selling prices, minimum stock warning tiers, and barcodes.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Add Product Item
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-3 items-center shadow-xl no-print">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by SKU, Name or Barcode..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
          />
        </form>

        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPage(1);
          }}
          className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-350 outline-none w-48"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStockStatus}
          onChange={(e) => {
            setSelectedStockStatus(e.target.value);
            setPage(1);
          }}
          className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-350 outline-none w-44"
        >
          <option value="">All Stock Levels</option>
          <option value="low">⚠️ Low Stock Alerts</option>
          <option value="out">🛑 Out of Stock</option>
        </select>
      </div>

      {/* Products list grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm">Scanning catalogs...</div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm">No products found matching filters.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((prod) => (
            <div
              key={prod._id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden flex flex-col justify-between ${
                prod.quantity === 0
                  ? 'border-rose-900/40 bg-rose-950/5'
                  : prod.quantity <= prod.minimumStock
                  ? 'border-amber-900/40 bg-amber-950/5'
                  : 'border-slate-800'
              }`}
            >
              {/* Top Details & Image */}
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-center shrink-0 text-slate-650 overflow-hidden relative">
                  {prod.productImage ? (
                    <img
                      src={`http://localhost:5000${prod.productImage}`}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-slate-700" />
                  )}
                  {prod.quantity === 0 && (
                    <span className="absolute inset-0 bg-rose-950/80 flex items-center justify-center text-[9px] font-bold text-rose-300 uppercase tracking-widest text-center">
                      Out Stock
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-extrabold uppercase bg-slate-950 text-indigo-400 px-2 py-0.5 rounded border border-slate-850">
                    {prod.category?.name || 'Catalog'}
                  </span>
                  <h3 className="font-bold text-sm text-slate-200 truncate mt-2" title={prod.name}>
                    {prod.name}
                  </h3>
                  <p className="text-[9px] font-mono text-slate-500 truncate mt-0.5">SKU: {prod.sku}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    Brand: {prod.brand || 'Unbranded'}
                  </p>
                </div>
              </div>

              {/* Pricing & Stock Details */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-850/50 mt-4 text-[10px]">
                <div>
                  <span className="text-slate-500 block">Selling Price</span>
                  <span className="font-extrabold text-slate-100 text-xs mt-0.5 block">
                    {currencySymbol}
                    {prod.sellingPrice}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Stock Quantity</span>
                  <span
                    className={`font-extrabold text-xs mt-0.5 block ${
                      prod.quantity === 0
                        ? 'text-rose-400'
                        : prod.quantity <= prod.minimumStock
                        ? 'text-amber-400'
                        : 'text-indigo-400'
                    }`}
                  >
                    {prod.quantity} units
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Cost Price</span>
                  <span className="text-slate-400 mt-0.5 block">
                    {currencySymbol}
                    {prod.costPrice}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Discount %</span>
                  <span className="text-indigo-400 font-semibold mt-0.5 block">
                    {prod.discount || 0}%
                  </span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800/40 no-print">
                <button
                  onClick={() => openQrModal(prod)}
                  className="px-2.5 py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                  QR / Barcode
                </button>
                <button
                  onClick={() => openEditModal(prod)}
                  className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-850 rounded-xl transition-all ml-auto"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(prod._id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-850 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / UPDATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-200">
                {modalMode === 'add' ? 'Add Product Item' : 'Edit Product Item'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[calc(100vh-10rem)] overflow-y-auto">
              <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-2xl border border-slate-850">
                <div className="relative w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 overflow-hidden shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-7 h-7 text-slate-700" />
                  )}
                </div>
                <div>
                  <label className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-[10px] font-semibold cursor-pointer flex items-center gap-1 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    Product Image
                    <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Product Item Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Wireless Mouse"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">SKU Code (Unique)</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="MS-WR-01"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Barcode Code</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="88998877"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-200 outline-none"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Logitech"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Cost Price</label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    min={0}
                    step="0.01"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Selling Price</label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    min={0}
                    step="0.01"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Discount %</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Quantity Level</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min={0}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Minimum Alert Threshold</label>
                  <input
                    type="number"
                    value={minimumStock}
                    onChange={(e) => setMinimumStock(Number(e.target.value))}
                    min={0}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Description Details</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR CODE MODAL */}
      {isQrModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden p-6 text-center space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-850">
              <h3 className="font-bold text-xs text-slate-300 uppercase tracking-wider">Product Identification QR</h3>
              <button onClick={() => setIsQrModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="bg-white p-4 rounded-xl inline-block border border-slate-200 mx-auto shadow-inner">
              <img src={selectedProduct.qrCode} alt="Product QR" className="w-44 h-44" />
            </div>

            <div>
              <h4 className="font-extrabold text-sm text-slate-100">{selectedProduct.name}</h4>
              <p className="text-[10px] font-mono text-slate-400 mt-1">SKU: {selectedProduct.sku}</p>
              <p className="text-[10px] text-slate-500">Barcode: {selectedProduct.barcode || selectedProduct.sku}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={handlePrintQr}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                Print QR
              </button>
              <a
                href={selectedProduct.qrCode}
                download={`qr-${selectedProduct.sku}.png`}
                className="py-2 px-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Download QR
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;

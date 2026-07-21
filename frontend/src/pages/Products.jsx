import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { NotificationContext } from '../context/NotificationContext';
import { Html5Qrcode } from 'html5-qrcode';
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
  ScanLine,
  Camera,
  CheckCircle2,
} from 'lucide-react';

const Products = () => {
  const { user } = useContext(AuthContext);
  const { getCurrencySymbol } = useContext(SettingsContext);
  const { addToast } = useContext(NotificationContext);

  const currencySymbol = getCurrencySymbol();
  const isCEO = user?.role === 'CEO';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatus, setStockStatus] = useState(location.state?.stockStatus || '');

  // Synchronize stock filter changes from navigation state (e.g. clicking dashboard cards)
  useEffect(() => {
    if (location.state && location.state.stockStatus !== undefined) {
      setStockStatus(location.state.stockStatus);
      setPage(1);
    }
  }, [location.state]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');

  const [selectedProduct, setSelectedProduct] = useState(null);

  // QR Scanner state
  const [scannerStatus, setScannerStatus] = useState('idle'); // idle | scanning | found | error
  const [scannedProduct, setScannedProduct] = useState(null);
  const [scanError, setScanError] = useState('');
  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'qr-scanner-container';
  // Form Fields
  const [name, setName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = `/products?page=${page}&limit=12&search=${searchTerm}&category=${categoryFilter}&stockStatus=${stockStatus}`;
      const { data } = await API.get(url);
      if (data.success) {
        setProducts(data.data.products);
        setPages(data.data.pages);
      }
    } catch (error) {
      addToast('Error', 'Failed to retrieve products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter, stockStatus]);

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
    if (isCEO) return;
    setModalMode('add');
    setSelectedProduct(null);
    setName('');
    setProductCode('');
    setCategory('');
    setPrice('');
    setCostPrice('');
    setQuantity('');
    setDescription('');
    setImageFile(null);
    setImagePreview('');
    setIsCustomCategory(false);
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    if (isCEO) return;
    setModalMode('edit');
    setSelectedProduct(prod);
    setName(prod.name);
    setProductCode(prod.productCode);
    setCategory(prod.category || '');
    setPrice(prod.price);
    setCostPrice(prod.costPrice ?? '');
    setQuantity(prod.quantity);
    setDescription(prod.description || '');
    setImageFile(null);
    setImagePreview(prod.productImage ? `http://localhost:5000${prod.productImage}` : '');
    
    // Check if category is standard or custom
    const defaultCats = ['Electronics', 'Groceries', 'Apparel', 'Home & Kitchen', 'Office Supplies'];
    if (prod.category && !defaultCats.includes(prod.category)) {
      setIsCustomCategory(true);
    } else {
      setIsCustomCategory(false);
    }

    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isCEO) return;

    if (!name || !productCode || !category || price === '') {
      addToast('Validation Error', 'Please complete all required fields', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('productCode', productCode);
    formData.append('category', category);
    formData.append('price', price === '' ? 0 : Number(price));
    formData.append('costPrice', costPrice === '' ? 0 : Number(costPrice));
    formData.append('quantity', quantity === '' ? 0 : Number(quantity));
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
    if (isCEO) return;
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const { data } = await API.delete(`/products/${id}`);
      if (data.success) {
        addToast('Success', 'Product deleted successfully', 'success');
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

  // ─── QR SCANNER LOGIC ─────────────────────────────────────────────────────
  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        // State 2 = SCANNING, State 3 = PAUSED
        if (state === 2 || state === 3) {
          await html5QrCodeRef.current.stop();
        }
      } catch (_) {
        // ignore errors during stop
      }
      html5QrCodeRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async () => {
    setScannerStatus('scanning');
    setScanError('');
    setScannedProduct(null);

    // Small delay to let the DOM mount the container
    await new Promise((r) => setTimeout(r, 300));

    try {
      const qrCode = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = qrCode;

      await qrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          // QR detected — stop scanner immediately
          await stopScanner();
          setScannerStatus('found');

          // Try to look up product by scanned value (could be product _id or productCode)
          try {
            const { data } = await API.get(`/products/info/${encodeURIComponent(decodedText)}`);
            if (data.success && data.data) {
              setScannedProduct(data.data);
            } else {
              // Product not found — pre-fill the add form with scanned code
              setScannedProduct(null);
              openAddModalWithCode(decodedText);
            }
          } catch {
            // Product not found — pre-fill add form
            setScannedProduct(null);
            openAddModalWithCode(decodedText);
          }
        },
        () => {} // ignore frame errors
      );
    } catch (err) {
      setScannerStatus('error');
      setScanError(
        err?.message?.includes('Permission')
          ? 'Camera permission denied. Please allow camera access and try again.'
          : 'Unable to start camera. Make sure your device has a camera and the browser has permission.'
      );
      html5QrCodeRef.current = null;
    }
  }, [stopScanner]);

  const openScannerModal = () => {
    if (isCEO) return;
    setIsScannerOpen(true);
    setScannerStatus('idle');
    setScanError('');
    setScannedProduct(null);
  };

  const closeScannerModal = async () => {
    await stopScanner();
    setIsScannerOpen(false);
    setScannerStatus('idle');
    setScannedProduct(null);
  };

  const openAddModalWithCode = (code) => {
    setModalMode('add');
    setSelectedProduct(null);
    setName('');
    setProductCode(code);
    setCategory('');
    setPrice('');
    setCostPrice('');
    setQuantity('');
    setDescription('');
    setImageFile(null);
    setImagePreview('');
    setIsCustomCategory(false);
    setIsScannerOpen(false);
    setIsModalOpen(true);
  };

  const handleScannerFoundEdit = (prod) => {
    setIsScannerOpen(false);
    openEditModal(prod);
  };

  const handleScannerFoundAdd = (prod) => {
    // Product already exists — just close scanner, product is already in list
    setIsScannerOpen(false);
    addToast('Info', `Product "${prod.name}" already exists in catalog`, 'info');
  };

  const handleScanAgain = async () => {
    setScannerStatus('scanning');
    setScannedProduct(null);
    setScanError('');
    await startScanner();
  };

  const handlePrintQr = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - ${selectedProduct?.name}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; margin: 0; }
            img { width: 220px; height: 220px; }
            h2 { margin-top: 15px; margin-bottom: 5px; font-size: 16px; }
            p { color: #666; font-size: 12px; margin: 0; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <img src="${selectedProduct?.qrCode}" />
          <h2>${selectedProduct?.name}</h2>
          <p>Code: ${selectedProduct?.productCode}</p>
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
            Product Registry
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            {isCEO
              ? 'CEO Read-only view of products catalog, stock counts, and prices.'
              : 'Admin workspace for registering products, adjusting stock levels, and printing QR codes.'}
          </p>
        </div>
        {!isCEO && (
          <div className="flex items-center gap-2">
            <button
              onClick={openScannerModal}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-lg"
            >
              <ScanLine className="w-4 h-4 text-indigo-400" />
              Scan QR
            </button>
            <button
              onClick={openAddModal}
              className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        )}
      </div>

      {/* Filter Row */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-3 items-center shadow-xl no-print">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Code or Name..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
          />
        </form>

        <input
          type="text"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          placeholder="Filter by Category..."
          className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-200 outline-none w-48"
        />

        <select
          value={stockStatus}
          onChange={(e) => {
            setStockStatus(e.target.value);
            setPage(1);
          }}
          className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-350 outline-none w-44"
        >
          <option value="">All Stock Levels</option>
          <option value="low">⚠️ Low Stock (Qty &le; 5)</option>
          <option value="out">🛑 Out of Stock</option>
        </select>
      </div>

      {/* Products list grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm">Scanning products...</div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm">No products found matching parameters.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((prod) => (
            <div
              key={prod._id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden flex flex-col justify-between ${
                prod.quantity === 0
                  ? 'border-rose-900/40 bg-rose-950/5'
                  : prod.quantity <= 5
                  ? 'border-amber-900/40 bg-amber-950/5'
                  : 'border-slate-800'
              }`}
            >
              {/* Product Info */}
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
                    {prod.category || 'General'}
                  </span>
                  <h3 className="font-bold text-sm text-slate-200 truncate mt-2" title={prod.name}>
                    {prod.name}
                  </h3>
                  <p className="text-[9px] font-mono text-slate-500 truncate mt-0.5">Code: {prod.productCode}</p>
                </div>
              </div>

              {/* Price & Qty details */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-850/50 mt-4 text-[10px] font-semibold text-slate-400">
                <div>
                  <span className="text-slate-500 block">Product Price</span>
                  <span className="font-extrabold text-slate-100 text-xs mt-0.5 block">
                    {currencySymbol}
                    {prod.price}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Stock Quantity</span>
                  <span
                    className={`font-extrabold text-xs mt-0.5 block ${
                      prod.quantity === 0
                        ? 'text-rose-455'
                        : prod.quantity <= 5
                        ? 'text-amber-450'
                        : 'text-indigo-400'
                    }`}
                  >
                    {prod.quantity} units
                  </span>
                </div>
                <div className="col-span-2 border-t border-slate-850/40 pt-1.5 mt-1.5 flex justify-between text-[8px] text-slate-500">
                  <span>By: {prod.createdBy?.name || 'System'}</span>
                  <span>Updated: {new Date(prod.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800/40 no-print">
                <button
                  onClick={() => openQrModal(prod)}
                  className="px-2.5 py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-355 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                  View QR
                </button>

                {!isCEO && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / UPDATE MODAL (Admins Only) */}
      {isModalOpen && !isCEO && (
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
                  placeholder="e.g. Wireless Keyboard"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-100 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Product Code (Unique)</label>
                  <input
                    type="text"
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    placeholder="KB-WR-01"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-100 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Category</label>
                  {!isCustomCategory ? (
                    <select
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomCategory(true);
                          setCategory('');
                        } else {
                          setCategory(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-100 outline-none cursor-pointer"
                      required
                    >
                      <option value="">Select Category</option>
                      {Array.from(new Set([
                        'Electronics',
                        'Groceries',
                        'Apparel',
                        'Home & Kitchen',
                        'Office Supplies',
                        ...products.map((p) => p.category).filter(Boolean)
                      ])).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__custom__" className="text-indigo-400 font-semibold">+ Add Custom Category...</option>
                    </select>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Type new category..."
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 pr-8 text-xs text-slate-100 outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(false);
                          setCategory('');
                        }}
                        className="absolute right-2 top-2.5 text-slate-450 hover:text-slate-200 cursor-pointer"
                        title="Choose from list"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Selling Price ({currencySymbol})</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min={0}
                    step="0.01"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-100 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-amber-400 block mb-1 font-semibold">Cost Price ({currencySymbol}) <span className="text-slate-500 font-normal">(purchase cost)</span></label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-amber-900/40 focus:border-amber-500 rounded-xl p-2.5 text-xs text-slate-100 outline-none"
                  />
                </div>
              </div>

              {/* Stock Quantity */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min={0}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-100 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Description Details</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
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

      {/* QR CODE VIEW MODAL */}
      {isQrModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden p-6 text-center space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-850">
              <h3 className="font-bold text-xs text-slate-300 uppercase tracking-wider">Product ID QR Code</h3>
              <button onClick={() => setIsQrModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl inline-block border border-slate-200 mx-auto shadow-inner">
              <img src={selectedProduct.qrCode} alt="Product QR" className="w-44 h-44" />
            </div>

            <div>
              <h4 className="font-extrabold text-sm text-slate-100">{selectedProduct.name}</h4>
              <p className="text-[10px] font-mono text-slate-400 mt-1">Code: {selectedProduct.productCode}</p>
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
                download={`qr-${selectedProduct.productCode}.png`}
                className="py-2 px-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Download QR
              </a>
            </div>
          </div>
        </div>
      )}

      {/* QR SCANNER MODAL */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-200">Scan Product QR Code</h3>
              </div>
              <button onClick={closeScannerModal} className="text-slate-400 hover:text-slate-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Idle state */}
              {scannerStatus === 'idle' && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-center">
                    <Camera className="w-9 h-9 text-indigo-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-200">Point camera at a QR Code</p>
                    <p className="text-xs text-slate-500 mt-1">The product will be added or pre-filled automatically</p>
                  </div>
                  <button
                    onClick={startScanner}
                    className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    Start Camera
                  </button>
                </div>
              )}

              {/* Scanning state — camera feed */}
              {scannerStatus === 'scanning' && (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-indigo-700/40 bg-black">
                    {/* Scanner container — html5-qrcode mounts here */}
                    <div id={scannerContainerId} className="w-full" style={{ minHeight: '280px' }} />
                    {/* Animated corner brackets overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative w-48 h-48">
                        <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-indigo-400 rounded-tl-lg" />
                        <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-indigo-400 rounded-tr-lg" />
                        <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-indigo-400 rounded-bl-lg" />
                        <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-indigo-400 rounded-br-lg" />
                        {/* Scanning line animation */}
                        <span
                          className="absolute left-1 right-1 h-0.5 bg-indigo-400/80 rounded-full"
                          style={{ animation: 'scanline 2s ease-in-out infinite', top: '50%' }}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-xs text-slate-400 animate-pulse">Scanning... hold QR code steady</p>
                  <button
                    onClick={closeScannerModal}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Found state — existing product */}
              {scannerStatus === 'found' && scannedProduct && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <p className="text-xs text-emerald-300 font-semibold">Product found in catalog!</p>
                  </div>

                  <div className="flex gap-3 bg-slate-950 rounded-xl p-3 border border-slate-850">
                    <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {scannedProduct.productImage ? (
                        <img src={`http://localhost:5000${scannedProduct.productImage}`} alt={scannedProduct.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-slate-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-200 truncate">{scannedProduct.name}</p>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">Code: {scannedProduct.productCode}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[10px] text-indigo-400 font-semibold">{scannedProduct.quantity} units</span>
                        <span className="text-[10px] text-slate-400">{scannedProduct.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleScanAgain}
                      className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Scan Again
                    </button>
                    <button
                      onClick={() => handleScannerFoundEdit(scannedProduct)}
                      className="py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Edit Product
                    </button>
                  </div>
                  <button
                    onClick={closeScannerModal}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}

              {/* Error state */}
              {scannerStatus === 'error' && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 bg-rose-950/30 border border-rose-800/40 rounded-xl p-3">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-300">{scanError}</p>
                  </div>
                  <button
                    onClick={() => setScannerStatus('idle')}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scan line animation */}
      <style>{`
        @keyframes scanline {
          0%   { transform: translateY(-80px); opacity: 0.6; }
          50%  { transform: translateY(80px);  opacity: 1;   }
          100% { transform: translateY(-80px); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default Products;

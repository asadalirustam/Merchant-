import { useState, useEffect, useContext, useRef } from 'react';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { NotificationContext } from '../context/NotificationContext';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  UserPlus,
  CreditCard,
  Banknote,
  Globe,
  Receipt,
  Printer,
  Download,
  X,
  Store,
} from 'lucide-react';

const POSBilling = () => {
  const { user } = useContext(AuthContext);
  const { settings, getCurrencySymbol } = useContext(SettingsContext);
  const { addToast } = useContext(NotificationContext);

  const currencySymbol = getCurrencySymbol();

  // Search & Products
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(settings.taxPercentage || 0);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Customer State
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Checkout Receipt State
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    setTaxPercent(settings.taxPercentage || 0);
  }, [settings]);

  const fetchProducts = async () => {
    try {
      const { data } = await API.get('/products?limit=200');
      if (data.success) {
        setProducts(data.data.products);
        setFilteredProducts(data.data.products);
      }
    } catch (error) {
      addToast('Error', 'Failed to retrieve product database', 'error');
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data } = await API.get('/customers');
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Search handler (SKU / Barcode / Name / QR Code)
  const handleSearchChange = (val) => {
    setSearchTerm(val);
    if (!val) {
      setFilteredProducts(products);
      return;
    }
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(val.toLowerCase()) ||
        p.sku.toLowerCase().includes(val.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(val.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  // Scanned input (triggers exact lookup on Enter)
  const handleSearchKeyPress = async (e) => {
    if (e.key === 'Enter' && searchTerm) {
      e.preventDefault();
      try {
        // Try searching for an exact match by SKU/Barcode
        const { data } = await API.get(`/products/info/${searchTerm}`);
        if (data.success && data.data) {
          addToCart(data.data);
          setSearchTerm('');
          setFilteredProducts(products);
          addToast('Product Added', `${data.data.name} added to cart`, 'success');
        }
      } catch (err) {
        // Fallback: add the first filtered item if only one matches
        if (filteredProducts.length === 1) {
          addToCart(filteredProducts[0]);
          setSearchTerm('');
          setFilteredProducts(products);
        } else {
          addToast('Scan Error', 'No exact product SKU or Barcode found', 'error');
        }
      }
    }
  };

  const addToCart = (product) => {
    if (product.quantity <= 0) {
      addToast('Out of Stock', `${product.name} is out of stock!`, 'error');
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product === product._id);
      if (existingItem) {
        if (existingItem.quantity >= product.quantity) {
          addToast('Stock Limit', `Only ${product.quantity} units available in inventory`, 'warning');
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prevCart,
        {
          product: product._id,
          name: product.name,
          sku: product.sku,
          price: product.sellingPrice,
          originalDiscount: product.discount || 0,
          maxStock: product.quantity,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product !== productId));
  };

  const adjustQty = (productId, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return item;
          if (newQty > item.maxStock) {
            addToast('Stock Limit', `Only ${item.maxStock} units available`, 'warning');
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  // Math totals
  const subTotal = cart.reduce(
    (acc, curr) => acc + curr.price * curr.quantity * (1 - curr.originalDiscount / 100),
    0
  );
  const discountAmount = subTotal * (discountPercent / 100);
  const taxAmount = (subTotal - discountAmount) * (taxPercent / 100);
  const grandTotal = subTotal - discountAmount + taxAmount;

  const handleQuickCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    try {
      const { data } = await API.post('/customers', {
        name: newCustName,
        phone: newCustPhone,
      });

      if (data.success) {
        addToast('Customer Created', `Registered ${newCustName} successfully`, 'success');
        fetchCustomers();
        setSelectedCustomerId(data.data._id);
        setIsCustomerModalOpen(false);
        setNewCustName('');
        setNewCustPhone('');
      }
    } catch (err) {
      addToast('Error', err.response?.data?.message || 'Failed to create customer', 'error');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      addToast('Error', 'Cart is empty', 'error');
      return;
    }

    try {
      const salePayload = {
        customer: selectedCustomerId || null,
        items: cart.map((item) => ({
          product: item.product,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.originalDiscount,
        })),
        subTotal,
        discountAmount,
        taxAmount,
        grandTotal,
        paymentMethod,
        notes,
      };

      const { data } = await API.post('/sales', salePayload);
      if (data.success) {
        addToast('Checkout Success', 'Invoice registered successfully', 'success');
        setActiveInvoice(data.data);
        setIsReceiptModalOpen(true);

        // Reset POS Screen
        setCart([]);
        setDiscountPercent(0);
        setNotes('');
        setSelectedCustomerId('');
        fetchProducts(); // Refresh stock
      }
    } catch (error) {
      addToast('Checkout Failed', error.response?.data?.message || 'Transaction failed', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8.5rem)] overflow-hidden no-print">
      {/* Left Columns: Scanning bar & Product Catalog list */}
      <div className="lg:col-span-2 flex flex-col gap-4 h-full overflow-hidden">
        {/* Scanning block */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-3 shadow-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              placeholder="Search by Name or Scan SKU/Barcode/QR Code (Press Enter)"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Visual products catalog grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex-1 overflow-y-auto">
          <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Product Catalog</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((prod) => (
              <div
                key={prod._id}
                onClick={() => addToCart(prod)}
                className={`bg-slate-950 border border-slate-850 hover:border-indigo-600/50 rounded-2xl p-3 flex flex-col justify-between shadow transition-all cursor-pointer select-none group relative overflow-hidden ${
                  prod.quantity === 0 ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                {prod.discount > 0 && (
                  <span className="absolute top-2 left-2 bg-indigo-650 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-md">
                    -{prod.discount}%
                  </span>
                )}
                {/* Image or stock indicator */}
                <div className="aspect-square w-full rounded-xl bg-slate-900 overflow-hidden border border-slate-850 flex items-center justify-center text-slate-600 relative">
                  {prod.productImage ? (
                    <img
                      src={`http://localhost:5000${prod.productImage}`}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-slate-700" />
                  )}
                  {prod.quantity === 0 && (
                    <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-xs font-black text-rose-500 uppercase tracking-widest">
                      Sold Out
                    </div>
                  )}
                </div>
                {/* Details */}
                <div className="mt-3">
                  <h4 className="font-semibold text-xs text-slate-200 truncate">{prod.name}</h4>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">{prod.sku}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-slate-100 text-xs">
                      {currencySymbol}
                      {prod.sellingPrice}
                    </span>
                    <span
                      className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                        prod.quantity <= prod.minimumStock
                          ? 'bg-rose-950 text-rose-300'
                          : 'bg-indigo-950 text-indigo-300'
                      }`}
                    >
                      {prod.quantity} Left
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: POS Cart, Customer quick-select and checkout button */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4 text-indigo-400" />
            Checkout Cart ({cart.length})
          </h3>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-[10px] text-rose-400 hover:text-rose-300 font-medium"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Customer select */}
        <div className="p-4 border-b border-slate-800/40 bg-slate-950/10 flex gap-2 items-center">
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-200 outline-none transition-all"
          >
            <option value="">Guest (Anonymous Checkout)</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="p-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 rounded-xl transition-all shrink-0"
            title="Quick add customer"
          >
            <UserPlus className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Items listing list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
              <ShoppingCart className="w-10 h-10 text-slate-700" />
              <p className="text-xs">Your billing cart is empty.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product} className="flex gap-3 bg-slate-950 p-3 rounded-xl border border-slate-850">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs text-slate-200 truncate">{item.name}</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">{item.sku}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="font-bold text-slate-200 text-xs">
                      {currencySymbol}
                      {item.price}
                    </span>
                    {item.originalDiscount > 0 && (
                      <span className="text-[9px] text-indigo-400 font-semibold bg-indigo-950/50 px-1 py-0.2 rounded">
                        -{item.originalDiscount}%
                      </span>
                    )}
                  </div>
                </div>
                {/* Adjuster */}
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeFromCart(item.product)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-0.5 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                    <button
                      onClick={() => adjustQty(item.product, -1)}
                      className="p-1 hover:bg-slate-850 rounded text-slate-400"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-slate-200 w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => adjustQty(item.product, 1)}
                      className="p-1 hover:bg-slate-850 rounded text-slate-400"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pricing calculations block */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Discount (%)</label>
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                min={0}
                max={100}
                className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl p-1.5 text-center text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Tax (%)</label>
              <input
                type="number"
                value={taxPercent}
                onChange={(e) => setTaxPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                min={0}
                max={100}
                className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl p-1.5 text-center text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <textarea
              placeholder="Add checkout cashier notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={1}
              className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-200 outline-none resize-none placeholder:text-slate-600"
            />
          </div>

          {/* Totals and payment buttons */}
          <div className="border-t border-slate-850 pt-3 space-y-2 text-xs font-medium text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-slate-200">
                {currencySymbol}
                {subTotal.toFixed(2)}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between">
                <span>Discount ({discountPercent}%)</span>
                <span className="text-indigo-400">
                  -{currencySymbol}
                  {discountAmount.toFixed(2)}
                </span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between">
                <span>Sales Tax ({taxPercent}%)</span>
                <span className="text-slate-200">
                  {currencySymbol}
                  {taxAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-slate-100 border-t border-slate-850/50 pt-2 pb-1">
              <span>Grand Total</span>
              <span className="text-indigo-400">
                {currencySymbol}
                {grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2 py-1">
            {[
              { id: 'Cash', label: 'Cash', icon: Banknote },
              { id: 'Card', label: 'Card', icon: CreditCard },
              { id: 'Online', label: 'Online', icon: Globe },
            ].map((pm) => {
              const Icon = pm.icon;
              return (
                <button
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-[10px] font-bold cursor-pointer transition-all ${
                    paymentMethod === pm.id
                      ? 'bg-indigo-650 border-indigo-500 text-white shadow shadow-indigo-600/30'
                      : 'bg-slate-950 border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{pm.label}</span>
                </button>
              );
            })}
          </div>

          {/* Checkout Submit */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-550 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer disabled:cursor-not-allowed"
          >
            <Receipt className="w-4 h-4" />
            Complete POS Checkout
          </button>
        </div>
      </div>

      {/* QUICK CUSTOMER MODAL */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <h3 className="font-bold text-slate-200">Register Buyer</h3>
            </div>
            <form onSubmit={handleQuickCustomerSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Name</label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+1 (555) 012-3456"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 text-xs text-slate-100 outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-350 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT / INVOICE PRINT MODAL */}
      {isReceiptModalOpen && activeInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          {/* Modal Container */}
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200 print-card no-print">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center no-print">
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Receipt className="w-4 h-4 text-indigo-500" />
                POS Invoice Created
              </h3>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Receipt Block */}
            <div id="receipt-print-area" className="p-6 space-y-6 text-center select-text">
              {/* Logo/Branding */}
              <div className="flex flex-col items-center">
                {settings.logo ? (
                  <img src={`http://localhost:5000${settings.logo}`} alt="Shop Logo" className="w-12 h-12 rounded object-cover mb-2" />
                ) : (
                  <div className="w-10 h-10 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2 font-black text-sm">
                    {settings.shopName?.slice(0,2).toUpperCase()}
                  </div>
                )}
                <h2 className="font-black text-base uppercase tracking-tight">{settings.shopName}</h2>
                <p className="text-[10px] text-slate-500 leading-normal max-w-[200px] mt-1">{settings.address}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Phone: {settings.phone}</p>
              </div>

              {/* Invoice details */}
              <div className="text-left border-y border-dashed border-slate-300 py-3 text-[10px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Invoice No:</span>
                  <span className="font-bold text-slate-900">{activeInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date / Time:</span>
                  <span>{new Date(activeInvoice.date).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier Name:</span>
                  <span>{activeInvoice.cashier?.name}</span>
                </div>
                {activeInvoice.customer && (
                  <div className="flex justify-between">
                    <span>Customer Name:</span>
                    <span className="font-semibold text-slate-800">{activeInvoice.customer.name}</span>
                  </div>
                )}
              </div>

              {/* Product Listing */}
              <div className="text-left space-y-2">
                <div className="grid grid-cols-4 text-[9px] font-extrabold uppercase text-slate-500 border-b pb-1.5">
                  <span className="col-span-2">Item</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Price</span>
                </div>
                <div className="divide-y divide-slate-100 text-[10px] max-h-48 overflow-y-auto">
                  {activeInvoice.items?.map((item) => (
                    <div key={item.product} className="grid grid-cols-4 py-2 font-medium">
                      <div className="col-span-2 leading-tight">
                        <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                        {item.discount > 0 && <span className="text-[8px] text-indigo-600">Discount -{item.discount}%</span>}
                      </div>
                      <span className="text-center text-slate-600 font-semibold">{item.quantity}</span>
                      <span className="text-right font-bold text-slate-900">
                        {currencySymbol}
                        {((item.price * (1 - item.discount / 100)) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aggregates */}
              <div className="border-t border-dashed border-slate-350 pt-3 text-[10px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{currencySymbol}{activeInvoice.subTotal?.toFixed(2)}</span>
                </div>
                {activeInvoice.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span className="text-indigo-600">-{currencySymbol}{activeInvoice.discountAmount?.toFixed(2)}</span>
                  </div>
                )}
                {activeInvoice.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Sales Tax:</span>
                    <span>{currencySymbol}{activeInvoice.taxAmount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-black text-slate-900 border-t border-slate-200 pt-1.5 pb-0.5">
                  <span>Grand Total:</span>
                  <span>{currencySymbol}{activeInvoice.grandTotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1">
                  <span>Paid Via:</span>
                  <span className="uppercase text-[9px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-800">{activeInvoice.paymentMethod}</span>
                </div>
              </div>

              {/* Thank you note & QR Code */}
              <div className="flex flex-col items-center pt-2 space-y-3.5 border-t border-slate-200">
                <p className="text-[10px] text-slate-500 italic font-medium leading-normal max-w-[220px]">
                  {settings.invoiceFooter}
                </p>
                <div className="flex flex-col items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {/* Dynamic invoice validation QR */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${activeInvoice.invoiceNumber}`}
                    alt="Invoice QR"
                    className="w-18 h-18"
                  />
                  <span className="text-[8px] text-slate-400 mt-1 font-mono tracking-widest uppercase">{activeInvoice.invoiceNumber}</span>
                </div>
                <p className="text-[9px] font-bold text-slate-400 tracking-wider">Powered by Antigravity ERP</p>
              </div>
            </div>

            {/* Receipt Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-3.5 no-print">
              <button
                onClick={handlePrint}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow border border-slate-700"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
              <button
                onClick={handlePrint} // Standard browsers permit PDF saving on Print dialog directly
                className="py-2 px-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow"
              >
                <Download className="w-4 h-4" />
                Save PDF Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSBilling;

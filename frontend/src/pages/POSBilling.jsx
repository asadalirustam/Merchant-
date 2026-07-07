import { useState, useEffect, useRef, useContext } from 'react';
import QRCode from 'qrcode';
import API from '../utils/api';
import { SettingsContext } from '../context/SettingsContext';
import { NotificationContext } from '../context/NotificationContext';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  QrCode,
  DollarSign,
  User,
  Percent,
  CheckCircle,
  Printer,
  X,
  Store,
} from 'lucide-react';

const POSBilling = () => {
  const { settings, getCurrencySymbol } = useContext(SettingsContext);
  const { addToast } = useContext(NotificationContext);
  const currencySymbol = getCurrencySymbol();

  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Guest');
  const [discountPercent, setDiscountPercent] = useState(0); // Discount in percentage
  const [taxPercent, setTaxPercent] = useState(settings.taxPercentage || 0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Checkout modal
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [invoiceQrDataUrl, setInvoiceQrDataUrl] = useState('');

  const searchInputRef = useRef(null);

  // Generate QR code data URL whenever a new checkout result is available
  useEffect(() => {
    if (checkoutResult?.invoiceNumber) {
      QRCode.toDataURL(checkoutResult.invoiceNumber, {
        width: 160,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      })
        .then((url) => setInvoiceQrDataUrl(url))
        .catch(() => setInvoiceQrDataUrl(''));
    } else {
      setInvoiceQrDataUrl('');
    }
  }, [checkoutResult]);

  const fetchAllProducts = async () => {
    try {
      const { data } = await API.get('/products');
      if (data.success) {
        const list = data.data.products || [];
        setAllProducts(list);
        setProducts(list);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Focus search input on mount and load products
  useEffect(() => {
    fetchAllProducts();
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (val.trim().length === 0) {
      setProducts(allProducts);
      return;
    }

    const query = val.toLowerCase();
    const filtered = allProducts.filter(
      (prod) =>
        prod.name.toLowerCase().includes(query) ||
        prod.productCode.toLowerCase().includes(query) ||
        (prod.category && prod.category.toLowerCase().includes(query))
    );
    setProducts(filtered);
  };

  const addToCart = (product) => {
    if (product.quantity <= 0) {
      addToast('Out of Stock', `${product.name} is out of stock.`, 'error');
      return;
    }

    const existingIndex = cart.findIndex((item) => item.product === product._id);

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= product.quantity) {
        addToast('Stock Limit Reached', `Only ${product.quantity} units are available.`, 'warning');
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      updatedCart[existingIndex].total = updatedCart[existingIndex].quantity * product.price;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          product: product._id,
          name: product.name,
          productCode: product.productCode,
          price: product.price,
          quantity: 1,
          maxQuantity: product.quantity,
          total: product.price,
        },
      ]);
    }

    setSearchQuery('');
    setProducts(allProducts);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const updateQuantity = (productId, change) => {
    const index = cart.findIndex((item) => item.product === productId);
    if (index === -1) return;

    const updatedCart = [...cart];
    const newQty = updatedCart[index].quantity + change;

    if (newQty <= 0) {
      updatedCart.splice(index, 1);
    } else {
      if (newQty > updatedCart[index].maxQuantity) {
        addToast('Stock Limit Reached', `Only ${updatedCart[index].maxQuantity} units are available.`, 'warning');
        return;
      }
      updatedCart[index].quantity = newQty;
      updatedCart[index].total = newQty * updatedCart[index].price;
    }
    setCart(updatedCart);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product !== productId));
  };

  // Calculations
  const getSubtotal = () => cart.reduce((acc, item) => acc + item.total, 0);
  const getDiscountAmount = () => (getSubtotal() * (Number(discountPercent) / 100));
  const getTaxAmount = () => ((getSubtotal() - getDiscountAmount()) * (Number(taxPercent) / 100));
  const getGrandTotal = () => Math.max(0, getSubtotal() - getDiscountAmount() + getTaxAmount());

  const handleCheckout = async () => {
    if (cart.length === 0) {
      addToast('Empty Cart', 'Please add items to your checkout cart first.', 'error');
      return;
    }

    setCheckoutLoading(true);

    const payload = {
      customerName,
      items: cart.map((item) => ({
        product: item.product,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      subTotal: getSubtotal(),
      discount: getDiscountAmount(),
      tax: getTaxAmount(),
      grandTotal: getGrandTotal(),
      paymentMethod,
    };

    try {
      const { data } = await API.post('/sales', payload);
      if (data.success) {
        addToast('Success', 'Checkout completed successfully', 'success');
        setCheckoutResult(data.data);
        setIsReceiptModalOpen(true);
        // Clear Cart
        setCart([]);
        setCustomerName('Guest');
        setDiscountPercent(0);
        // Refresh product list to update remaining stock quantities
        fetchAllProducts();
      }
    } catch (error) {
      addToast('Checkout Failed', error.response?.data?.message || 'Transaction could not be completed', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${checkoutResult?.invoiceNumber}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; font-size: 12px; margin: 15px; color: #000; }
            .text-center { text-align: center; }
            .header { margin-bottom: 20px; line-height: 1.6; }
            .title { font-size: 16px; font-weight: bold; margin: 5px 0; }
            .divider { border-bottom: 1px dashed #000; margin: 12px 0; }
            .grid-table { width: 100%; border-collapse: collapse; }
            .grid-table th { text-align: left; border-bottom: 1px dashed #000; padding-bottom: 6px; }
            .grid-table td { padding: 6px 0; }
            .totals { width: 100%; margin-top: 10px; }
            .totals td { padding: 4px 0; }
            .totals-bold { font-weight: bold; font-size: 13px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="text-center header">
            <div class="title">${settings.shopName}</div>
            <div>${settings.shopAddress || ''}</div>
            <div>Tel: ${settings.phone || ''}</div>
            <div>Invoice: ${checkoutResult?.invoiceNumber}</div>
            <div>Date: ${new Date(checkoutResult?.date).toLocaleDateString()} | Time: ${new Date(checkoutResult?.date).toLocaleTimeString()}</div>
          </div>
          
          <div class="divider"></div>
          
          <table class="grid-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${checkoutResult?.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">${currencySymbol}${item.price.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <table class="totals">
            <tr>
              <td>Grand Total:</td>
              <td style="text-align: right;" class="totals-bold">${currencySymbol}${checkoutResult?.grandTotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Payment Mode:</td>
              <td style="text-align: right;">${checkoutResult?.paymentMethod}</td>
            </tr>
            <tr>
              <td>Cashier:</td>
              <td style="text-align: right;">${checkoutResult?.cashierName}</td>
            </tr>
            <tr>
              <td>Customer:</td>
              <td style="text-align: right;">${checkoutResult?.customerName}</td>
            </tr>
          </table>
          
          <div class="divider"></div>
          ${invoiceQrDataUrl ? `
          <div class="text-center" style="margin-top: 14px;">
            <img src="${invoiceQrDataUrl}" alt="Invoice QR" style="width:110px;height:110px;margin:0 auto;display:block;" />
            <div style="font-size:9px;color:#666;margin-top:4px;">Scan to verify invoice</div>
            <div style="font-size:8px;color:#999;margin-top:2px;font-family:monospace;">${checkoutResult?.invoiceNumber}</div>
          </div>
          ` : ''}
          <div class="divider"></div>
          <div class="text-center" style="margin-top: 10px; font-weight: bold;">
            Thank you for shopping with us!
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-6rem)] overflow-hidden">
      {/* 1. PRODUCT DIRECTORY & SCAN PANEL */}
      <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full overflow-hidden">
        {/* Scan Header */}
        <div className="space-y-4 mb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-indigo-500" />
            <h2 className="font-bold text-slate-100 text-base">Billing Terminal Counter</h2>
          </div>

          {/* Real-time search panel */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              ref={searchInputRef}
              placeholder="Scan Barcode / QR or search product by Name, Code, or Category..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-100 placeholder:text-slate-650 outline-none transition-all"
            />
          </div>
        </div>

        {/* Live Search List Drawer */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-950/40 rounded-xl border border-slate-850 p-2 space-y-2">
          {products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-8">
              <QrCode className="w-12 h-12 text-slate-800 mb-2" />
              <span>No products found matching your search.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/40">
              {products.map((prod) => (
                <div
                  key={prod._id}
                  onClick={() => addToCart(prod)}
                  className="flex items-center justify-between p-3.5 hover:bg-slate-900/60 rounded-xl cursor-pointer transition-colors"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-200">{prod.name}</h4>
                    <p className="text-[9px] font-mono text-slate-500 mt-0.5">Code: {prod.productCode} | Cat: {prod.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-xs text-slate-100 block">
                      {currencySymbol}
                      {prod.price}
                    </span>
                    <span className={`text-[9px] font-bold block ${prod.quantity <= 5 ? 'text-amber-450' : 'text-slate-500'}`}>
                      {prod.quantity} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. CHECKOUT CART PANEL */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full overflow-hidden">
        <h3 className="font-bold text-sm text-slate-200 pb-3 border-b border-slate-850 mb-4 flex justify-between items-center">
          <span>Checkout Invoice Details</span>
          <span className="bg-indigo-950 border border-indigo-900/50 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {cart.length} items
          </span>
        </h3>

        {/* Selected Cart Items list */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-3 mb-4 pr-1">
          {cart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600 text-xs">Cart is empty.</div>
          ) : (
            cart.map((item) => (
              <div key={item.product} className="bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-[11px] text-slate-200 truncate max-w-[160px]" title={item.name}>
                    {item.name}
                  </h4>
                  <button
                    onClick={() => removeFromCart(item.product)}
                    className="text-slate-500 hover:text-rose-450 p-1 hover:bg-slate-900 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex justify-between items-center text-xs">
                  {/* Qty edit buttons */}
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => updateQuantity(item.product, -1)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-1 text-[10px] font-bold text-slate-200">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product, 1)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Pricing */}
                  <span className="font-extrabold text-slate-100 text-[11px]">
                    {currencySymbol}
                    {item.total.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Inputs & Total Area */}
        <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl space-y-4 text-xs font-semibold">
          {/* Customer name */}
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Customer Name</label>
            <div className="relative">
              <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-655" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 pl-8 text-xs text-slate-200 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Discount Input */}
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Discount (%)</label>
              <div className="relative">
                <Percent className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-655" />
                <input
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                  min={0}
                  max={100}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 pr-8 text-xs text-slate-200 outline-none"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-200 outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Online">Online</option>
              </select>
            </div>
          </div>

          {/* Pricing Aggregations */}
          <div className="space-y-1.5 pt-3 border-t border-slate-850/60 font-semibold text-slate-400 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="text-slate-200">
                {currencySymbol}
                {getSubtotal().toFixed(2)}
              </span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-emerald-450">
                <span>Discount ({discountPercent}%):</span>
                <span>
                  -{currencySymbol}
                  {getDiscountAmount().toFixed(2)}
                </span>
              </div>
            )}
            {taxPercent > 0 && (
              <div className="flex justify-between">
                <span>GST/Sales Tax ({taxPercent}%):</span>
                <span className="text-slate-200">
                  {currencySymbol}
                  {getTaxAmount().toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-slate-100 pt-1.5 border-t border-slate-850/40">
              <span>Grand Total:</span>
              <span className="text-indigo-400">
                {currencySymbol}
                {getGrandTotal().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Submit button */}
          <button
            onClick={handleCheckout}
            disabled={checkoutLoading || cart.length === 0}
            className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer"
          >
            {checkoutLoading ? 'Processing Checkout...' : 'Complete Sale & Checkout'}
          </button>
        </div>
      </div>

      {/* PRINTABLE RECEIPT MODAL */}
      {isReceiptModalOpen && checkoutResult && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
            <button
              onClick={() => setIsReceiptModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Content */}
            <div className="space-y-4 font-mono text-[11px] text-slate-300">
              <div className="text-center">
                <Store className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <h3 className="font-extrabold text-sm text-slate-100">{settings.shopName}</h3>
                <p className="text-[10px] text-slate-500">{settings.shopAddress || 'Online Terminal'}</p>
                {settings.phone && <p className="text-[10px] text-slate-500">Tel: {settings.phone}</p>}
              </div>

              <div className="border-t border-dashed border-slate-800 pt-3 space-y-1">
                <p>Invoice: {checkoutResult.invoiceNumber}</p>
                <p>Date: {new Date(checkoutResult.date).toLocaleString()}</p>
                <p>Cashier: {checkoutResult.cashierName}</p>
              </div>

              {/* Items Table */}
              <div className="border-t border-dashed border-slate-800 pt-3">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-dashed border-slate-800 pb-2 text-slate-400 font-bold">
                      <th className="pb-1">Description</th>
                      <th className="pb-1 text-center">Qty</th>
                      <th className="pb-1 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkoutResult.items.map((item, index) => (
                      <tr key={index}>
                        <td className="py-1 max-w-[120px] truncate">{item.name}</td>
                        <td className="py-1 text-center">{item.quantity}</td>
                        <td className="py-1 text-right">
                          {currencySymbol}
                          {item.price.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Grand totals details */}
              <div className="border-t border-dashed border-slate-800 pt-3 space-y-1.5 text-right font-bold text-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Grand Total:</span>
                  <span className="text-indigo-400 text-xs">
                    {currencySymbol}
                    {checkoutResult.grandTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] font-normal text-slate-450">
                  <span>Method:</span>
                  <span>{checkoutResult.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-[10px] font-normal text-slate-450">
                  <span>Customer:</span>
                  <span>{checkoutResult.customerName}</span>
                </div>
              </div>

              {/* Invoice QR Code */}
              {invoiceQrDataUrl && (
                <div className="border-t border-dashed border-slate-800 pt-4 flex flex-col items-center gap-2">
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Scan to Verify Invoice</p>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-inner">
                    <img src={invoiceQrDataUrl} alt="Invoice QR" className="w-24 h-24" />
                  </div>
                  <p className="text-[8px] font-mono text-slate-600">{checkoutResult.invoiceNumber}</p>
                </div>
              )}

              {/* Printing actions */}
              <div className="border-t border-dashed border-slate-800 pt-4 flex gap-3">
                <button
                  onClick={handlePrintInvoice}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSBilling;

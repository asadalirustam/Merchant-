import { useState, useEffect, useContext } from 'react';
import QRCode from 'qrcode';
import API from '../utils/api';
import { SettingsContext } from '../context/SettingsContext';
import { NotificationContext } from '../context/NotificationContext';
import {
  Receipt,
  Search,
  Calendar,
  User,
  ShoppingBag,
  Printer,
  X,
  FileDown,
  Trash2,
  Plus,
  Minus,
  Percent,
  Edit,
} from 'lucide-react';

const InvoiceHistory = () => {
  const { settings, getCurrencySymbol } = useContext(SettingsContext);
  const { addToast } = useContext(NotificationContext);
  const currencySymbol = getCurrencySymbol();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search Filters
  const [searchInvoice, setSearchInvoice] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchDate, setSearchDate] = useState('');

  // Selected Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoiceQrDataUrl, setInvoiceQrDataUrl] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('Cash');
  const [editItems, setEditItems] = useState([]);
  const [editDiscountPercent, setEditDiscountPercent] = useState(0);
  const [editTaxPercent, setEditTaxPercent] = useState(settings?.taxPercentage || 0);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // Generate QR whenever a new invoice is selected
  useEffect(() => {
    if (selectedInvoice?.invoiceNumber) {
      QRCode.toDataURL(selectedInvoice.invoiceNumber, {
        width: 160,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      })
        .then((url) => setInvoiceQrDataUrl(url))
        .catch(() => setInvoiceQrDataUrl(''));
    } else {
      setInvoiceQrDataUrl('');
    }
  }, [selectedInvoice]);

  const handleEditClick = async () => {
    try {
      const { data: prodRes } = await API.get('/products');
      if (prodRes.success) {
        const prodList = prodRes.data.products || [];
        setAllProducts(prodList);
        setFilteredProducts(prodList);

        const { data: invRes } = await API.get(`/invoices/${selectedInvoice.invoiceNumber}`);
        if (invRes.success) {
          const latestInvoice = invRes.data;
          setSelectedInvoice(latestInvoice);

          setEditCustomerName(latestInvoice.customerName || 'Guest');
          setEditPaymentMethod(latestInvoice.paymentMethod || 'Cash');

          const saleObj = latestInvoice.sale;
          let calculatedDiscountPercent = 0;
          let calculatedTaxPercent = settings?.taxPercentage || 0;
          if (saleObj) {
            const sub = saleObj.subTotal || 0;
            const disc = saleObj.discount || 0;
            const tx = saleObj.tax || 0;
            if (sub > 0) {
              calculatedDiscountPercent = Math.round((disc / sub) * 100);
            }
            if (sub - disc > 0) {
              calculatedTaxPercent = Math.round((tx / (sub - disc)) * 100);
            }
          }
          setEditDiscountPercent(calculatedDiscountPercent);
          setEditTaxPercent(calculatedTaxPercent);

          const mappedItems = latestInvoice.items.map(item => {
            const matchingProd = prodList.find(p => p._id === (item.product?._id || item.product));
            const currentStock = matchingProd ? matchingProd.quantity : 0;
            return {
              product: item.product?._id || item.product,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              maxQuantity: currentStock + item.quantity,
            };
          });
          setEditItems(mappedItems);
          setIsEditing(true);
        }
      }
    } catch (err) {
      console.error(err);
      addToast('Error', 'Failed to initialize edit data', 'error');
    }
  };

  const getEditSubtotal = () => editItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const getEditDiscountAmount = () => (getEditSubtotal() * (Number(editDiscountPercent) / 100));
  const getEditTaxAmount = () => ((getEditSubtotal() - getEditDiscountAmount()) * (Number(editTaxPercent) / 100));
  const getEditGrandTotal = () => Math.max(0, getEditSubtotal() - getEditDiscountAmount() + getEditTaxAmount());

  const handleUpdateEditQty = (productId, change) => {
    const idx = editItems.findIndex(item => item.product === productId);
    if (idx === -1) return;

    const updated = [...editItems];
    const newQty = updated[idx].quantity + change;

    if (newQty <= 0) {
      updated.splice(idx, 1);
    } else {
      if (newQty > updated[idx].maxQuantity) {
        addToast('Stock Limit Reached', `Only ${updated[idx].maxQuantity} units are available for this invoice.`, 'warning');
        return;
      }
      updated[idx].quantity = newQty;
    }
    setEditItems(updated);
  };

  const handleRemoveEditItem = (productId) => {
    setEditItems(editItems.filter(item => item.product !== productId));
  };

  const handleAddProductToEdit = (product) => {
    const existingIdx = editItems.findIndex(item => item.product === product._id);
    if (existingIdx > -1) {
      const currentQty = editItems[existingIdx].quantity;
      if (currentQty >= editItems[existingIdx].maxQuantity) {
        addToast('Stock Limit Reached', `Only ${editItems[existingIdx].maxQuantity} units are available.`, 'warning');
        return;
      }
      const updated = [...editItems];
      updated[existingIdx].quantity += 1;
      setEditItems(updated);
    } else {
      setEditItems([
        ...editItems,
        {
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          maxQuantity: product.quantity,
        }
      ]);
    }
    setSearchProductQuery('');
    setFilteredProducts(allProducts);
  };

  const handleProductSearch = (e) => {
    const val = e.target.value;
    setSearchProductQuery(val);
    if (val.trim().length === 0) {
      setFilteredProducts(allProducts);
      return;
    }
    const query = val.toLowerCase();
    const filtered = allProducts.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.productCode.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
  };

  const handleSaveChanges = async () => {
    if (editItems.length === 0) {
      addToast('Empty Cart', 'Invoice must contain at least one item.', 'error');
      return;
    }

    setSaveLoading(true);
    const payload = {
      customerName: editCustomerName,
      paymentMethod: editPaymentMethod,
      items: editItems.map(item => ({
        product: item.product,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      subTotal: getEditSubtotal(),
      discount: getEditDiscountAmount(),
      tax: getEditTaxAmount(),
      grandTotal: getEditGrandTotal(),
    };

    try {
      const { data } = await API.put(`/invoices/${selectedInvoice.invoiceNumber}`, payload);
      if (data.success) {
        addToast('Success', 'Invoice updated successfully', 'success');
        setSelectedInvoice(data.data);
        setIsEditing(false);
        fetchInvoices();
      }
    } catch (error) {
      addToast('Update Failed', error.response?.data?.message || 'Failed to update invoice', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const url = `/invoices?search=${searchInvoice}&product=${searchProduct}&customerName=${searchCustomer}&date=${searchDate}`;
      const { data } = await API.get(url);
      if (data.success) {
        setInvoices(data.data);
      }
    } catch (error) {
      addToast('Error', 'Failed to retrieve invoice logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [searchDate]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleClearFilters = () => {
    setSearchInvoice('');
    setSearchProduct('');
    setSearchCustomer('');
    setSearchDate('');
    // Direct trigger since state set is async
    setLoading(true);
    API.get('/invoices')
      .then(({ data }) => {
        if (data.success) setInvoices(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handlePrint = (invoice) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${invoice.invoiceNumber}</title>
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
            <div>Invoice: ${invoice.invoiceNumber}</div>
            <div>Date: ${new Date(invoice.date).toLocaleDateString()} | Time: ${new Date(invoice.date).toLocaleTimeString()}</div>
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
              ${invoice.items.map(item => `
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
              <td style="text-align: right;" class="totals-bold">${currencySymbol}${invoice.grandTotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Payment Mode:</td>
              <td style="text-align: right;">${invoice.paymentMethod}</td>
            </tr>
            <tr>
              <td>Cashier:</td>
              <td style="text-align: right;">${invoice.cashierName}</td>
            </tr>
            <tr>
              <td>Customer:</td>
              <td style="text-align: right;">${invoice.customerName}</td>
            </tr>
          </table>
          <div class="divider"></div>
          ${invoiceQrDataUrl ? `
          <div class="text-center" style="margin-top: 14px;">
            <img src="${invoiceQrDataUrl}" alt="Invoice QR" style="width:110px;height:110px;margin:0 auto;display:block;" />
            <div style="font-size:9px;color:#666;margin-top:4px;">Scan to verify invoice</div>
            <div style="font-size:8px;color:#999;margin-top:2px;font-family:monospace;">${invoice.invoiceNumber}</div>
          </div>
          <div class="divider"></div>` : ''}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center gap-2">
          <Receipt className="w-7 h-7 text-indigo-500" />
          Invoice History Logs
        </h1>
        <p className="text-slate-400 text-xs mt-0.5">Audit log of all processed invoice checkouts. Search by customer names, products, dates, or code identifiers.</p>
      </div>

      {/* Filter Row Form */}
      <form onSubmit={handleFilterSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[160px] space-y-1">
          <label className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Invoice Code</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchInvoice}
              onChange={(e) => setSearchInvoice(e.target.value)}
              placeholder="e.g. INV-12345"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 pl-8 text-xs text-slate-100 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 min-w-[160px] space-y-1">
          <label className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Product Name</label>
          <div className="relative">
            <ShoppingBag className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              placeholder="e.g. Keyboard"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 pl-8 text-xs text-slate-100 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 min-w-[160px] space-y-1">
          <label className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Customer Name</label>
          <div className="relative">
            <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchCustomer}
              onChange={(e) => setSearchCustomer(e.target.value)}
              placeholder="e.g. John"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 pl-8 text-xs text-slate-100 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 min-w-[160px] space-y-1">
          <label className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Specific Date</label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2 pl-8 text-xs text-slate-200 outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-350 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Clear
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Search Logs
          </button>
        </div>
      </form>

      {/* Invoices List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Searching invoices database...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No invoice matching search filters was logged.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950 text-slate-400 font-semibold">
                  <th className="py-3 px-6">Invoice Code</th>
                  <th className="py-3 px-6">Billing Date</th>
                  <th className="py-3 px-6">Customer Name</th>
                  <th className="py-3 px-6">Cashier Name</th>
                  <th className="py-3 px-6">Total Amount</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-800/10">
                    <td className="py-4 px-6 font-bold text-slate-200 font-mono text-[10px]">{inv.invoiceNumber}</td>
                    <td className="py-4 px-6 text-slate-400 font-mono text-[10px]">{new Date(inv.date).toLocaleString()}</td>
                    <td className="py-4 px-6 font-semibold text-slate-300">{inv.customerName}</td>
                    <td className="py-4 px-6 text-slate-400 font-medium">{inv.cashierName}</td>
                    <td className="py-4 px-6 font-black text-indigo-400">
                      {currencySymbol}
                      {inv.grandTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setIsModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-350 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Inspect Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL DRAWER / POPUP */}
      {isModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`bg-slate-900 border border-slate-850 rounded-2xl w-full ${isEditing ? 'max-w-md' : 'max-w-sm'} shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto`}>
            <button
              onClick={() => {
                setIsEditing(false);
                setSearchProductQuery('');
                setIsModalOpen(false);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            {isEditing ? (
              <div className="space-y-4 font-sans text-slate-300">
                <div className="pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                    <Edit className="w-4 h-4 text-indigo-500" />
                    Edit Invoice Details
                  </h3>
                  <p className="text-[10px] text-indigo-400 font-mono mt-0.5">{selectedInvoice.invoiceNumber}</p>
                </div>

                {/* Customer & Payment Method */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[9px] text-slate-400 block mb-1 uppercase tracking-wider font-bold">Customer Name</label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-550" />
                      <input
                        type="text"
                        value={editCustomerName}
                        onChange={(e) => setEditCustomerName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 pl-8 text-xs text-slate-200 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-400 block mb-1 uppercase tracking-wider font-bold">Payment Mode</label>
                    <select
                      value={editPaymentMethod}
                      onChange={(e) => setEditPaymentMethod(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>
                </div>

                {/* Product Catalog Search */}
                <div className="space-y-1 relative">
                  <label className="text-[9px] text-slate-400 block uppercase tracking-wider font-bold">Add Items to Cart</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-550" />
                    <input
                      type="text"
                      value={searchProductQuery}
                      onChange={handleProductSearch}
                      placeholder="Search product code or name..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 pl-8 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    />
                  </div>

                  {searchProductQuery && (
                    <div className="max-h-36 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl mt-1 divide-y divide-slate-850/50 absolute left-0 right-0 z-50 shadow-2xl">
                      {filteredProducts.length === 0 ? (
                        <div className="p-3 text-[10px] text-slate-500 text-center">No products found</div>
                      ) : (
                        filteredProducts.slice(0, 5).map(prod => (
                          <div
                            key={prod._id}
                            onClick={() => handleAddProductToEdit(prod)}
                            className="p-2.5 text-xs hover:bg-slate-900 cursor-pointer flex justify-between items-center"
                          >
                            <div>
                              <p className="font-bold text-slate-300 text-[11px]">{prod.name}</p>
                              <p className="text-[9px] font-mono text-slate-500">Code: {prod.productCode} | Stock: {prod.quantity}</p>
                            </div>
                            <span className="font-bold text-indigo-400 text-[11px]">{currencySymbol}{prod.price}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Items List inside the editing invoice */}
                <div className="space-y-2">
                  <label className="text-[9px] text-slate-400 block uppercase tracking-wider font-bold">Invoice Items</label>
                  <div className="max-h-44 overflow-y-auto space-y-2 bg-slate-950/45 p-2 rounded-xl border border-slate-850">
                    {editItems.length === 0 ? (
                      <p className="text-center text-xs text-slate-655 py-6">No items in invoice.</p>
                    ) : (
                      editItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-900 border border-slate-850 p-2 rounded-lg gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-slate-350 truncate">{item.name}</p>
                            <p className="text-[9px] text-indigo-400 font-mono">{currencySymbol}{item.price.toFixed(2)} each</p>
                          </div>

                          {/* Qty edit controls */}
                          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
                            <button
                              onClick={() => handleUpdateEditQty(item.product, -1)}
                              className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-1 text-[10px] font-bold text-slate-200">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateEditQty(item.product, 1)}
                              className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Trash action */}
                          <button
                            onClick={() => handleRemoveEditItem(item.product)}
                            className="text-slate-500 hover:text-rose-455 p-1.5 hover:bg-slate-950 border border-transparent hover:border-slate-800 rounded-lg shrink-0 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Discount & Tax input fields */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <label className="text-[9px] text-slate-400 block mb-1 uppercase tracking-wider font-bold">Discount (%)</label>
                    <div className="relative">
                      <Percent className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="number"
                        value={editDiscountPercent}
                        onChange={(e) => setEditDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                        min={0}
                        max={100}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 pr-8 text-xs text-slate-205 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-400 block mb-1 uppercase tracking-wider font-bold">Sales Tax (%)</label>
                    <div className="relative">
                      <Percent className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="number"
                        value={editTaxPercent}
                        onChange={(e) => setEditTaxPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                        min={0}
                        max={100}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 pr-8 text-xs text-slate-205 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary Calculations */}
                <div className="bg-slate-950/45 p-3 rounded-xl border border-slate-850/80 space-y-1.5 text-xs text-slate-400 font-semibold">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-slate-200">{currencySymbol}{getEditSubtotal().toFixed(2)}</span>
                  </div>
                  {editDiscountPercent > 0 && (
                    <div className="flex justify-between text-emerald-400 font-medium">
                      <span>Discount ({editDiscountPercent}%):</span>
                      <span>-{currencySymbol}{getEditDiscountAmount().toFixed(2)}</span>
                    </div>
                  )}
                  {editTaxPercent > 0 && (
                    <div className="flex justify-between">
                      <span>Sales Tax ({editTaxPercent}%):</span>
                      <span className="text-slate-200">{currencySymbol}{getEditTaxAmount().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-100 pt-1.5 border-t border-slate-850">
                    <span>New Grand Total:</span>
                    <span className="text-indigo-400">{currencySymbol}{getEditGrandTotal().toFixed(2)}</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-350 rounded-xl text-xs font-semibold cursor-pointer border border-slate-700/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={saveLoading || editItems.length === 0}
                    className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center"
                  >
                    {saveLoading ? 'Saving changes...' : 'Save Invoice'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 font-mono text-[11px] text-slate-350">
                <div className="text-center pb-2 border-b border-slate-850">
                  <Receipt className="w-8 h-8 text-indigo-500 mx-auto mb-1.5" />
                  <h3 className="font-extrabold text-sm text-slate-100">{settings.shopName}</h3>
                  <p className="text-[9px] text-slate-500">{settings.shopAddress}</p>
                  {settings.phone && <p className="text-[9px] text-slate-500">Tel: {settings.phone}</p>}
                </div>

                <div className="space-y-1 text-slate-400">
                  <p>Invoice: {selectedInvoice.invoiceNumber}</p>
                  <p>Date: {new Date(selectedInvoice.date).toLocaleString()}</p>
                  <p>Cashier: {selectedInvoice.cashierName}</p>
                </div>

                {/* Items details table */}
                <div className="border-t border-dashed border-slate-800 pt-3">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-dashed border-slate-800 pb-2 text-slate-400 font-bold">
                        <th className="pb-1">Item</th>
                        <th className="pb-1 text-center">Qty</th>
                        <th className="pb-1 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx}>
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

                <div className="border-t border-dashed border-slate-800 pt-3 space-y-1 text-right font-bold">
                  <div className="flex justify-between text-slate-200">
                    <span>Total Amount:</span>
                    <span className="text-indigo-400">
                      {currencySymbol}
                      {selectedInvoice.grandTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] font-normal text-slate-500">
                    <span>Method:</span>
                    <span>{selectedInvoice.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-normal text-slate-500">
                    <span>Customer:</span>
                    <span>{selectedInvoice.customerName}</span>
                  </div>
                </div>

                {/* Edit History Section */}
                {selectedInvoice.editHistory && selectedInvoice.editHistory.length > 0 && (
                  <div className="border-t border-dashed border-slate-800 pt-3 space-y-1.5 text-left text-[10px] font-sans">
                    <p className="text-slate-400 font-bold uppercase tracking-wider">Revision History</p>
                    <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 text-slate-550">
                      {selectedInvoice.editHistory.map((rev, index) => (
                        <div key={index} className="bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                          <p className="text-slate-350">
                            <span className="font-semibold">{rev.editedBy}</span> edited:
                          </p>
                          <p className="text-[9px] text-slate-500">
                            {new Date(rev.editedAt).toLocaleString()}
                          </p>
                          <p className="text-slate-400 mt-0.5">
                            Total: {currencySymbol}{rev.previousGrandTotal.toFixed(2)} → {currencySymbol}{rev.newGrandTotal.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-dashed border-slate-800 pt-4">
                  {/* QR Code */}
                  {invoiceQrDataUrl && (
                    <div className="flex flex-col items-center gap-2 pb-4 border-b border-dashed border-slate-800 mb-4">
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Scan to Verify Invoice</p>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-inner">
                        <img src={invoiceQrDataUrl} alt="Invoice QR" className="w-24 h-24" />
                      </div>
                      <p className="text-[8px] font-mono text-slate-600">{selectedInvoice.invoiceNumber}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => handlePrint(selectedInvoice)}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                    <button
                      onClick={handleEditClick}
                      className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Invoice
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceHistory;

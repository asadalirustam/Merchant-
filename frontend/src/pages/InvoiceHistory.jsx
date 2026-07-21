import { useState, useEffect, useContext } from 'react';
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
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

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

              <div className="border-t border-dashed border-slate-800 pt-4">
                <button
                  onClick={() => handlePrint(selectedInvoice)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceHistory;

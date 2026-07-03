import ShopSettings from '../models/ShopSettings.js';
import { uploadToCloudinary } from '../middleware/uploadMiddleware.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logActivity } from '../utils/activityLogger.js';

// @desc    Get active shop settings
// @route   GET /api/settings
// @access  Private
export const getSettings = async (req, res) => {
  try {
    let settings = await ShopSettings.findOne();
    if (!settings) {
      // Seed default settings document if database is completely fresh
      settings = await ShopSettings.create({});
    }
    return sendSuccess(res, 'Settings retrieved successfully', settings);
  } catch (error) {
    return sendError(res, 'Failed to fetch settings', error, 500);
  }
};

// @desc    Update shop settings
// @route   PUT /api/settings
// @access  Private (CEO Only)
export const updateSettings = async (req, res) => {
  const {
    shopName,
    address,
    phone,
    email,
    currency,
    taxPercentage,
    invoiceFooter,
    theme,
  } = req.body;

  try {
    let settings = await ShopSettings.findOne();
    if (!settings) {
      settings = new ShopSettings({});
    }

    if (shopName) settings.shopName = shopName;
    if (address !== undefined) settings.address = address;
    if (phone !== undefined) settings.phone = phone;
    if (email !== undefined) settings.email = email;
    if (currency !== undefined) settings.currency = currency;
    if (taxPercentage !== undefined) settings.taxPercentage = Number(taxPercentage);
    if (invoiceFooter !== undefined) settings.invoiceFooter = invoiceFooter;
    if (theme !== undefined) settings.theme = theme;

    // Handle logo upload
    if (req.file) {
      settings.logo = await uploadToCloudinary(req.file.path);
    }

    await settings.save();

    await logActivity(req.user._id, 'SETTINGS_UPDATE', 'CEO updated shop general configurations', req);

    return sendSuccess(res, 'Shop settings updated successfully', settings);
  } catch (error) {
    return sendError(res, 'Failed to update shop settings', error, 500);
  }
};

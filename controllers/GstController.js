const GSTRate = require('../models/gstRates'); // Consistent naming

// Add a new GST Rate
exports.addGstRate = async (req, res) => {
  try {
    const { totalRate, intraState, interState } = req.body;

    // Validation
    if (
      totalRate === undefined ||
      intraState?.cgst?.rate === undefined ||
      intraState?.sgst?.rate === undefined ||
      interState?.igst?.rate === undefined
    ) {
      return res.status(400).json({ message: 'Missing required GST rate fields' });
    }

    // Check for duplicates
    const existing = await GSTRate.findOne({ totalRate });
    if (existing) {
      return res.status(400).json({ message: 'GST rate with this totalRate already exists' });
    }

    const gstRate = new GSTRate({
      totalRate,
      intraState,
      interState
    });

    await gstRate.save();

    res.status(201).json({ message: 'GST rate added successfully', data: gstRate });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create tax', error: error.message });
  }
};

// Get all GST Rates
exports.getGstRates = async (req, res) => {
  try {
    const gstRates = await GSTRate.find().sort({ totalRate: 1 }); // Sorted by rate
    res.status(200).json({ data: gstRates });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tax rates', error: error.message });
  }
};

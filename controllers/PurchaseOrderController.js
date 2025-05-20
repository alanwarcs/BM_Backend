const Organization = require('../models/Organization'); // Organization model
const Vendorpayment = require('../models/VendorPayment'); // VendorPayment model
const PurchaseOrder = require('../models/PurchaseOrder'); // PurchaseOrder model

/**
 * Fatch Business Details and generate PO-ID.
 */
exports.generatePurchaseOrder = async (req, res) => {
    try {
        const { user } = req; // Assuming user is available in the request object

        // Fetch organization details
        const organization = await Organization.findOne({ _id: user.businessId });
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }
        
        // Fetch last purchase order for the organization
        const lastPurchaseOrder = await PurchaseOrder.findOne({ organizationId: user.businessId })
            .sort({ createdAt: -1 })
            .limit(1);
        let newPurchaseOrderId = 'PO-0001'; // Default value if no previous order exists
        if (lastPurchaseOrder) {
            const lastId = lastPurchaseOrder.poId.split('-')[1]; // Extract the numeric part
            const newId = parseInt(lastId) + 1; // Increment the ID
            newPurchaseOrderId = `PO-${String(newId).padStart(4, '0')}`; // Format with leading zeros
        }
        res.status(200).json({
            message: 'Purchase Order ID generated successfully',
            purchaseOrderId: newPurchaseOrderId,
            organization: {
                name: organization.name,
                address: {
                    address: organization.address,
                    city: organization.city,
                    state: organization.region,
                    country: organization.country,
                    pincode: organization.pincode
                },
                phone: organization.phone,
                email: organization.email,
                gstNumber: organization.gstin,
            }
        });
    } catch (error) {
        console.error('Error generating PO-ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

require('dotenv').config(); // For accessing environment variables
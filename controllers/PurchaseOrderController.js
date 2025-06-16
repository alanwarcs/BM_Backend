const mongoose = require('mongoose');
const PurchaseOrder = require('../models/PurchaseOrder');
const Vendor = require('../models/Vendor');
const Product = require('../models/Items');
const Organization = require('../models/Organization');


/**
 * Fatch Business Details and generate PO-ID.
 */
exports.generatePurchaseOrder = async (req, res) => {
    try {
        const { user } = req;

        // Fetch organization details
        const organization = await Organization.findOne({ _id: user.businessId });
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Fetch last purchase order for the organization
        const lastPurchaseOrder = await PurchaseOrder.findOne({ businessId: user.businessId })
            .sort({ createdAt: -1 });

        let newPurchaseOrderId = 'PO-0001'; // Default

        if (lastPurchaseOrder?.purchaseOrderNumber) {
            // Extract numeric part using regex
            const match = lastPurchaseOrder.purchaseOrderNumber.match(/(\d+)$/);
            if (match) {
                const lastNumber = parseInt(match[1], 10);
                const newNumber = lastNumber + 1;
                newPurchaseOrderId = `PO-${String(newNumber).padStart(4, '0')}`;
            }
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
                gstNumber: organization.GSTIN,
                gstStatus: organization.isGSTRegistered,
            }
        });
    } catch (error) {
        console.error('Error generating PO-ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


/**
 * Create New Purchase Order
*/
exports.createPurchaseOrder = async (req, res) => {
  try {
    const user = req.user;
    const po = req.body;

    if (!user || !user.businessId || !user.id) {
      return res.status(400).json({ success: false, message: 'Invalid user data.' });
    }

    // 1. Verify Organization Exists
    const organization = await Organization.findById(user.businessId);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found.' });
    }

    // 2. Verify Vendor Exists
    const vendorExists = await Vendor.findById(po.vendorId);
    if (!vendorExists) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    // 3. Verify Each Product
    for (const product of po.products) {
      const productExists = await Product.findById(product.productId);
      if (!productExists) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${product.productId}`
        });
      }
    }

    // 4. Create the PurchaseOrder Document
    const newPO = new PurchaseOrder({
      vendorId: po.vendorId,
      businessId: user.businessId,
      purchaseOrderNumber: po.purchaseOrderNumber,
      billNumber: po.billNumber || '',
      orderDate: po.orderDate,
      billDate: po.billDate || null,
      dueDate: po.dueDate,
      status: po.status || 'Pending',
      paymentStatus: po.paymentStatus || 'UnPaid',
      paymentType: po.paymentType,
      referenceNumber: po.referenceNumber || '',
      billingAddress: po.billingAddress,
      shippingAddress: po.shippingAddress,
      sourceState: po.sourceState,
      deliveryState: po.deliveryState,
      deliveryLocation: po.deliveryLocation || '',
      note: po.note || '',
      emiDetails: po.emiDetails || {},
      products: po.products.map(prod => ({
        productId: prod.productId,
        productName: prod.productName,
        quantity: Number(prod.quantity),
        hsnOrSacCode: prod.hsnOrSacCode || '',
        unit: prod.unit,
        rate: mongoose.Types.Decimal128.fromString(prod.rate.toString()),
        inProductDiscount: mongoose.Types.Decimal128.fromString((prod.inProductDiscount || '0').toString()),
        inProductDiscountValueType: prod.inProductDiscountValueType || 'Percent',
        taxes: (prod.taxes || []).map(tax => ({
          type: tax.type,
          subType: tax.subType || '',
          rate: Number(tax.rate),
          amount: mongoose.Types.Decimal128.fromString((tax.amount || '0').toString())
        })),
        totalPrice: mongoose.Types.Decimal128.fromString(prod.totalPrice.toString())
      })),
      discount: mongoose.Types.Decimal128.fromString((po.discount || '0').toString()),
      discountType: po.discountType || 'Flat',
      discountValueType: po.discountValueType || 'Percent',
      totalAmountOfDiscount: mongoose.Types.Decimal128.fromString((po.totalAmountOfDiscount || '0').toString()),
      roundOff: !!po.roundOff,
      roundOffAmount: mongoose.Types.Decimal128.fromString((po.roundOffAmount || '0').toString()),
      taxAmount: mongoose.Types.Decimal128.fromString(po.taxAmount.toString()),
      totalAmount: mongoose.Types.Decimal128.fromString(po.totalAmount.toString()),
      paidAmount: mongoose.Types.Decimal128.fromString(po.paidAmount.toString()),
      dueAmount: mongoose.Types.Decimal128.fromString(po.dueAmount.toString()),
      deliveryTerms: po.deliveryTerms || '',
      termsAndConditions: po.termsAndConditions || '',
      attachments: (po.attachments || []).map(file => ({
        fileName: file.fileName,
        filePath: file.filePath,
        uploadedBy: user.id
      })),
      createdBy: user.id,
      updatedBy: user.id,
      isDeleted: false
    });

    await newPO.save();

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully.',
      purchaseOrder: newPO
    });

  } catch (error) {
    console.error('Error Creating Purchase Order:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


require('dotenv').config(); // For accessing environment variables
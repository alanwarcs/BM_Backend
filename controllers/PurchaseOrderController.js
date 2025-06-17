require('dotenv').config();
const mongoose = require('mongoose');
const PurchaseOrder = require('../models/PurchaseOrder');
const Vendor = require('../models/Vendor');
const Product = require('../models/Items');
const Organization = require('../models/Organization');

/**
 * Fetch Business Details and generate PO-ID.
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
    const lastPurchaseOrder = await PurchaseOrder.findOne({ 'business.id': user.businessId })
      .sort({ createdAt: -1 });

    let newPurchaseOrderId = 'PO-0001'; // Default

    if (lastPurchaseOrder?.poNumber) {
      // Extract numeric part using regex
      const match = lastPurchaseOrder.poNumber.match(/(\d+)$/);
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
          pincode: organization.pincode,
        },
        phone: organization.phone,
        email: organization.email,
        gstNumber: organization.GSTIN,
        gstStatus: organization.isGSTRegistered ? 'Registered' : 'Unregistered',
      },
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
    const po = JSON.parse(req.body.purchaseOrder); // because sent as string in FormData
    const uploadedFiles = req.files || [];

    if (!user || !user.businessId || !user.id) {
      return res.status(400).json({ success: false, message: 'Invalid user data.' });
    }

    // 1. Verify Organization Exists
    const organization = await Organization.findById(user.businessId);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found.' });
    }

    // 2. Verify Vendor Exists
    const vendorExists = await Vendor.findById(po.vendor.id);
    if (!vendorExists) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    // 3. Verify Each Product
    for (const product of po.products) {
      const productExists = await Product.findById(product.productId);
      if (!productExists) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${product.productId}`,
        });
      }
    }

    // Create attachment metadata
    const attachments = uploadedFiles.map((file) => ({
      fileName: file.originalname,
      filePath: file.path,
      uploadedBy: user.id,
      uploadedAt: new Date(),
    }));


    // 4. Create the PurchaseOrder Document
    const newPO = new PurchaseOrder({
      poNumber: po.poNumber,
      orderDate: po.orderDate,
      isBillGenerated: po.isBillGenerated || false,
      dueDate: po.dueDate || null,
      status: po.status || 'Pending',
      paymentStatus: po.paymentStatus || 'UnPaid',
      paymentType: po.paymentType || null,
      referenceNumber: po.referenceNumber || '',
      note: po.note || '',
      vendor: {
        id: po.vendor.id,
        name: po.vendor.name || '',
        gstin: po.vendor.gstin || '',
        gstStatus: po.vendor.gstStatus || '',
        state: po.vendor.state || '',
        address: po.vendor.address || '',
        phone: po.vendor.phone || '',
      },
      business: {
        id: user.businessId,
        name: po.business.name || '',
        gstinStatus: po.business.gstinStatus || '',
        gstin: po.business.gstin || '',
        state: po.business.state || '',
        address: po.business.address || '',
        phone: po.business.phone || '',
        email: po.business.email || '',
      },
      address: {
        billing: po.address.billing,
        shipping: po.address.shipping,
        sourceState: po.address.sourceState,
        deliveryState: po.address.deliveryState,
        deliveryLocation: po.address.deliveryLocation || '',
      },
      products: po.products.map((prod) => ({
        productId: prod.productId,
        productName: prod.productName,
        quantity: Number(prod.quantity),
        hsnOrSacCode: prod.hsnOrSacCode || '',
        unit: prod.unit,
        rate: mongoose.Types.Decimal128.fromString(prod.rate.toString()),
        inProductDiscount: mongoose.Types.Decimal128.fromString((prod.inProductDiscount || '0').toString()),
        inProductDiscountValueType: prod.inProductDiscountValueType || 'Percent',
        taxes: (prod.taxes || []).map((tax) => ({
          type: tax.type,
          subType: tax.subType || '',
          rate: Number(tax.rate),
          amount: mongoose.Types.Decimal128.fromString((tax.amount || '0').toString()),
        })),
        totalPrice: mongoose.Types.Decimal128.fromString(prod.totalPrice.toString()),
      })),
      emiDetails: {
        frequency: po.emiDetails?.frequency || '',
        interestRate: Number(po.emiDetails?.interestRate) || 0,
        totalWithInterest: mongoose.Types.Decimal128.fromString((po.emiDetails?.totalWithInterest || '0').toString()),
        advancePayment: mongoose.Types.Decimal128.fromString((po.emiDetails?.advancePayment || '0').toString()),
        installments: (po.emiDetails?.installments || []).map((inst) => ({
          amount: mongoose.Types.Decimal128.fromString((inst.amount || '0').toString()),
          dueDate: inst.dueDate,
          status: inst.status || 'Unpaid',
          paymentDate: inst.paymentDate || null,
          paymentMethod: inst.paymentMethod || '',
          paymentReference: inst.paymentReference || '',
          paymentNote: inst.paymentNote || '',
        })),
      },
      discount: mongoose.Types.Decimal128.fromString((po.discount || '0').toString()),
      discountType: po.discountType || 'Flat',
      discountValueType: po.discountValueType || 'Percent',
      totalAmountOfDiscount: mongoose.Types.Decimal128.fromString((po.totalAmountOfDiscount || '0').toString()),
      subtotal: mongoose.Types.Decimal128.fromString(po.subtotal.toString()),
      totalBeforeDiscount: mongoose.Types.Decimal128.fromString(po.totalBeforeDiscount.toString()),
      roundOff: !!po.roundOff,
      roundOffAmount: mongoose.Types.Decimal128.fromString((po.roundOffAmount || '0').toString()),
      taxAmount: mongoose.Types.Decimal128.fromString(po.taxAmount.toString()),
      grandAmount: mongoose.Types.Decimal128.fromString(po.grandAmount.toString()),
      paidAmount: mongoose.Types.Decimal128.fromString(po.paidAmount.toString()),
      dueAmount: mongoose.Types.Decimal128.fromString(po.dueAmount.toString()),
      deliveryTerms: po.deliveryTerms || '',
      termsAndConditions: po.termsAndConditions || '',
      attachments,
      createdBy: user.id,
      updatedBy: user.id,
      isDeleted: false,
    });

    await newPO.save();

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully.',
      purchaseOrder: newPO,
    });
  } catch (error) {
    console.error('Error Creating Purchase Order:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
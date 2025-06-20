const mongoose = require('mongoose');
const PurchaseOrder = require('../models/PurchaseOrder');
const Vendor = require('../models/Vendor');
const Product = require('../models/Items');
const Organization = require('../models/Organization');
const fs = require('fs');
const path = require('path');

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
    const uploadedFiles = req.files || [];

    if (!user || !user.businessId || !user.id) {
      return res.status(400).json({ success: false, message: 'Invalid user data.' });
    }

    // Parse purchase order
    let po;
    try {
      po = JSON.parse(req.body.purchaseOrder);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase order data format.',
      });
    }

    // Validate products array
    if (!po.products || !Array.isArray(po.products) || po.products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Products array is required and cannot be empty.',
      });
    }

    // 1. Verify Organization Exists
    const organization = await Organization.findById(user.businessId);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found.' });
    }

    // 2. Verify Vendor Exists
    if (!mongoose.isValidObjectId(po.vendor.id)) {
      return res.status(400).json({ success: false, message: 'Invalid vendor ID.' });
    }
    const vendorExists = await Vendor.findById(po.vendor.id);
    if (!vendorExists) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    // 3. Verify Each Product
    for (const product of po.products) {
      if (!product.productId || !mongoose.isValidObjectId(product.productId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Product',
        });
      }
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
        gstStatus: po.vendor.gstinStatus || '',
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
      paidAmount: mongoose.Types.Decimal128.fromString((po.paidAmount || '0').toString()),
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
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

/**
 * Update an existing Purchase Order
 */
exports.updatePurchaseOrder = async (req, res) => {
  try {
    const user = req.user;
    const { purchaseOrderId } = req.params;
    const po = JSON.parse(req.body.purchaseOrder); // Parse JSON string from FormData
    const uploadedFiles = req.files || [];

    // Validate user
    if (!user || !user.businessId || !user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid user data.' });
    }

    // Validate purchaseOrderId
    if (!mongoose.isValidObjectId(purchaseOrderId)) {
      return res.status(400).json({ success: false, message: 'Valid Purchase Order ID is required.' });
    }

    // Find the existing purchase order
    const existingPO = await PurchaseOrder.findOne({
      _id: purchaseOrderId,
      'business.id': user.businessId,
      isDeleted: false,
    });

    if (!existingPO) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found or unauthorized access.',
      });
    }

    // Verify Vendor Exists
    const vendorExists = await Vendor.findById(po.vendor.id);
    if (!vendorExists) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    // Verify Each Product
    for (const product of po.products) {
      const productExists = await Product.findById(product.productId);
      if (!productExists) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${product.productId}`,
        });
      }
    }

    // Handle attachments: Remove old ones and add new ones
    const existingAttachments = existingPO.attachments || [];
    const newAttachments = po.attachments || [];
    const attachmentsToKeep = [];
    const attachmentsToRemove = [];

    // Identify attachments to keep or remove
    existingAttachments.forEach((existing) => {
      const stillExists = newAttachments.some(
        (newAtt) => newAtt._id && newAtt._id.toString() === existing._id.toString()
      );
      if (stillExists) {
        attachmentsToKeep.push(existing);
      } else {
        attachmentsToRemove.push(existing);
      }
    });

    // Delete files for removed attachments
    for (const attachment of attachmentsToRemove) {
      const filePath = path.resolve(__dirname, '..', '..', attachment.filePath);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.error(`Error deleting file ${filePath}:`, error);
        }
      }
    }

    // Add new attachments from uploaded files
    const newUploadedAttachments = uploadedFiles.map((file) => ({
      fileName: file.originalname,
      filePath: file.path,
      uploadedBy: user.id,
      uploadedAt: new Date(),
    }));

    // Combine kept and new attachments
    const updatedAttachments = [
      ...attachmentsToKeep,
      ...newUploadedAttachments,
    ];

    // Update the PurchaseOrder document
    const updatedPO = await PurchaseOrder.findByIdAndUpdate(
      purchaseOrderId,
      {
        $set: {
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
          paidAmount: mongoose.Types.Decimal128.fromString((po.paidAmount || '0').toString()),
          dueAmount: mongoose.Types.Decimal128.fromString(po.dueAmount.toString()),
          deliveryTerms: po.deliveryTerms || '',
          termsAndConditions: po.termsAndConditions || '',
          attachments: updatedAttachments,
          updatedBy: user.id,
          updatedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedPO) {
      return res.status(404).json({
        success: false,
        message: 'Failed to update purchase order.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Purchase order updated successfully.',
      purchaseOrder: updatedPO,
    });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating purchase order.',
      error: error.message,
    });
  }
};

/**
 * Get Purchase Orders with filters and pagination
 */
exports.getPurchaseOrder = async (req, res) => {
  const user = req.user;

  if (!user || !user.businessId) {
    return res.status(400).json({ success: false, message: 'Invalid user data.' });
  }

  const {
    page = 1,
    limit = 13,
    search,
    status,
    minAmount,
    maxAmount,
    paymentStatus,
  } = req.query;

  const query = { 'business.id': user.businessId, isDeleted: false };

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { poNumber: { $regex: search, $options: 'i' } },
      { 'vendor.name': { $regex: search, $options: 'i' } },
    ];
  }

  if (minAmount || maxAmount) {
    query.grandAmount = {};
    if (minAmount) query.grandAmount.$gte = parseFloat(minAmount);
    if (maxAmount) query.grandAmount.$lte = parseFloat(maxAmount);
  }

  if (paymentStatus) {
    query.paymentStatus = paymentStatus;
  }

  try {
    // Find min and max grand amount for the query
    const maxGrandAmount = await PurchaseOrder.findOne(query)
      .sort({ grandAmount: -1 })
      .select('grandAmount');
    const minGrandAmount = await PurchaseOrder.findOne(query)
      .sort({ grandAmount: 1 })
      .select('grandAmount');

    // Count total purchase orders for pagination
    const totalPurchaseOrders = await PurchaseOrder.countDocuments(query);

    // Fetch purchase orders with selected fields only
    const purchaseOrders = await PurchaseOrder.find(query)
      .select('poNumber orderDate dueDate vendor.name grandAmount')
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
      .limit(parseInt(limit, 10));

    // Transform purchase orders to include formatted fields
    const transformedPurchaseOrders = purchaseOrders.map((po) => ({
      _id: po._id,
      poNumber: po.poNumber,
      orderDate: po.orderDate ? po.orderDate.toISOString().split('T')[0] : '-',
      dueDate: po.dueDate ? po.dueDate.toISOString().split('T')[0] : '-',
      vendorName: po.vendor?.name || '-',
      grandAmount: po.grandAmount ? `${parseFloat(po.grandAmount).toFixed(2)}` : '0.00',
    }));

    res.status(200).json({
      success: true,
      message: 'Purchase orders retrieved successfully.',
      data: {
        purchaseOrders: transformedPurchaseOrders,
        minGrandAmount: minGrandAmount ? parseFloat(minGrandAmount.grandAmount) : 0,
        maxGrandAmount: maxGrandAmount ? parseFloat(maxGrandAmount.grandAmount) : 1000,
        pagination: {
          totalPages: Math.ceil(totalPurchaseOrders / parseInt(limit, 10)),
          currentPage: parseInt(page, 10),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve purchase orders. Please try again later.' });
  }
};

/**
 * Get PO Details based on id
 */
exports.getPurchaseOrderDetails = async (req, res) => {
  try {
    const user = req.user;

    // Validate user object
    if (!user || !user.businessId || !user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid user data.' });
    }

    const { purchaseOrderId } = req.params;

    // Ensure purchaseOrderId is provided
    if (!purchaseOrderId || !mongoose.isValidObjectId(purchaseOrderId)) {
      return res.status(400).json({ success: false, message: 'Valid Purchase Order ID is required.' });
    }

    // Find the purchase order and ensure it belongs to the user's organization
    const purchaseOrder = await PurchaseOrder.findOne({
      _id: purchaseOrderId,
      'business.id': user.businessId,
      isDeleted: false,
    }).lean();

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found or unauthorized access.',
      });
    }

    // Optionally populate vendor details if needed
    const vendor = await Vendor.findOne({ _id: purchaseOrder.vendor.id }).lean();
    if (vendor) {
      purchaseOrder.vendor = {
        ...purchaseOrder.vendor,
        gstin: vendor.taxDetails?.gstin || '',
        gstStatus: vendor.taxDetails?.taxStatus || '',
        state: vendor.taxDetails?.sourceState || '',
        address: vendor.billingAddress?.addressLine1
          ? `${vendor.billingAddress.addressLine1}, ${vendor.billingAddress.city || ''}, ${vendor.billingAddress.state || ''}, ${vendor.billingAddress.country || ''}, ${vendor.billingAddress.postalCode || ''}`
          : '',
        phone: vendor.phone || '',
      };
    }

    // Return the purchase order details
    res.status(200).json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error) {
    console.error('Error fetching purchase order details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase order details.',
      error: error.message,
    });
  }
};

/**
 * View or download an attachment from a purchase order
 */
exports.viewAttachment = async (req, res) => {
  try {
    const user = req.user;
    const { purchaseOrderId, attachmentId } = req.params;
    const { download } = req.query; // Check for download query parameter

    // Validate user
    if (!user || !user.businessId || !user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid user data.' });
    }

    // Validate purchaseOrderId and attachmentId
    if (!mongoose.isValidObjectId(purchaseOrderId) || !mongoose.isValidObjectId(attachmentId)) {
      return res.status(400).json({ success: false, message: 'Valid Purchase Order ID and Attachment ID are required.' });
    }

    // Find the purchase order
    const purchaseOrder = await PurchaseOrder.findOne({
      _id: purchaseOrderId,
      'business.id': user.businessId,
      isDeleted: false,
    }).lean();

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found or unauthorized access.',
      });
    }

    // Find the attachment
    const attachment = purchaseOrder.attachments.find(
      (att) => att._id.toString() === attachmentId
    );

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found.',
      });
    }

    // Resolve the file path
    const filePath = path.resolve(__dirname, '..', '..', attachment.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Attachment file not found on server.',
      });
    }

    // Set content type based on file extension
    const fileExtension = path.extname(attachment.fileName).toLowerCase();
    let contentType;
    if (fileExtension === '.pdf') {
      contentType = 'application/pdf';
    } else if (['.jpg', '.jpeg'].includes(fileExtension)) {
      contentType = 'image/jpeg';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type.',
      });
    }

    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      download === 'true' ? `attachment; filename="${attachment.fileName}"` : `inline; filename="${attachment.fileName}"`
    );

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      res.status(500).json({
        success: false,
        message: 'Error streaming file.',
      });
    });
  } catch (error) {
    console.error('Error processing attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing attachment.',
      error: error.message,
    });
  }
};

/**
 * Delete Purchase Order.
 * Deletes a Purchase Order by its ID, ensuring it belongs to the user's organization.
 */
exports.deletePurchaseOrder = async (req, res) => {
    try {
        const user = req.user;

        // Ensure the user and their businessId are valid
        if (!user || !user.businessId || !user.id) {
            return res.status(400).json({ success: false, message: 'Invalid user data.' });
        }

        const { purchaseOrderId } = req.params;

        // Ensure purchaseOrderId is provided and valid
        if (!purchaseOrderId || !mongoose.isValidObjectId(purchaseOrderId)) {
            return res.status(400).json({ success: false, message: 'Valid Purchase Order ID is required.' });
        }

        // Find the purchase order to ensure it exists and belongs to the user's organization
        const purchaseOrder = await PurchaseOrder.findOne({
            _id: purchaseOrderId,
            'business.id': user.businessId,
            isDeleted: false,
        });

        if (!purchaseOrder) {
            return res.status(404).json({ success: false, message: 'Purchase order not found or unauthorized access.' });
        }

        // Delete associated attachment files from the server
        if (purchaseOrder.attachments && purchaseOrder.attachments.length > 0) {
            for (const attachment of purchaseOrder.attachments) {
                const filePath = path.resolve(__dirname, '..', '..', attachment.filePath);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                    } catch (error) {
                        console.error(`Error deleting file ${filePath}:`, error);
                    }
                }
            }
        }

        // Soft delete the Purchase Order by setting isDeleted to true
        await PurchaseOrder.updateOne(
            { _id: purchaseOrderId },
            { $set: { isDeleted: true, updatedBy: user.id, updatedAt: new Date() } }
        );

        res.status(200).json({
            success: true,
            message: 'Purchase order deleted successfully.',
        });
    } catch (error) {
        console.error('Error deleting purchase order:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while deleting the purchase order.',
            error: error.message,
        });
    }
};
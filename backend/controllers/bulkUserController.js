const xlsx = require('xlsx');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Configure multer for file upload
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `bulk-upload-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
      file.mimetype === 'application/vnd.ms-excel') {
    cb(null, true);
  } else {
    cb(new Error('Only Excel files are allowed'), false);
  }
};

exports.upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

exports.processBulkUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel file',
      });
    }

    // Read the Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Validate required columns
    const requiredColumns = ['name', 'email', 'role'];
    const headers = Object.keys(data[0] || {});
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required columns: ${missingColumns.join(', ')}`,
      });
    }

    // Process each row
    const results = {
      total: data.length,
      success: 0,
      errors: [],
    };
    const createdUsers = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because Excel is 1-indexed and we have a header row

      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: row.email });

        if (existingUser) {
          results.errors.push(`Row ${rowNumber}: User with email ${row.email} already exists`);
          continue;
        }

        // Create new user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('defaultPassword123', salt);

        const newUser = new User({
          name: row.name,
          email: row.email,
          role: row.role.toLowerCase(),
          password: hashedPassword,
        });

        await newUser.save();
        results.success++;
        createdUsers.push({
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        });
      } catch (error) {
        results.errors.push(`Row ${rowNumber}: ${error.message || 'Error processing this row'}`);
      }
    }

    // Clean up the uploaded file
    const fs = require('fs');
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      message: `Successfully uploaded ${results.success} out of ${results.total} users`,
      data: createdUsers,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing bulk upload',
      error: error.message,
    });
  }
};

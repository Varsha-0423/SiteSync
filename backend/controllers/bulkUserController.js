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
        const name = row['Emp Name'] || row.name || `Worker-${code || 'user'}`;
        const code = row.Code || row.code;
        const email = row.email || `${code}@worker.com`;
        const role = row.role ? row.role.toLowerCase() : 'worker';

        const existingUser = await User.findOne({ email });

        if (existingUser) {
          results.errors.push(`Row ${rowNumber}: User with email ${email} already exists`);
          continue;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('defaultPassword123', salt);

        const newUser = new User({
          name,
          email,
          role,
          password: hashedPassword,
        });

        await newUser.save();
        results.success++;
        createdUsers.push({
          _id: newUser._id,
          code,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          division: row.Division,
          payrollMonth: row['Payroll Month'],
          designation: row.Designation,
          job: row.Job,
          daysAttended: row.DaysAttended,
          otHours: row['OT Hours'],
          netSalary: row.NetSalary,
          fixedCost: row['Fixed Cost'],
          totalCost: row['Total cost']
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

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

    // Define Excel column names and their mappings to database fields
    const columnMappings = {
      'Emp Name': 'name',
      'Code': 'code',
      'Division': 'division',
      'Payroll Month': 'payrollMonth',
      'Designation': 'designation',
      'Job': 'job',
      'DaysAttended': 'daysAttended',
      'OT Hours': 'otHours',
      'NetSalary': 'netSalary',
      'Fixed Cost': 'fixedCost',
      'Total cost': 'totalCost'
    };

    // Get the actual column names from the Excel file
    const excelHeaders = Object.keys(data[0] || {});
    
    // Check if all required columns are present in the Excel file
    const requiredColumns = Object.keys(columnMappings);
    const missingColumns = requiredColumns.filter(col => !excelHeaders.includes(col));

    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required columns in Excel: ${missingColumns.join(', ')}`,
      });
    }

    // Map the Excel data to our database fields
    const mappedData = data.map(row => {
      const mappedRow = { role: 'worker' }; // Default role to 'worker' for all uploaded users
      
      // Map each Excel column to our database fields
      for (const [excelCol, dbField] of Object.entries(columnMappings)) {
        if (row[excelCol] !== undefined) {
          mappedRow[dbField] = row[excelCol];
        }
      }
      
      // Generate a placeholder email if not provided
      if (!mappedRow.email && mappedRow.code) {
        // Ensure code is a string before calling toLowerCase()
        const codeStr = String(mappedRow.code).trim();
        mappedRow.email = `${codeStr.toLowerCase().replace(/\s+/g, '')}@company.com`;
      }
      
      // Set default name if not provided
      if (!mappedRow.name && mappedRow.code) {
        const codeStr = String(mappedRow.code).trim();
        mappedRow.name = `Employee ${codeStr}`;
      }
      
      return mappedRow;
    });
    
    // Replace the original data with our mapped data
    data.length = 0;
    data.push(...mappedData);

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
        // Check if user already exists by code or email
        const existingUser = await User.findOne({ 
          $or: [
            { email: row.email },
            { code: row.code }
          ]
        });

        if (existingUser) {
          const conflictField = existingUser.email === row.email ? 'email' : 'code';
          results.errors.push(`Row ${rowNumber}: User with ${conflictField} "${row[conflictField]}" already exists`);
          continue;
        }

        // Create new user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('defaultPassword123', salt);

        const newUser = new User({
          name: row.name,
          code: row.code,
          email: row.email,
          role: row.role.toLowerCase(),
          division: row.division,
          payrollMonth: row.payrollMonth,
          designation: row.designation,
          job: row.job,
          daysAttended: row.daysAttended,
          otHours: row.otHours,
          netSalary: row.netSalary,
          fixedCost: row.fixedCost,
          totalCost: row.totalCost,
          password: hashedPassword,
        });

        await newUser.save();
        results.success++;
        // Create a user object without the password
        const { password, ...userWithoutPassword } = newUser.toObject();
        createdUsers.push(userWithoutPassword);
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

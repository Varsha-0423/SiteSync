import React, { useState } from "react";
import { Tabs, Button, message as antMessage, Table } from 'antd';
import { UploadOutlined, UserOutlined, FileDoneOutlined, FileTextOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import api from "../../api";

const { TabPane } = Tabs;

// Helper function to format dates consistently
const formatDate = (date, includeTime = false) => {
  if (!date) return '-';
  
  try {
    let dateObj;
    if (typeof date === 'string') {
      // Try parsing as ISO string first
      dateObj = new Date(date);
      
      // If that fails, try parsing the specific format from your Excel
      if (isNaN(dateObj.getTime())) {
        // Handle format like "8/2/2025, 4:00:00 am"
        const [datePart, timePart] = date.split(', ');
        if (datePart && timePart) {
          const [month, day, year] = datePart.split('/').map(Number);
          const [time, period] = timePart.split(' ');
          const [hours, minutes, seconds] = time.split(':').map(Number);
          
          let hours24 = hours;
          if (period?.toLowerCase() === 'pm' && hours < 12) {
            hours24 += 12;
          } else if (period?.toLowerCase() === 'am' && hours === 12) {
            hours24 = 0;
          }
          
          dateObj = new Date(year, month - 1, day, hours24, minutes, seconds);
        }
      }
    } else {
      dateObj = date;
    }
    
    if (isNaN(dateObj)) return '-';
    
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = true;
    }
    
    return dateObj.toLocaleString(undefined, options);
  } catch (e) {
    console.error('Error formatting date:', date, e);
    return '-';
  }
};

function AdminUploadExcel() {
  const [activeTab, setActiveTab] = useState('workers');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploadedData, setUploadedData] = useState([]);
  const [loading, setLoading] = useState(false);

  const uploadFile = async () => {
    if (!file) {
      antMessage.warning("Please select a file first");
      return;
    }

    setLoading(true);
    setMessage("");
    setUploadedData([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      let endpoint, successMessage, errorMessage;
      
      if (activeTab === 'workers') {
        endpoint = "/users/bulk-upload";
        successMessage = 'Workers uploaded successfully';
        errorMessage = 'Failed to upload workers';
      } else {
        endpoint = "/tasks/upload-excel";
        successMessage = 'Tasks uploaded successfully';
        errorMessage = 'Failed to upload tasks';
      }
      
      const response = await api.post(endpoint, formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setMessage(successMessage);
        antMessage.success(successMessage);
        
        // Set uploaded data for display
        if (activeTab === 'workers') {
          setUploadedData(response.data.data || []);
        } else {
          // For tasks, we might get an array of created tasks
          setUploadedData(response.data.data || []);
        }
        
        // Show success message with count
        const count = response.data.data?.length || 0;
        if (count > 0) {
          antMessage.success(`Successfully uploaded ${count} ${activeTab}`);
        }
        
        // Handle any errors from the response
        if (response.data.errors && response.data.errors.length > 0) {
          const errorMessages = response.data.errors.join('\n');
          antMessage.warning(`Some rows had issues. See details in the message below.`);
          setMessage(prev => `${prev ? prev + '\n\n' : ''}Errors:\n${errorMessages}`);
        }
      } else {
        throw new Error(response.data.message || errorMessage);
      }
    } catch (err) {
      console.error('Upload error:', err);
      const errorMsg = err.response?.data?.message || 
                     err.message || 
                     `Failed to upload ${activeTab}. Please check the file format and try again.`;
      setMessage(errorMsg);
      antMessage.error(errorMsg);
      setUploadedData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
    setUploadedData([]);
  };

  const taskColumns = [
    {
      title: 'Activity ID',
      dataIndex: 'activityId',
      key: 'activityId',
      width: 250,
    },
    {
      title: 'Activity Name',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 250,
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 150,
      render: (date) => formatDate(date),
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 150,
      render: (date) => formatDate(date),
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 200,
    },
  ];

  const workerColumns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code) => code || '-',
    },
    {
      title: 'Emp Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => name || '-',
    },
    {
      title: 'Division',
      dataIndex: 'division',
      key: 'division',
      render: (division) => division || '-',
    },
    {
      title: 'Payroll Month',
      dataIndex: 'payrollMonth',
      key: 'payrollMonth',
      render: (month) => month || '-',
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
      render: (designation) => designation || '-',
    },
    {
      title: 'Job',
      dataIndex: 'job',
      key: 'job',
      render: (job) => job || '-',
    },
    {
      title: 'Days Attended',
      dataIndex: 'daysAttended',
      key: 'daysAttended',
      render: (days) => days || '-',
    },
    {
      title: 'OT Hours',
      dataIndex: 'otHours',
      key: 'otHours',
      render: (hours) => hours || '-',
    },
    {
      title: 'Net Salary',
      dataIndex: 'netSalary',
      key: 'netSalary',
      render: (salary) => salary || '-',
    },
    {
      title: 'Fixed Cost',
      dataIndex: 'fixedCost',
      key: 'fixedCost',
      render: (cost) => cost || '-',
    },
    {
      title: 'Total Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (total) => total || '-',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => role ? role.charAt(0).toUpperCase() + role.slice(1) : '-',
    },
  ];

  const renderWorkersTable = () => (
    <Table 
      columns={workerColumns} 
      dataSource={uploadedData} 
      rowKey="_id"
      pagination={false}
      style={{ marginTop: '20px' }}
    />
  );

  const renderTasksTable = () => (
    <Table 
      columns={taskColumns}
      dataSource={uploadedData}
      rowKey="_id"
      pagination={false}
      style={{ marginTop: '20px' }}
    />
  );

  const createTaskTemplate = () => {
    const templateData = [
      {
        activityId: 'PI-CN-P1-SS-Sup-1080',
        activityName: 'Trench Works',
        startDate: '25-Oct-25',
        endDate: '07-Nov-25',
        remarks: 'na'
      },
      {
        activityId: 'PI-CN-P1-SS-Sup-1081',
        activityName: 'Cable Installation',
        startDate: '08-Nov-25',
        endDate: '15-Nov-25',
        remarks: 'Priority task'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
    XLSX.writeFile(wb, 'task-import-template.xlsx');
  };

  const renderUploadSection = (type) => (
    <div style={{ margin: '20px 0' }}>
      <input 
        type="file" 
        accept=".xlsx,.xls" 
        onChange={handleFileChange}
        id={`${type}-file-upload`}
        style={{ display: 'none' }}
      />
      <Button
        type="primary"
        onClick={() => document.getElementById(`${type}-file-upload`).click()}
        style={{ marginRight: '10px' }}
        icon={<FileDoneOutlined />}
      >
        Select Excel File
      </Button>
      {file && (
        <span style={{ marginRight: '10px' }}>{file.name}</span>
      )}
      <Button
        type="primary"
        onClick={uploadFile}
        disabled={!file || loading}
        loading={loading}
        icon={<UploadOutlined />}
      >
        {`Upload ${type === 'workers' ? 'Workers' : 'Tasks'}`}
      </Button>
      
      {activeTab === 'tasks' && (
        <div style={{ marginTop: '20px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '4px' }}>
          <h4>Excel File Requirements:</h4>
          <ul>
            <li>Required columns: <strong>activityId, activityName, startDate, endDate</strong></li>
            <li>Optional column: <strong>remarks</strong></li>
            <li>Date format: DD-Mon-YY (e.g., 25-Oct-25)</li>
          </ul>
          <Button type="link" onClick={createTaskTemplate} style={{ padding: 0 }}>
            Download Template
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <h2>Bulk Upload</h2>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <span>
              <UserOutlined />
              Workers
            </span>
          }
          key="workers"
        >
          {renderUploadSection('workers')}
          {uploadedData.length > 0 && renderWorkersTable()}
          {message && (
            <div style={{ marginTop: '20px', whiteSpace: 'pre-line' }}>
              {message}
            </div>
          )}
        </TabPane>
        <TabPane
          tab={
            <span>
              <FileTextOutlined />
              Tasks
            </span>
          }
          key="tasks"
        >
          {renderUploadSection('tasks')}
          {uploadedData.length > 0 && renderTasksTable()}
          {message && (
            <div style={{ marginTop: '20px', whiteSpace: 'pre-line' }}>
              {message}
            </div>
          )}
        </TabPane>
      </Tabs>

    </div>
  );
}

export default AdminUploadExcel;

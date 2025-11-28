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
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Task Name',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      align: 'center',
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
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Medium',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => status ? status.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ') : 'Pending',
    },
  ];

  const workerColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => name || '-',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => email || '-',
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

  const tableHeaderStyle = {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '1px solid #ddd',
    fontWeight: 'bold',
    backgroundColor: '#f1f1f1',
  };

  const tableCellStyle = {
    border: '1px solid #ddd',
    padding: '10px',
    verticalAlign: 'top'
  };

  const createTaskTemplate = () => {
    const templateData = [
      {
        taskName: 'Sample Task 1',
        description: 'This is a sample task',
        date: new Date().toISOString().split('T')[0],
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'medium',
        status: 'pending'
      },
      {
        taskName: 'Sample Task 2',
        description: 'Another sample task',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'high',
        status: 'pending'
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
            <li>Required columns: <strong>taskName, description, date, priority, startDate, endDate</strong></li>
            <li>Date format: YYYY-MM-DD or MM/DD/YYYY</li>
            <li>Priority must be one of: low, medium, high</li>
          </ul>
          <p style={{ marginTop: '10px' }}>
            <a href="/templates/task-import-template.xlsx" download>Download Template</a>
          </p>
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

import React, { useState } from "react";
import { Tabs, Button, message as antMessage } from 'antd';
import { UploadOutlined, UserOutlined, FileDoneOutlined } from '@ant-design/icons';
import api from "../../api";

const { TabPane } = Tabs;

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
      const endpoint = activeTab === 'workers' 
        ? "/users/upload-excel" 
        : "/tasks/upload-excel";
      
      const response = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setMessage(response.data.message);
      setUploadedData(response.data.data || []);
      
      if (response.data.errors && response.data.errors.length > 0) {
        antMessage.warning(`Some rows had issues: ${response.data.errors.join(", ")}`);
      } else {
        antMessage.success(`Successfully uploaded ${response.data.data?.length || 0} records`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      const errorMsg = err.response?.data?.message || "Upload failed. Please check the file format and try again.";
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

  const renderWorkersTable = () => (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
      <thead>
        <tr style={{ backgroundColor: '#f8f9fa' }}>
          <th style={tableHeaderStyle}>Name</th>
          <th style={tableHeaderStyle}>Email</th>
          <th style={tableHeaderStyle}>Role</th>
          <th style={tableHeaderStyle}>Created At</th>
        </tr>
      </thead>
      <tbody>
        {uploadedData.map((user, index) => (
          <tr key={user._id || index}>
            <td style={tableCellStyle}>{user.name}</td>
            <td style={tableCellStyle}>{user.email}</td>
            <td style={tableCellStyle}>{user.role || 'worker'}</td>
            <td style={tableCellStyle}>
              {new Date(user.createdAt).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderTasksTable = () => (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
      <thead>
        <tr style={{ backgroundColor: '#f8f9fa' }}>
          <th style={tableHeaderStyle}>Task Name</th>
          <th style={tableHeaderStyle}>Description</th>
          <th style={tableHeaderStyle}>Due Date</th>
          <th style={tableHeaderStyle}>Priority</th>
          <th style={tableHeaderStyle}>Status</th>
        </tr>
      </thead>
      <tbody>
        {uploadedData.map((task, index) => (
          <tr key={task._id || index}>
            <td style={tableCellStyle}>{task.taskName}</td>
            <td style={tableCellStyle}>{task.description || '-'}</td>
            <td style={tableCellStyle}>
              {task.date ? new Date(task.date).toLocaleDateString() : '-'}
            </td>
            <td style={tableCellStyle}>{task.priority || 'medium'}</td>
            <td style={tableCellStyle}>{task.status || 'pending'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const tableHeaderStyle = {
    border: '1px solid #ddd',
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#f0f2f5',
    fontWeight: '600'
  };

  const tableCellStyle = {
    border: '1px solid #ddd',
    padding: '10px',
    verticalAlign: 'top'
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Admin: Upload Data</h2>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        style={{ marginBottom: '24px' }}
      >
        <TabPane
          tab={
            <span>
              <UserOutlined />
              Workers
            </span>
          }
          key="workers"
        >
          <div style={{ margin: '20px 0' }}>
            <p>Upload an Excel file with worker details. Required columns: name, email, role</p>
          </div>
        </TabPane>
        <TabPane
          tab={
            <span>
              <FileDoneOutlined />
              Tasks
            </span>
          }
          key="tasks"
        >
          <div style={{ margin: '20px 0' }}>
            <p>Upload an Excel file with task details. Required columns: taskName, description, date, priority</p>
          </div>
        </TabPane>
      </Tabs>

      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".xlsx,.xls"
          style={{ padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
        />
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={uploadFile}
          loading={loading}
          disabled={!file}
        >
          {`Upload ${activeTab === 'workers' ? 'Workers' : 'Tasks'}`}
        </Button>
      </div>

      {message && (
        <div style={{
          margin: '20px 0',
          padding: '12px',
          backgroundColor: message.toLowerCase().includes('fail') ? '#fff2f0' : '#f6ffed',
          border: `1px solid ${message.toLowerCase().includes('fail') ? '#ffccc7' : '#b7eb8f'}`,
          borderRadius: '4px',
          color: message.toLowerCase().includes('fail') ? '#ff4d4f' : '#52c41a'
        }}>
          {message}
        </div>
      )}

      {uploadedData.length > 0 && (
        <div style={{ marginTop: '24px', overflowX: 'auto' }}>
          <h3>Uploaded {activeTab === 'workers' ? 'Workers' : 'Tasks'} ({uploadedData.length})</h3>
          {activeTab === 'workers' ? renderWorkersTable() : renderTasksTable()}
        </div>
      )}
    </div>
  );
}

export default AdminUploadExcel;

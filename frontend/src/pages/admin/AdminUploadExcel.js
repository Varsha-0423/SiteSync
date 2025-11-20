import React, { useState } from "react";
import api from "../../api";

function AdminUploadExcel() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploadedTasks, setUploadedTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const uploadExcel = async () => {
    if (!file) {
      setMessage("Please select a file first");
      return;
    }

    setLoading(true);
    setMessage("");
    setUploadedTasks([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/tasks/upload-excel", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setMessage(response.data.message);
      setUploadedTasks(response.data.data || []);
      
      if (response.data.errors && response.data.errors.length > 0) {
        setMessage(prev => prev + ". Some rows had errors: " + response.data.errors.join(", "));
      }
    } catch (err) {
      console.log(err);
      setMessage(err.response?.data?.message || "Upload failed");
      setUploadedTasks([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Admin: Upload Excel</h2>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          accept=".xlsx,.xls"
        />
        <button 
          onClick={uploadExcel}
          disabled={loading || !file}
          style={{ 
            marginLeft: '10px', 
            padding: '8px 16px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {message && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '10px',
          backgroundColor: message.includes('failed') || message.includes('error') ? '#f8d7da' : '#d4edda',
          color: message.includes('failed') || message.includes('error') ? '#721c24' : '#155724',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      {uploadedTasks.length > 0 && (
        <div>
          <h3>Uploaded Tasks ({uploadedTasks.length})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Task Name</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Description</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Date</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Priority</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Assigned Workers</th>
              </tr>
            </thead>
            <tbody>
              {uploadedTasks.map((task, index) => (
                <tr key={task._id || index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{task.taskName}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{task.description || '-'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {new Date(task.date).toLocaleDateString()}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: task.priority === 'high' ? '#dc3545' : task.priority === 'medium' ? '#ffc107' : '#28a745',
                      color: 'white'
                    }}>
                      {task.priority}
                    </span>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: task.status === 'pending' ? '#6c757d' : task.status === 'on-schedule' ? '#28a745' : task.status === 'behind' ? '#dc3545' : '#17a2b8',
                      color: 'white'
                    }}>
                      {task.status}
                    </span>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {task.assignedWorkers && task.assignedWorkers.length > 0 
                      ? task.assignedWorkers.map(w => w.name).join(', ') 
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminUploadExcel;

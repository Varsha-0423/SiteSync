import { useState, useEffect } from "react";
import api from "../../api";

function WorkerSubmit({ task: taskId, onClose, onWorkSubmitted }) {
  const [formData, setFormData] = useState({
    worker: "",
    status: "completed",
    quantity: "",
    unit: "",
    description: "",
    attachments: []
  });
  const [workers, setWorkers] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch workers list
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const response = await api.get("/users?role=worker");
        setWorkers(response.data.data || []);
      } catch (error) {
        console.error("Error fetching workers:", error);
        setMessage("Failed to load workers");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  const units = [
    { value: "kg", label: "Kilograms (kg)" },
    { value: "g", label: "Grams (g)" },
    { value: "l", label: "Liters (l)" },
    { value: "ml", label: "Milliliters (ml)" },
    { value: "m", label: "Meters (m)" },
    { value: "cm", label: "Centimeters (cm)" },
    { value: "pcs", label: "Pieces" },
    { value: "box", label: "Boxes" },
    { value: "set", label: "Sets" },
  ];

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'attachments') {
      setFormData(prev => ({
        ...prev,
        attachments: Array.from(files)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.worker) {
      setMessage({ type: 'error', text: "Please select a worker" });
      return;
    }
    
    if (!formData.quantity) {
      setMessage({ type: 'error', text: "Please enter quantity" });
      return;
    }

    if (!formData.unit) {
      setMessage({ type: 'error', text: "Please select a unit of measurement" });
      return;
    }

    if (!formData.description) {
      setMessage({ type: 'error', text: "Please enter a work description" });
      return;
    }
    
    try {
      setMessage({ type: 'info', text: "Submitting work..." });
      
      // First, upload files if any
      let photoUrls = [];
      
      if (formData.attachments && formData.attachments.length > 0) {
        console.log('Starting file uploads...');
        try {
          const uploadPromises = formData.attachments.map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            
            // Use the correct upload endpoint
            const response = await api.post('/api/uploads', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // Include auth token
              }
            });
            
            // Handle the response based on the actual API response structure
            if (response.data && response.data.success && response.data.url) {
              return response.data.url;
            } else if (response.data && response.data.file && response.data.file.path) {
              // Handle case where URL is in file.path
              return response.data.file.path;
            }
            
            throw new Error('Invalid response from server');
          });
          
          photoUrls = (await Promise.all(uploadPromises)).filter(url => url);
          
          if (photoUrls.length === 0) {
            console.warn('No files were successfully uploaded');
            // Don't fail the entire submission if no files were uploaded
            // Just continue with an empty photoUrls array
          }
        } catch (uploadError) {
          console.error('Error uploading files:', uploadError);
          // Instead of throwing, log the error and continue with empty photoUrls
          // This allows the work submission to continue even if file upload fails
          console.warn('File upload failed, but continuing with work submission');
          photoUrls = [];
        }
      }
      
      // Prepare work submission data
      const workData = {
        task: taskId,
        status: formData.status,
        updateText: formData.description,
        photoUrl: photoUrls[0] || '', // For backward compatibility
        photoUrls: photoUrls, // New field for multiple images
        quantity: formData.quantity,
        unit: formData.unit,
        worker: formData.worker
      };
      
      // Submit work report
      const response = await api.post('/work/submit', workData);
      
      setMessage({ 
        type: 'success', 
        text: "Work submitted successfully!" 
      });
      
      // Update task status in parent component
      if (onWorkSubmitted && response.data && response.data.task) {
        onWorkSubmitted(response.data.task._id, formData.status);
      } else if (onWorkSubmitted) {
        onWorkSubmitted(taskId, formData.status);
      }
      
      // Close the popup after 2 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
        if (onClose) onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting work:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to submit work. Please try again.';
      
      setMessage({ 
        type: 'error', 
        text: errorMessage 
      });
    }
  };
  
  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    marginBottom: '15px',
    fontSize: '14px',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '600',
    color: '#333'
  };

  const buttonStyle = (bgColor) => ({
    padding: '10px 20px',
    backgroundColor: bgColor,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s',
    '&:hover': {
      opacity: 0.9
    }
  });

  if (isLoading) {
    return <div>Loading workers...</div>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Worker Selection */}
      <div>
        <label style={labelStyle}>Select Worker *</label>
        <select 
          name="worker"
          value={formData.worker}
          onChange={handleChange}
          style={inputStyle}
          required
        >
          <option value="">-- Select Worker --</option>
          {workers.map(worker => (
            <option key={worker._id} value={worker._id}>
              {worker.name} ({worker.employeeId || worker._id})
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {/* Status */}
        <div>
          <label style={labelStyle}>Status *</label>
          <select 
            name="status"
            value={formData.status}
            onChange={handleChange}
            style={inputStyle}
            required
          >
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="on-hold">On Hold</option>
            <option value="issues">Issues</option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label style={labelStyle}>Quantity *</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Enter quantity"
            min="0"
            step="0.01"
            style={inputStyle}
            required
          />
        </div>
      </div>

      {/* Unit of Measurement */}
      <div>
        <label style={labelStyle}>Unit of Measurement *</label>
        <select 
          name="unit"
          value={formData.unit}
          onChange={handleChange}
          style={inputStyle}
          required
        >
          <option value="">-- Select Unit --</option>
          {units.map(unit => (
            <option key={unit.value} value={unit.value}>
              {unit.label}
            </option>
          ))}
        </select>
      </div>

      {/* Work Description */}
      <div>
        <label style={labelStyle}>Work Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the work done..."
          rows="4"
          style={{
            ...inputStyle,
            minHeight: '100px',
            resize: 'vertical'
          }}
          required
        />
      </div>

      {/* Attachments */}
      <div>
        <label style={labelStyle}>Attachments</label>
        <div style={{
          border: '2px dashed #ddd',
          borderRadius: '4px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '15px',
          backgroundColor: '#f9f9f9'
        }}>
          <input
            type="file"
            name="attachments"
            onChange={handleChange}
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx"
            style={{ display: 'none' }}
            id="file-upload"
          />
          <label 
            htmlFor="file-upload"
            style={{
              cursor: 'pointer',
              display: 'block',
              padding: '10px',
              color: '#666'
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📎</div>
            <div>Click to upload or drag and drop</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
              Images, Videos, PDF, DOC (max 10MB)
            </div>
          </label>
        </div>

        {/* Preview of selected files */}
        {formData.attachments.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <div style={labelStyle}>Selected Files:</div>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px' }}>
              {formData.attachments.map((file, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderBottom: '1px solid #eee',
                  backgroundColor: '#fff'
                }}>
                  <span style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1
                  }}>
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      cursor: 'pointer',
                      padding: '0 5px',
                      marginLeft: '10px'
                    }}
                    title="Remove file"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Message Display */}
      {message.text && (
        <div style={{
          padding: '12px',
          margin: '15px 0',
          backgroundColor: message.type === 'error' ? '#f8d7da' : 
                          message.type === 'success' ? '#d4edda' : 
                          '#e2f0fd',
          color: message.type === 'error' ? '#721c24' : 
                message.type === 'success' ? '#155724' :
                '#004085',
          borderRadius: '4px',
          textAlign: 'center',
          fontSize: '14px',
          border: message.type === 'error' ? '1px solid #f5c6cb' : 
                 message.type === 'success' ? '1px solid #c3e6cb' :
                 '1px solid #b8daff'
        }}>
          {message.text}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '20px',
        paddingTop: '15px',
        borderTop: '1px solid #eee'
      }}>
        <button 
          type="button"
          onClick={onClose}
          style={buttonStyle('#6c757d')}
        >
          Cancel
        </button>
        <button 
          type="submit"
          style={buttonStyle('#28a745')}
        >
          Submit Work
        </button>
      </div>
    </form>
  );
}

export default WorkerSubmit;


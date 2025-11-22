import React, { useState, useEffect } from 'react';
import { Calendar, Modal, Form, Input, Select, Button, message, List, Badge } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import moment from 'moment';
import api from '../../api';

const { Option } = Select;
const { TextArea } = Input;

const TaskCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(moment());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Fetch tasks for the selected date
  const fetchTasks = async (date) => {
    try {
      setLoading(true);
      const dateStr = moment(date).format('YYYY-MM-DD');
      const response = await api.get('/tasks', {
        params: { date: dateStr }
      });
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      message.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users for assignment
  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to load users');
    }
  };

  useEffect(() => {
    fetchTasks(selectedDate);
    fetchUsers();
  }, [selectedDate]);

  const handleDateSelect = (value) => {
    // Make sure we're working with the start of the day to avoid timezone issues
    const selected = moment(value).startOf('day');
    setSelectedDate(selected);
    fetchTasks(selected);
  };

  const showAddTaskModal = () => {
    form.resetFields();
    form.setFieldsValue({
      date: selectedDate.format('YYYY-MM-DD'),
      priority: 'medium'
    });
    setIsModalVisible(true);
  };

  const handleAddTask = async (values) => {
    try {
      await api.post('/tasks', {
        ...values,
        status: 'pending',
        assignedWorkers: values.assignedWorkers || []
      });
      message.success('Task added successfully');
      setIsModalVisible(false);
      fetchTasks(selectedDate);
    } catch (error) {
      console.error('Error adding task:', error);
      message.error('Failed to add task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      message.success('Task status updated');
      fetchTasks(selectedDate);
    } catch (error) {
      console.error('Error updating task status:', error);
      message.error('Failed to update task status');
    }
  };

  // Custom cell renderer for the calendar
  const dateCellRender = (value) => {
    const dateStr = moment(value).format('YYYY-MM-DD');
    const dayTasks = tasks.filter(task => {
      const taskDate = moment(task.date).format('YYYY-MM-DD');
      return taskDate === dateStr;
    });
    
    return (
      <div 
        style={{ 
          minHeight: '80px',
          cursor: 'pointer',
          backgroundColor: dateStr === moment(selectedDate).format('YYYY-MM-DD') ? '#e6f7ff' : 'transparent',
          borderRadius: '4px',
          padding: '4px'
        }}
      >
        <div style={{ textAlign: 'right', marginBottom: '4px' }}>
          {value.date()}
        </div>
        <div style={{ maxHeight: '60px', overflow: 'hidden' }}>
          {dayTasks.slice(0, 2).map(task => (
            <div key={task._id} style={{ margin: '2px 0' }}>
              <Badge
                status={task.status === 'completed' ? 'success' : 'processing'}
                text={task.taskName}
                style={{ 
                  fontSize: '10px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block'
                }}
              />
            </div>
          ))}
          {dayTasks.length > 2 && (
            <div style={{ fontSize: '10px', color: '#1890ff' }}>+{dayTasks.length - 2} more</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Task Calendar</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={showAddTaskModal}
        >
          Add Task
        </Button>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px' }}>
        <Calendar 
          value={selectedDate}
          onSelect={handleDateSelect}
          dateCellRender={dateCellRender}
          onPanelChange={handleDateSelect}
          headerRender={({ value, type, onChange, onTypeChange }) => {
            const current = value.clone();
            const localeData = value.localeData();
            const monthOptions = [];
            
            for (let i = 0; i < 12; i++) {
              monthOptions.push(
                <Option key={i} value={i}>
                  {localeData.monthsShort(current.month(i))}
                </Option>
              );
            }
            
            const year = value.year();
            const month = value.month();
            const options = [];
            
            for (let i = year - 10; i < year + 10; i++) {
              options.push(
                <Option key={i} value={i}>
                  {i}
                </Option>
              );
            }
            
            return (
              <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Button 
                    type="text" 
                    onClick={() => {
                      const now = moment();
                      setSelectedDate(now);
                      fetchTasks(now);
                    }}
                  >
                    Today
                  </Button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Select
                    size="small"
                    value={month}
                    onChange={newMonth => {
                      const newValue = value.clone().month(newMonth);
                      setSelectedDate(newValue);
                    }}
                    style={{ width: '100px' }}
                  >
                    {monthOptions}
                  </Select>
                  <Select
                    size="small"
                    value={year}
                    onChange={newYear => {
                      const newValue = value.clone().year(newYear);
                      setSelectedDate(newValue);
                    }}
                    style={{ width: '100px' }}
                  >
                    {options}
                  </Select>
                </div>
              </div>
            );
          }}
        />
      </div>

      <div style={{ marginTop: '24px' }}>
        <h3>Tasks for {selectedDate.format('MMMM D, YYYY')}</h3>
        <List
          itemLayout="horizontal"
          dataSource={tasks.filter(task => task.date === selectedDate.format('YYYY-MM-DD'))}
          loading={loading}
          renderItem={task => (
            <List.Item
              actions={[
                task.status !== 'completed' ? (
                  <Button 
                    type="link" 
                    icon={<CheckOutlined />} 
                    onClick={() => handleStatusChange(task._id, 'completed')}
                  >
                    Complete
                  </Button>
                ) : (
                  <Button 
                    type="text" 
                    danger 
                    icon={<CloseOutlined />} 
                    onClick={() => handleStatusChange(task._id, 'pending')}
                  >
                    Reopen
                  </Button>
                )
              ]}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Badge
                      status={task.status === 'completed' ? 'success' : 'processing'}
                      style={{ marginRight: '8px' }}
                    />
                    <span>{task.taskName}</span>
                    <span style={{ 
                      marginLeft: '12px', 
                      fontSize: '12px', 
                      color: task.priority === 'high' ? '#f5222d' : task.priority === 'medium' ? '#faad14' : '#52c41a'
                    }}>
                      ({task.priority})
                    </span>
                  </div>
                }
                description={
                  <div>
                    <div>{task.description}</div>
                    {task.assignedWorkers && task.assignedWorkers.length > 0 && (
                      <div style={{ marginTop: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          Assigned to: {task.assignedWorkers.map(u => u.name).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>

      <Modal
        title={`Add Task for ${selectedDate.format('MMMM D, YYYY')}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddTask}
        >
          <Form.Item
            name="taskName"
            label="Task Name"
            rules={[{ required: true, message: 'Please enter task name' }]}
          >
            <Input placeholder="Enter task name" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter task description" />
          </Form.Item>
          
          <Form.Item
            name="priority"
            label="Priority"
            initialValue="medium"
          >
            <Select>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="assignedWorkers"
            label="Assign To"
          >
            <Select mode="multiple" placeholder="Select users">
              {users.map(user => (
                <Option key={user._id} value={user._id}>
                  {user.name} ({user.role})
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save Task
            </Button>
            <Button style={{ marginLeft: '8px' }} onClick={() => setIsModalVisible(false)}>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskCalendar;

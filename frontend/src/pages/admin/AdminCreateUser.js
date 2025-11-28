import React, { useState, useEffect } from "react";
import { Table, Input, Button, Select, Space, message, Card, Row, Col } from "antd";
import { SearchOutlined, UserAddOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api";
const { Option } = Select;

function AdminCreateUser() {
  const navigate = useNavigate();
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "supervisor"
  });
  
  // Users list states
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Fetch users with pagination and search
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");
      // Exclude workers from the list
      let filteredUsers = response.data.data.filter(user => user.role !== 'worker');
      
      // Apply role filter
      if (roleFilter !== "all") {
        filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
      }
      
      // Apply search filter
      if (searchText) {
        filteredUsers = filteredUsers.filter(user => 
          user.name.toLowerCase().includes(searchText.toLowerCase()) ||
          user.email.toLowerCase().includes(searchText.toLowerCase())
        );
      }
      
      setUsers(filteredUsers);
      setPagination({
        ...pagination,
        total: filteredUsers.length,
        current: 1,
      });
    } catch (error) {
      message.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle role select change
  const handleRoleChange = (value) => {
    setFormData({
      ...formData,
      role: value,
    });
  };

  // Create new user
  const createUser = async () => {
    try {
      const response = await api.post("/users", formData);
      
      if (response.data) {
        message.success({
          content: 'User created successfully!',
          duration: 3,
          style: {
            marginTop: '50vh',
          },
        });
        
        // Reset form
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "worker"
        });
        
        // Refresh user list
        fetchUsers(pagination.current, searchText);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      message.error({
        content: error.response?.data?.message || "Failed to create user. Please try again.",
        duration: 5,
      });
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => role.charAt(0).toUpperCase() + role.slice(1)
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString()
    },
  ];

  // Handle table pagination change
  const handleTableChange = (pagination) => {
    fetchUsers();
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    fetchUsers();
  };

  // Handle role filter
  const handleRoleFilter = (value) => {
    setRoleFilter(value);
  };

  // Handle row click to navigate to user details
  const handleRowClick = (record) => {
    navigate(`/user/${record._id}`);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card title="Create New User">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Input
                placeholder="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
              <Input
                placeholder="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              <Input.Password
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
              />
              <Select
                placeholder="Select role"
                value={formData.role}
                onChange={(value) => setFormData({ ...formData, role: value })}
              >
                <Option value="admin">Admin</Option>
                <Option value="supervisor">Supervisor</Option>
              </Select>
              <Button 
                type="primary" 
                onClick={createUser}
                icon={<UserAddOutlined />}
                block
              >
                Create User
              </Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span>User List</span>
                <Space>
                  <Select
                    placeholder="Filter by role"
                    style={{ width: 180, marginRight: 8 }}
                    value={roleFilter}
                    onChange={value => {
                      setRoleFilter(value);
                      setPagination({ ...pagination, current: 1 });
                    }}
                  >
                    <Option value="all">All Roles</Option>
                    <Option value="admin">Admin</Option>
                    <Option value="supervisor">Supervisor</Option>
                  </Select>
                  <Input
                    placeholder="Search users..."
                    prefix={<SearchOutlined />}
                    style={{ width: 200 }}
                    onChange={(e) => handleSearch(e.target.value)}
                    value={searchText}
                    allowClear
                  />
                </Space>
              </div>
            }
          >
            <Table
              columns={columns}
              dataSource={users}
              rowKey="_id"
              loading={loading}
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
                style: { cursor: 'pointer' }
              })}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`
              }}
              onChange={handleTableChange}
              scroll={{ x: true }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default AdminCreateUser;

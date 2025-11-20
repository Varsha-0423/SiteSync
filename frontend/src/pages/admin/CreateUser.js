import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

function AdminCreateUser() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("worker");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
        role
      });
      setMessage("User created successfully!");
      // Clear form
      setName("");
      setEmail("");
      setPassword("");
      setRole("worker");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to create user");
    }
  };

  return (
    <div className="admin-create-user">
      <h2>Create New User</h2>
      <form onSubmit={createUser}>
        <div>
          <input 
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <input 
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <input 
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="worker">Worker</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit">Create User</button>
      </form>
      {message && <p className="message">{message}</p>}
      <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
    </div>
  );
}

export default AdminCreateUser;

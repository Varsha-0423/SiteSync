import { useState } from "react";
import api from "../../api";

function WorkerSubmit() {
  const [worker, setWorker] = useState("");
  const [task, setTask] = useState("");
  const [status, setStatus] = useState("completed");
  const [updateText, setUpdateText] = useState("");

  const submitWork = async () => {
    try {
      const res = await api.post("/work/submit", {
        worker,
        task,
        status,
        updateText,
        photoUrl: "temp-url" // Firebase later
      });

      alert("Work submitted!");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      <h2>Worker Work Submission</h2>

      <input 
        placeholder="Worker ID" 
        onChange={(e) => setWorker(e.target.value)} 
      />

      <input 
        placeholder="Task ID" 
        onChange={(e) => setTask(e.target.value)} 
      />

      <select onChange={(e) => setStatus(e.target.value)}>
        <option value="completed">Completed</option>
        <option value="half-done">Half Done</option>
      </select>

      <textarea
        placeholder="Work Update"
        onChange={(e) => setUpdateText(e.target.value)}
      />

      <button onClick={submitWork}>
        Submit Work
      </button>
    </div>
  );
}

export default WorkerSubmit;


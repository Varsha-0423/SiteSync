import React from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Users, BarChart } from "lucide-react"; // icons

function SupervisorDashboard() {
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Supervisor Dashboard
          </h1>
          <p className="text-gray-500 text-sm">Welcome back 👋</p>
        </div>

        {/* Cards Section */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Task Card */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-indigo-500 text-white">
                <ClipboardList size={28} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Tasks Assigned</p>
                <h2 className="text-3xl font-bold text-gray-900">24</h2>
              </div>
            </div>
            <Link
              to="/supervisor/tasks"
              className="block mt-4 text-indigo-600 font-semibold hover:underline"
            >
              View all tasks →
            </Link>
          </div>

          {/* Team Card */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-green-500 text-white">
                <Users size={28} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Team Members</p>
                <h2 className="text-3xl font-bold text-gray-900">8</h2>
              </div>
            </div>
            <Link
              to="/supervisor/team"
              className="block mt-4 text-green-600 font-semibold hover:underline"
            >
              View team →
            </Link>
          </div>

          {/* Reports Card */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-yellow-500 text-white">
                <BarChart size={28} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Reports</p>
                <h2 className="text-3xl font-bold text-gray-900">5</h2>
              </div>
            </div>
            <Link
              to="/supervisor/reports"
              className="block mt-4 text-yellow-600 font-semibold hover:underline"
            >
              View reports →
            </Link>
          </div>

        </div>

        {/* Recent Activity Section */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>

          <div className="bg-white rounded-2xl shadow-md border border-gray-100">
            <ul className="divide-y divide-gray-200">

              {/* Example Activity Item */}
              <li className="p-5 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <p className="text-indigo-600 font-medium">
                    Task #1234 marked as completed
                  </p>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    Completed
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-sm text-gray-500">
                  <p>Completed by John Doe</p>
                  <p>2 hours ago</p>
                </div>
              </li>

              {/* Add more items dynamically later */}

            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

export default SupervisorDashboard;
